import type { Vault } from "obsidian";
import { critiqueAnswer, rewriteQuery, streamGenerate } from "./gemini";
import {
  buildContextXml,
  embedQuery,
  expandToParentNotes,
  federatedHybridSearch,
  mergeWithFuzzy,
  resolveFollowupQuery,
  type CachedIndices,
  type ChatTurn,
  type ContextBlock,
  type FuzzySearchApi,
  type RetrievedHit,
} from "./retriever";
import type { RagChatSettings } from "./settings";

/**
 * workflow.ts — the query-time "reasoning workflow": plan → retrieve →
 * validate → answer, replacing the old single-shot embed→search→generate
 * pipeline that used to live inline in view.ts's answer(). See PLAN.md's
 * successor design notes for the rationale (RAG missed documents that Vault
 * Search's fuzzy/typo/synonym search found - e.g. "tank einbauen").
 *
 * Steps:
 *   1. Plan  - resolveFollowupQuery() (free, deterministic) resolves short
 *      follow-up questions against the previous turn.
 *   2. Research - combinedRetrieve() runs BM25+vector hybrid search AND
 *      Vault Search's fuzzy leg on every query, merging both by notePath.
 *      If the result still looks "thin", automatically widens the search
 *      (loosened similarity) and, as a last resort, asks the LLM to rewrite
 *      the query using conversation history and retries once more.
 *   3. Validate - after generating a draft answer, asks the LLM to critique
 *      whether it's actually supported by the retrieved context; if not,
 *      broadens retrieval once more and regenerates before showing anything
 *      to the user.
 *   4. Answer - the (possibly regenerated) final draft is streamed/revealed
 *      to the caller.
 *
 * All LLM-call steps (query rewrite fallback, self-critique) are optional
 * per settings, since they cost extra Gemini round-trips - see settings.ts.
 */

export interface WorkflowParams {
  question: string;
  /** Prior turns of this session, EXCLUDING the current question and the
   * (empty, in-progress) assistant turn being answered. */
  history: ChatTurn[];
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  /** Called with the final answer text. If self-critique is disabled, called
   * incrementally as tokens stream in; if enabled, called once with the
   * complete (possibly regenerated) answer, since a "draft that might get
   * thrown away" shouldn't be streamed live to the user. */
  onChunk: (text: string) => void;
  /** Called with short German progress labels ("Erweitere Suche …") while a
   * retry/widen/rewrite/critique step is in flight, purely for UI feedback. */
  onStatus?: (status: string) => void;
}

export interface WorkflowResult {
  citations: ContextBlock[];
}

interface RetrievalOutcome {
  hits: RetrievedHit[];
  blocks: ContextBlock[];
}

/** Loosen retrieval for a retry: lower the similarity floor (never below
 * 0.4 - much below that the vector leg stops being meaningfully selective)
 * and consider a few more candidates before the final topK slice. */
function widenSettings(settings: RagChatSettings): RagChatSettings {
  return {
    ...settings,
    similarity: Math.max(0.4, settings.similarity - 0.15),
    topK: settings.topK + 4,
  };
}

async function retrieveOnce(
  query: string,
  settings: RagChatSettings,
  indices: CachedIndices,
  fuzzyApi: FuzzySearchApi | null,
  vault: Vault
): Promise<RetrievalOutcome> {
  const vector = await embedQuery(query, settings);
  const hybridHits = await federatedHybridSearch(indices, query, vector, settings);

  let hits = hybridHits;
  if (settings.enableFuzzySearchLeg && fuzzyApi) {
    try {
      const fuzzy = await fuzzyApi.search(query, 10);
      hits = mergeWithFuzzy(hybridHits, fuzzy.results, settings.topK);
    } catch {
      // Fuzzy leg is best-effort (e.g. vault-search plugin disabled/missing) -
      // keep the pure hybrid results rather than failing the whole turn.
    }
  }

  const blocks = await expandToParentNotes(hits, vault);
  return { hits, blocks };
}

/** German query/title words that carry no topical signal on their own -
 * excluded from the keyword-overlap sanity check below so e.g. "wie" or
 * "was" never counts as a "match". Intentionally small; this check is a
 * coarse safety net, not a linguistic pipeline. */
const OVERLAP_STOPWORDS = new Set([
  "wie", "was", "wer", "wo", "wann", "warum", "welche", "welcher", "welches",
  "ich", "du", "er", "sie", "es", "wir", "ihr", "mein", "meine", "meinen",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "und", "oder", "aber", "kann", "kannst", "muss", "soll", "geht", "macht",
  "nicht", "auch", "noch", "schon", "sehr", "viel", "komisch", "einfach",
  "diese", "dieser", "dieses", "hier", "dort", "dann", "beim", "beim",
]);

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !OVERLAP_STOPWORDS.has(w));
}

/** True if any word in `a` is a substring of (or contains) any word in `b`,
 * in either direction. Deliberately permissive substring matching (not
 * exact-token matching) as a cheap stand-in for German compound-noun
 * awareness — e.g. query word "tank" is a substring of title word
 * "kraftstofftank", so this catches that overlap without needing a real
 * decompounder here. This is a coarse sanity net against confidently-wrong
 * retrieval, not a relevance scorer. */
