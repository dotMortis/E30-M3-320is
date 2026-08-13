import type { Vault } from "obsidian";
import { readFileSync } from "node:fs";
import { search, type AnyOrama } from "@orama/orama";
import { loadTextIndex, loadVectorShard, type RagMetadata } from "./orama-schema";
import { requestUrlWithRetry } from "./http-retry";
import type { GroundingChunk, GroundingSupport } from "./gemini";
import type { RagChatSettings } from "./settings";

/** Query-time task prefix for gemini-embedding-2 (see PLAN.md - this model has
 * no task_type EmbedContentConfig param; steering is a text prefix instead). */
const QUERY_PREFIX_TMPL = "task: search result | query: {content}";

/** Large enough to capture "every" ranked candidate on this corpus size, so
 * the federated merge below sees the same full candidate set Orama's own
 * single-DB hybrid mode would internally, before slicing down to topK. */
const CANDIDATE_POOL_LIMIT = 5000;

/**
 * NOTE (superseded, kept for history): this fixed 0.5/0.5 min-max score-sum
 * split used to mirror Orama's own search-hybrid.js mergeAndRankResults().
 * Benchmarked against 12 real natural-language queries (see
 * .pipeline/rag/PLAN.md's "Retrieval benchmark" section) it had a serious
 * flaw: min-max normalizing each leg to its OWN [0,1] range and summing
 * means a document that is the single BEST match on one leg (e.g. the
 * correct page, ranked #1 by the vector leg but entirely absent from BM25
 * because of German compound/separable-verb mismatches) caps at 0.5,
 * while a document that is merely mediocre on BOTH legs can approach 1.0.
 * This was confirmed to bury the correct answer for real queries even
 * after the similarity-threshold fix. Replaced by Reciprocal Rank Fusion
 * (see rrfMerge below), which does not have this pathology.
 */

/**
 * Reciprocal Rank Fusion: score = sum over legs of 1/(k + rank), rank is
 * 1-based within that leg's own ranking. Unlike min-max score fusion, a
 * document ranked #1 in ONE leg gets a strong, fixed contribution
 * regardless of whether/how it ranks in the other leg — it can't be
 * buried by a document that's merely mediocre-but-present on both legs.
 * Small k (1-10) was empirically best on this corpus size (~2822 rows);
 * the common literature default of k=60 assumes much larger candidate
 * pools and, benchmarked here, underperformed noticeably (see PLAN.md).
 */
function rrfMerge(
  textHitsSorted: { document: RagMetadata; score: number }[],
  vectorHitsSorted: { document: RagMetadata; score: number }[],
  k: number
): { score: number; doc: RagMetadata }[] {
  const scores = new Map<string, { score: number; doc: RagMetadata }>();
  textHitsSorted.forEach((h, i) => {
    const rowId = h.document.rowId;
    const existing = scores.get(rowId);
    scores.set(rowId, { score: (existing?.score ?? 0) + 1 / (k + i + 1), doc: existing?.doc ?? h.document });
  });
  vectorHitsSorted.forEach((h, i) => {
    const rowId = h.document.rowId;
    const existing = scores.get(rowId);
    scores.set(rowId, { score: (existing?.score ?? 0) + 1 / (k + i + 1), doc: existing?.doc ?? h.document });
  });
  return [...scores.values()].sort((a, b) => b.score - a.score);
}

export interface RagManifest {
  embeddingModel: string;
  /** Full-fidelity dims (3072) - no Matryoshka truncation, see orama-schema.ts. */
  embeddingDims: number;
  docPrefixTemplate: string;
  queryPrefixTemplate: string;
  generationModel: string;
  noteCount: number;
  textChunkCount: number;
  multimodalCount: number;
  /** Count of chunks from standalone reference docs (Sonderwerkzeuge.md,
   * Sicherheitshinweise.md, the Glossar letter-files, Technische-Daten.md -
   * see chunk.py's REFERENCE_DOCS). */
  referenceChunkCount: number;
  referenceDocCount: number;
  /** rowId -> { text, titel, notePath } sidecar for `kind: "reference"` rows
   * - see getIndices()/expandToParentNotes() and reference-chunks.json's own
   * comment in build_orama.mjs for why these can't use the page-note
   * full-file vault.read expansion. */
  referenceChunksFile: string;
  totalRowCount: number;
  textIndexFile: string;
  textIndexBytes: number;
  vectorShardCount: number;
  /** e.g. "rag-index-vectors-{i}.orama.msp" - replace "{i}" with 0..vectorShardCount-1. */
  vectorIndexFilePattern: string;
  vectorShardBytes: number[];
  corpusHash: string;
  chunkedAt: string;
  builtAt: string;
}

