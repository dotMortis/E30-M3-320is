import { requestUrl, type Vault } from "obsidian";
import { search, type AnyOrama } from "@orama/orama";
import { loadTextIndex, loadVectorShard, type RagMetadata } from "./orama-schema";
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
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  kind: "text" | "multimodal";
}

export interface ContextBlock {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  fullText: string;
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
  citations?: ContextBlock[];
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
 * via Obsidian's CORS-safe requestUrl - no streaming needed here). */
export async function embedQuery(query: string, settings: RagChatSettings): Promise<number[]> {
  if (!settings.geminiApiKey) {
    throw new Error("Google API key (GEMINI_API_KEY) is required for query embeddings - set it in RAG Chat settings.");
  }
  const prefixed = QUERY_PREFIX_TMPL.replace("{content}", query);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.embeddingModel}:embedContent`;
  const response = await requestUrl({
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
  });
  const values = response.json?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Unexpected embedContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }
  return values as number[];
}

export interface CachedIndices {
  textDb: AnyOrama;
  vectorDbs: AnyOrama[];
}

let cached: CachedIndices | null = null;
let cachedPluginDir: string | null = null;

/** Loads (and caches) the split text index + all vector shards from the
 * plugin directory, per the manifest's vectorShardCount. */
export async function getIndices(pluginDir: string, manifest: RagManifest): Promise<CachedIndices> {
  if (cached && cachedPluginDir === pluginDir) return cached;
  const textDb = await loadTextIndex(`${pluginDir}/${manifest.textIndexFile}`);
  const vectorDbs = await Promise.all(
    Array.from({ length: manifest.vectorShardCount }, (_, i) =>
      loadVectorShard(`${pluginDir}/${manifest.vectorIndexFilePattern.replace("{i}", String(i))}`)
    )
  );
  cached = { textDb, vectorDbs };
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
 * cheap heuristic, not an LLM call - see gemini.ts's rewriteQuery() for the
 * LLM-based fallback used only when this + retrieval still come back thin.
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
 * Parent-note expansion (see PLAN.md Phase 4): dedupe hits by notePath (the
 * UNIQUE key - seitencode alone has 47 known collisions across the vault,
 * see PLAN.md), read each source note IN FULL via vault.read (the "Parent
 * Note" pattern - never truncate), and return context blocks labelled with
 * notePath + seitencode + sektion (that pair disambiguates the collisions).
 */
export async function expandToParentNotes(hits: RetrievedHit[], vault: Vault): Promise<ContextBlock[]> {
  const seen = new Set<string>();
  const blocks: ContextBlock[] = [];
  for (const hit of hits) {
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

/** Assembles the <context> block fed to the generation model. */
export function buildContextXml(blocks: ContextBlock[]): string {
  const parts = blocks.map(
    (b) =>
      `<document source="${b.notePath}" seitencode="${b.seitencode}" sektion="${b.sektion}">\n${b.fullText}\n</document>`
  );
  return `<context>\n${parts.join("\n\n")}\n</context>`;
}