function hasWordOverlap(a: string[], b: string[]): boolean {
  for (const wa of a) {
    for (const wb of b) {
      if (wa.includes(wb) || wb.includes(wa)) return true;
    }
  }
  return false;
}

/**
 * A retrieval outcome is "weak" if it's thin by count/score (the original
 * heuristic) OR if NONE of the retrieved hits' titles share so much as one
 * substring-overlapping content word with the query.
 *
 * The count/score-only version of this check was confirmed (via live
 * benchmarking, see .pipeline/rag/PLAN.md) to miss real failures: a query
 * like "wie baue ich den Tank ein" could retrieve 7 hits with a
 * comfortable-looking merged score while every single hit was topically
 * wrong (tank-VENTING pages instead of tank-REMOVAL pages) — high count,
 * high score, zero retry triggered, wrong answer shown. The keyword-overlap
 * check catches that class of failure: if literally no retrieved title
 * shares any topical word with the question, no score threshold should be
 * able to override that "this doesn't look right" signal.
 */
function isWeak(outcome: RetrievalOutcome, settings: RagChatSettings, query: string): boolean {
  if (outcome.blocks.length === 0) return true;
  if (outcome.blocks.length < settings.weakResultMinHits) return true;
  const topScore = outcome.hits[0]?.score ?? 0;
  if (topScore < settings.weakResultScoreThreshold) return true;

  const queryWords = contentWords(query);
  if (queryWords.length === 0) return false; // nothing to check against (pure stopwords/short query)
  const anyTitleOverlaps = outcome.hits.some((h) => hasWordOverlap(queryWords, contentWords(h.titel)));
  return !anyTitleOverlaps;
}

async function generateDraft(
  contextXml: string,
  question: string,
  history: ChatTurn[],
  settings: RagChatSettings,
  liveOnChunk: ((text: string) => void) | null
): Promise<string> {
  let draft = "";
  await streamGenerate(contextXml, question, history, settings, (delta) => {
    draft += delta;
    liveOnChunk?.(delta);
  });
  return draft;
}

export async function answerQuestion(params: WorkflowParams): Promise<WorkflowResult> {
  const { question, history, settings, vault, indices, fuzzyApi, onChunk, onStatus } = params;

  // --- Step 1: plan (free, deterministic follow-up resolution) -----------
  const resolvedQuery = resolveFollowupQuery(question, history);

  // --- Step 2: research (combined retrieval, widen/rewrite on weak results)
  onStatus?.("Durchsuche Handbuch …");
  let outcome = await retrieveOnce(resolvedQuery, settings, indices, fuzzyApi, vault);

  let retrievalRetriesLeft = Math.max(0, settings.maxRetries);

  if (isWeak(outcome, settings, resolvedQuery) && retrievalRetriesLeft > 0) {
    onStatus?.("Erweitere Suche …");
    outcome = await retrieveOnce(resolvedQuery, widenSettings(settings), indices, fuzzyApi, vault);
    retrievalRetriesLeft--;
  }

  if (isWeak(outcome, settings, resolvedQuery) && retrievalRetriesLeft > 0 && settings.enableQueryRewriteFallback) {
    onStatus?.("Frage wird umformuliert …");
    try {
      const rewritten = await rewriteQuery(question, history, settings);
      if (rewritten.trim()) {
        onStatus?.("Durchsuche Handbuch (umformuliert) …");
        const rewrittenOutcome = await retrieveOnce(rewritten.trim(), settings, indices, fuzzyApi, vault);
        // Only adopt the rewritten query's results if they're actually better -
        // a bad rewrite shouldn't discard a mediocre-but-real result set.
        if (rewrittenOutcome.blocks.length > outcome.blocks.length) {
          outcome = rewrittenOutcome;
        }
      }
    } catch {
      // Best-effort: fall through with whatever retrieval already produced.
    }
    retrievalRetriesLeft--;
  }

  if (outcome.blocks.length === 0) {
    return { citations: [] };
  }

  // --- Step 3 & 4: answer, then validate (self-critique) before revealing -
  let contextXml = buildContextXml(outcome.blocks);
  onStatus?.("Erstelle Antwort …");
  const liveStreaming = !settings.enableSelfCritique;
  let draft = await generateDraft(contextXml, question, history, settings, liveStreaming ? onChunk : null);

  if (settings.enableSelfCritique) {
    onStatus?.("Prüfe Antwort …");
    let verdictOk = true;
    try {
      const verdict = await critiqueAnswer(question, contextXml, draft, settings);
      verdictOk = verdict.ok;
    } catch {
      // Fail open: don't block the user on a broken critique call.
      verdictOk = true;
    }

    if (!verdictOk && retrievalRetriesLeft > 0) {
      onStatus?.("Erweitere Suche …");
      const retryOutcome = await retrieveOnce(resolvedQuery, widenSettings(settings), indices, fuzzyApi, vault);
      if (retryOutcome.blocks.length > 0) {
        outcome = retryOutcome;
        contextXml = buildContextXml(retryOutcome.blocks);
        onStatus?.("Erstelle Antwort …");
        draft = await generateDraft(contextXml, question, history, settings, null);
      }
    }

    // Self-critique buffers generation rather than streaming it live (see
    // WorkflowParams.onChunk doc), so the final answer is revealed in one shot.
    onChunk(draft);
  }

  return { citations: outcome.blocks };
}