export interface RetrievedHit {
  score: number;
  /** Stable identity key shared with the text index + every vector shard
   * (see orama_schema.mjs's buildRowId) - needed to look up a "reference"
   * kind hit's chunk text in the reference-chunks.json sidecar (a
   * vector-only hit has no `text` field of its own to read). */
  rowId: string;
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  kind: "text" | "multimodal" | "reference";
}

export interface ContextBlock {
  notePath: string;
  /** Empty for reference-doc blocks (see chunk.py's REFERENCE_DOCS) - these
   * aren't tied to one scanned manual page, so there's no Seitencode to
   * cite. gemini.ts's SYSTEM_PROMPT instructs the model to cite such blocks
   * by `titel` (format "[Referenz: <titel>]") instead of "[Seite <code>]". */
  seitencode: string;
  sektion: string;
  titel: string;
  fullText: string;
}

/** rowId -> chunk text/titel/notePath, loaded from reference-chunks.json
 * (see build_orama.mjs). Populated only for `kind: "reference"` rows. */
export type ReferenceChunkMap = Map<string, { text: string; titel: string; notePath: string }>;

/** A compact (no full text) search hit shape handed back to the model as a
 * search_manual/search_manual_fuzzy tool response (see agent.ts) - keeps
 * tool round-trip payloads small; the model calls get_manual_page separately
 * if it wants full text for a specific result. */
export interface CompactHit {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
}

export function toCompactHits(hits: RetrievedHit[]): CompactHit[] {
  return hits.map((h) => ({ notePath: h.notePath, seitencode: h.seitencode, sektion: h.sektion, titel: h.titel }));
}

/** A web source surfaced by Gemini's native Google Search grounding tool
 * (see gemini.ts's generateWithTools / groundingMetadata parsing), distinct
 * from ContextBlock (manual pages) - rendered as a separate citation list
 * in the UI (see view.ts). */
export interface WebCitation {
  uri: string;
  title: string;
}

/** One turn of the chat log. Shared between view.ts (UI/history state),
 * gemini.ts (folded into the model's `contents[]` for real multi-turn memory)
 * and workflow.ts (follow-up query resolution). */
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  /** Transient "what's happening right now" label (e.g. "Erweitere Suche …"),
   * shown in the answer box in place of `text` while `text` is still empty -
   * gives live feedback during retrieval/generation instead of a blank
   * bubble. Cleared once real content starts arriving. UI-only: never sent
   * to the model (gemini.ts's buildHistoryContents only reads `text`). */
  status?: string;
  /** Every status line emitted over the course of this turn (baseline
   * retrieval hit count, per-round tool calls + result counts, retry
   * countdowns, etc.) - unlike `status` (which is overwritten each time),
   * this accumulates so the full research trail stays reviewable after the
   * turn finishes (see view.ts's collapsed "Rechercheverlauf" block).
   * UI-only, never sent to the model. */
  statusLog?: string[];
  /** Manual-page citations (see agent.ts's manualCitations). */
  citations?: ContextBlock[];
  /** Web source citations from Google Search grounding (see agent.ts's
   * webCitations) - rendered as a separate list in the UI (view.ts). */
  webCitations?: WebCitation[];
  /** This turn's final-round grounding chunks/supports (see workflow.ts's
   * WorkflowDone doc) - used only for inline web-citation splicing
   * (citation-links.ts's linkifyWebCitations), not for display on their own. */
  webGroundingChunks?: GroundingChunk[];
  webGroundingSupports?: GroundingSupport[];
  /** True if this assistant turn is a paused ask_user clarifying question
   * rather than a final answer - styled distinctly in the UI (view.ts). */
  isClarifying?: boolean;
}

/** A single ranked hit from Vault Search's independent fuzzy/typo/synonym
 * index (see .obsidian/plugins/vault-search/main.js). `rank` is 0-based,
 * best match first - Vault Search's internal scores aren't on a comparable
 * scale to BM25/cosine, so only relative order is used when merging. */
export interface FuzzySearchHit {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  rank: number;
}

/** The public surface Vault Search exposes at
 * app.plugins.plugins["vault-search"].api - kept minimal and pure-data so
 * rag-chat can call it without depending on any of its internals. */
