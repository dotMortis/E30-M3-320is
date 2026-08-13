import { fold } from "../german/fold.js";

const COVERAGE_BOOST_PER_EXTRA_CONCEPT = 0.35;
const MIN_COVERAGE_TERM_LENGTH = 3;

/**
 * Counts how many distinct query concepts a hit's own title/tag/code
 * fields satisfy. Deliberately excludes body content and section/path,
 * which describe the containing chapter rather than what this specific
 * page is about.
 * @param {{code?: string, titel?: string, titleEn?: string, tags?: string[]}} doc
 * @param {Array<{terms: string[]}>} concepts
 * @returns {number}
 */
export function conceptCoverage(doc, concepts) {
  const haystack = fold([doc.code, doc.titel, doc.titleEn, ...(doc.tags || [])].filter(Boolean).join(" "));

  let matched = 0;
  for (const concept of concepts) {
    if (concept.terms.some((term) => term.length >= MIN_COVERAGE_TERM_LENGTH && haystack.includes(term))) {
      matched++;
    }
  }
  return matched;
}

/**
 * Re-ranks Orama hits by (BM25 score) × (coverage bonus), so a document
 * matching several distinct query concepts is preferred over one that
 * only repeats a single concept. No-op when there are 0 or 1 concepts.
 * @param {object[]} hits
 * @param {Array<{terms: string[]}>} concepts
 * @returns {object[]}
 */
export function rerankByCoverage(hits, concepts) {
  if (concepts.length <= 1) return hits;

  return hits
    .map((hit, index) => {
      const matched = conceptCoverage(hit.document, concepts);
      const bonus = 1 + COVERAGE_BOOST_PER_EXTRA_CONCEPT * Math.max(0, matched - 1);
      return { hit, index, combinedScore: hit.score * bonus };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore || a.index - b.index)
    .map(({ hit }) => hit);
}