export interface FuzzySearchApi {
  search(
    query: string,
    limit?: number
  ): Promise<{ results: FuzzySearchHit[]; correction: { from: string; to: string } | null }>;
}

/** Validates the shipped manifest against the plugin's settings (embedding-parity
 * guard - see PLAN.md). Returns a list of human-readable warning strings (empty = OK). */
export function validateManifest(manifest: RagManifest, settings: RagChatSettings): string[] {
  const warnings: string[] = [];
  if (manifest.embeddingModel !== settings.embeddingModel) {
    warnings.push(
      `Index was built with embedding model "${manifest.embeddingModel}", but settings specify "${settings.embeddingModel}". Update settings or rebuild the index.`
    );
  }
  if (manifest.embeddingDims !== settings.outputDim) {
    warnings.push(
      `Index was built at ${manifest.embeddingDims} dims (the shipped/query dims), but settings specify ${settings.outputDim}. These MUST match or vector search will silently return garbage. Fix settings.outputDim.`
    );
  }
  return warnings;
}

/** Embeds a user query via the Google gemini-embedding-2 REST API (non-streaming,
 * via Obsidian's CORS-safe requestUrl - no streaming needed here). Retries on
 * transient 429/5xx (see http-retry.ts); `onStatus`, if given, is called once
 * per retry with a live progress label for the UI. */
export async function embedQuery(
  query: string,
  settings: RagChatSettings,
  onStatus?: (status: string) => void
): Promise<number[]> {
  if (!settings.geminiApiKey) {
    throw new Error("Google API key (GEMINI_API_KEY) is required for query embeddings - set it in RAG Chat settings.");
  }
  const prefixed = QUERY_PREFIX_TMPL.replace("{content}", query);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.embeddingModel}:embedContent`;
  const response = await requestUrlWithRetry(
    {
      url,
      method: "POST",
      headers: {
        "x-goog-api-key": settings.geminiApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: { parts: [{ text: prefixed }] },
        outputDimensionality: settings.outputDim,
      }),
    },
    { onStatus, label: "Embedding" }
  );
  const values = response.json?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Unexpected embedContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }
  return values as number[];
}

export interface CachedIndices {
  textDb: AnyOrama;
  vectorDbs: AnyOrama[];
  referenceChunks: ReferenceChunkMap;
}

let cached: CachedIndices | null = null;
let cachedPluginDir: string | null = null;

/** Loads (and caches) the split text index + all vector shards + the
 * reference-chunks.json sidecar from the plugin directory, per the
 * manifest's vectorShardCount/referenceChunksFile. */
export async function getIndices(pluginDir: string, manifest: RagManifest): Promise<CachedIndices> {
  if (cached && cachedPluginDir === pluginDir) return cached;
  const textDb = await loadTextIndex(`${pluginDir}/${manifest.textIndexFile}`);
  const vectorDbs = await Promise.all(
    Array.from({ length: manifest.vectorShardCount }, (_, i) =>
      loadVectorShard(`${pluginDir}/${manifest.vectorIndexFilePattern.replace("{i}", String(i))}`)
    )
  );
  const referenceChunksRaw = JSON.parse(
    readFileSync(`${pluginDir}/${manifest.referenceChunksFile}`, "utf-8")
  ) as Record<string, { text: string; titel: string; notePath: string }>;
  const referenceChunks: ReferenceChunkMap = new Map(Object.entries(referenceChunksRaw));
  cached = { textDb, vectorDbs, referenceChunks };
  cachedPluginDir = pluginDir;
  return cached;
}

function maxScore(hits: { score: number }[]): number {
  return hits.reduce((m, h) => Math.max(m, h.score), 0);
}

/**
 * Runs a federated hybrid (BM25 + vector) search across the split indices
 * and returns typed, merged, ranked hits.
 *
 * BM25 stays correct because the text index is never sharded (single
 * corpus, single set of document-frequency stats). Vector hits from all
 * shards are concatenated and ranked together before fusion (vector search
 * returns raw, non-corpus-relative cosine similarities, so this is
 * equivalent to querying one unified vector index).
 *
 * The two legs are combined via Reciprocal Rank Fusion (rrfMerge above),
 * not min-max score-sum — see rrfMerge's docstring for why the previous
 * approach was replaced (empirically confirmed to bury single-leg-exclusive
 * correct answers under documents merely mediocre on both legs).
 */
export async function federatedHybridSearch(
  indices: CachedIndices,
  term: string,
  vector: number[],
  settings: RagChatSettings
): Promise<RetrievedHit[]> {
  const textResult = await search(indices.textDb, {
    mode: "fulltext",
    term,
    limit: CANDIDATE_POOL_LIMIT,
  });

  const vectorResultsPerShard = await Promise.all(
    indices.vectorDbs.map((db) =>
      search(db, {
        mode: "vector",
        vector: { value: vector, property: "embedding" },
        similarity: settings.similarity,
        limit: CANDIDATE_POOL_LIMIT,
      })
    )
  );
  const vectorHits = vectorResultsPerShard.flatMap((r) => r.hits);

  const textHitsSorted = [...textResult.hits]
    .sort((a, b) => b.score - a.score)
    .map((h) => ({ document: h.document as unknown as RagMetadata, score: h.score }));
  const vectorHitsSorted = [...vectorHits]
    .sort((a, b) => b.score - a.score)
    .map((h) => ({ document: h.document as unknown as RagMetadata, score: h.score }));

  const merged = rrfMerge(textHitsSorted, vectorHitsSorted, settings.rrfK);

  return merged
    .slice(0, settings.topK)
    .map(({ score, doc }) => ({
      score,
      rowId: doc.rowId,
      notePath: doc.notePath,
      seitencode: doc.seitencode,
      sektion: doc.sektion,
      titel: doc.titel,
      kind: doc.kind,
    }));
}

/** Short follow-up markers, e.g. "und was ist mit ...?" or "auch für ...?" -
 * a question starting with one of these AND being short is almost certainly
 * referring back to the previous turn rather than being self-contained. */
const FOLLOWUP_MARKERS = [
  "und was ist mit",
  "was ist mit",
  "und für",
  "auch für",
  "wie sieht es aus mit",
  "und wie",
  "und wo",
  "und wieviel",
  "und welche",
  "was ist",
  "und",
  "auch",
];

const FOLLOWUP_MAX_WORDS = 6;

/**
 * Deterministic (free, instant) query-time "planning" step: resolves short
 * follow-up questions against the previous user turn so retrieval sees a
 * self-contained query, e.g. "und was ist mit 16-03?" after a prior question
 * about tank removal becomes "<prior question> und was ist mit 16-03?".
 * Falls through to the raw question when it doesn't look like a follow-up,
 * or when there's no prior turn to resolve against. This is intentionally a
 * cheap heuristic, not an LLM call - it only seeds the free baseline
 * retrieval (see workflow.ts); if that's not enough, the agent loop's own
 * search_manual/search_manual_fuzzy tools (see agent.ts) let the model
 * re-query with a better phrasing itself instead of relying on a fixed
 * rewrite step.
 */
export function resolveFollowupQuery(question: string, history: ChatTurn[]): string {
  const trimmed = question.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;
  const looksLikeFollowup =
    wordCount <= FOLLOWUP_MAX_WORDS && FOLLOWUP_MARKERS.some((marker) => lower.startsWith(marker));
  if (!looksLikeFollowup) return trimmed;

  const lastUserTurn = [...history].reverse().find((t) => t.role === "user" && t.text.trim());
  if (!lastUserTurn) return trimmed;
  return `${lastUserTurn.text.trim()} ${trimmed}`;
}

/** Relative weight given to each retrieval leg when merging. Vault Search's
 * hits aren't independently corroborated by BM25/vector similarity, so it's
 * kept as a meaningful-but-secondary signal - strong enough to surface a
 * document the hybrid legs missed entirely (the "tank einbauen" case), but
 * not strong enough to bury a well-corroborated hybrid hit under it. */
const HYBRID_LEG_WEIGHT = 0.7;
const FUZZY_LEG_WEIGHT = 0.3;

/**
 * Merges Vault Search's independent fuzzy/typo/synonym-aware results into an
 * already-ranked hybrid (BM25+vector) hit list, by notePath. This is what
 * lets RAG chat recover documents that only the fuzzy search's decompounding/
 * typo-correction/colloquial-synonym logic would find (see the vault-search
 * plugin's runSearch()) - added as a genuine third leg on every query, not
 * just as a last-resort fallback, since it's cheap and independently useful.
 */
export function mergeWithFuzzy(
  hybridHits: RetrievedHit[],
  fuzzyHits: FuzzySearchHit[],
  topK: number
): RetrievedHit[] {
  const maxHybrid = maxScore(hybridHits);
  const merged = new Map<string, RetrievedHit>();

  for (const h of hybridHits) {
    const normalized = maxHybrid > 0 ? h.score / maxHybrid : 0;
    merged.set(h.notePath, { ...h, score: normalized * HYBRID_LEG_WEIGHT });
  }

  const n = fuzzyHits.length;
  for (let i = 0; i < n; i++) {
    const f = fuzzyHits[i];
    // Vault Search returns hits already ranked best-first; its raw scores
    // aren't on a comparable scale to BM25/cosine, so rank position is used
    // to derive a normalized [0,1] contribution instead.
    const rankScore = n > 1 ? 1 - i / (n - 1) : 1;
    const contribution = rankScore * FUZZY_LEG_WEIGHT;
    const existing = merged.get(f.notePath);
    if (existing) {
      existing.score += contribution;
    } else {
      merged.set(f.notePath, {
        score: contribution,
        // Vault Search only indexes page notes, not reference docs, and its
        // hits are never looked up by rowId (that only matters for
        // "reference" kind hits' sidecar lookup) - this synthetic id is
        // just a placeholder to satisfy RetrievedHit's shape.
        rowId: `${f.notePath}::fuzzy`,
        notePath: f.notePath,
        seitencode: f.seitencode,
        sektion: f.sektion,
        titel: f.titel,
        kind: "text",
      });
    }
  }

  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Parent-note expansion (see PLAN.md Phase 4): for page-note hits
 * (`kind: "text" | "multimodal"`), dedupe by notePath (the UNIQUE key -
 * seitencode alone has 47 known collisions across the vault, see PLAN.md)
 * and read each source note IN FULL via vault.read (the "Parent Note"
 * pattern - never truncate).
 *
 * For `kind: "reference"` hits (standalone docs like Sonderwerkzeuge.md -
 * see chunk.py's REFERENCE_DOCS), this does NOT read the whole file: those
 * documents run 14-81KB, far too large to inject in full on every matching
 * chunk hit the way a ~1-3KB page note is. Instead it looks up just the
 * matched CHUNK's text from the reference-chunks.json sidecar (`hit.rowId`
 * is stable across a hit's originating leg - text or vector-only), and
 * dedupes by `rowId` rather than `notePath` so multiple distinct relevant
 * chunks from the SAME reference doc (e.g. two different Sonderwerkzeuge
 * tool groups) are all kept, instead of collapsing to just the top-ranked
 * one the way same-notePath page-note hits correctly do.
 */
export async function expandToParentNotes(
  hits: RetrievedHit[],
  vault: Vault,
  referenceChunks: ReferenceChunkMap
): Promise<ContextBlock[]> {
  const seen = new Set<string>();
  const blocks: ContextBlock[] = [];
  for (const hit of hits) {
    if (hit.kind === "reference") {
      if (seen.has(hit.rowId)) continue;
      seen.add(hit.rowId);
      const chunk = referenceChunks.get(hit.rowId);
      if (!chunk) continue; // stale sidecar/index mismatch - rebuild the index
      blocks.push({
        notePath: hit.notePath,
        seitencode: "", // no Seitencode for standalone reference docs - see ContextBlock's doc
        sektion: hit.sektion,
        titel: hit.titel,
        fullText: chunk.text,
      });
      continue;
    }
    if (seen.has(hit.notePath)) continue;
    seen.add(hit.notePath);
    const file = vault.getFileByPath(hit.notePath);
    if (!file) continue; // note may have moved/been deleted since the index was built
    const fullText = await vault.read(file);
    blocks.push({
      notePath: hit.notePath,
      seitencode: hit.seitencode,
      sektion: hit.sektion,
      titel: hit.titel,
      fullText,
    });
  }
  return blocks;
}

/** Assembles the <context> block fed to the generation model. `titel` is
 * included as an attribute (not just relied on being inline in `fullText`,
 * which page notes start with as "# <titel>" but a reference-doc chunk from
 * later in a large file may not) so the model can always identify which
 * document a chunk came from. Blocks with an empty `seitencode` are
 * reference-doc chunks - see gemini.ts's SYSTEM_PROMPT for the citation
 * format the model is instructed to use for those ("[Referenz: <titel>]"
 * instead of "[Seite <code>]"). */
export function buildContextXml(blocks: ContextBlock[]): string {
  const parts = blocks.map(
    (b) =>
      `<document source="${b.notePath}" seitencode="${b.seitencode}" sektion="${b.sektion}" titel="${b.titel}">\n${b.fullText}\n</document>`
  );
  return `<context>\n${parts.join("\n\n")}\n</context>`;
}
