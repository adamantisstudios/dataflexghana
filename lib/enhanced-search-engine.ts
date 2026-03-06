/**
 * ENHANCED CANDIDATE SEARCH v3.0
 * - Hybrid BM25-like core + field weight multipliers
 * - Two-stage prioritization: job_looking_for and exact_location are evaluated first
 * - Fuzzy (Levenshtein), synonym expansion, phrase and token matching
 * - Corpus indexing for TF & IDF so search is fast & consistent
 * - Returns detailed matchedFields + score breakdown for explainability
 *
 * Usage:
 *  const index = buildCandidatesIndex(candidatesArray, synonyms)
 *  const results = enhancedCandidateSearch(index, "experienced teacher in kumasi", { topK: 30 })
 *
 * Note: Provide SKILL_SYNONYMS and JOB_TITLE_SYNONYMS as plain objects:
 *  { "teacher": ["tutor", "educator"], "cleaner": ["housekeeper","maid"] }
 *
 * Author: ChatGPT (reworked per user request)
 */

import { SKILL_SYNONYMS, JOB_TITLE_SYNONYMS } from "./dictionaries" // Updated imports to use new dictionary structure

/*********************
 * Types & Interfaces
 *********************/
export interface CandidateRecord {
  id?: string | number
  job_looking_for?: string
  exact_location?: string
  country?: string
  highest_education?: string
  future_learning_plans?: string
  skills?: string
  work_history?: string
  education_history?: string
  certifications?: string
  projects?: string
  publications?: string
  awards?: string
  professional_affiliations?: string
  interests?: string
  professional_references?: string
  [key: string]: any
}

export interface IndexOptions {
  tokenizeRegex?: RegExp
  minTokenLen?: number
  stopwords?: Set<string>
}

export interface FieldWeightMap {
  [field: string]: number
}

export interface CandidatesIndex {
  candidates: CandidateRecord[]
  corpusSize: number
  // per-field inverted index: field -> term -> Set(candidateIndex)
  inverted: Record<string, Map<string, Set<number>>>
  // per-field term frequencies: candidateIndex -> field -> term -> freq
  termFreqs: Map<number, Record<string, Record<string, number>>>
  // document frequencies: field -> term -> df
  docFreqs: Record<string, Map<string, number>>
  // avg field lengths for BM25-ish normalization
  avgFieldLength: Record<string, number>
  // precomputed candidate field lengths
  fieldLengths: Map<number, Record<string, number>>
  // options & weights used
  options: IndexOptions
  fieldWeights: FieldWeightMap
}

export interface EnhancedSearchResult {
  candidate: CandidateRecord
  score: number
  matchedFields: Array<{ field: string; score: number; explanation: string }>
  debug?: any
}

/********************
 * Default Configs
 ********************/
const DEFAULT_OPTIONS: IndexOptions = {
  tokenizeRegex: /[^\p{L}\p{N}]+/u, // split on non-alphanumeric/unicode letters
  minTokenLen: 2,
  stopwords: new Set([
    "the",
    "and",
    "a",
    "an",
    "in",
    "on",
    "at",
    "for",
    "of",
    "to",
    "with",
    "by",
    "from",
    "is",
    "are",
    "as",
  ]),
}

/**
 * FIELD WEIGHTS: the absolute importance multiplier per field.
 * NOTE: job_looking_for and exact_location are intentionally very large.
 * Adjust if you want slightly softer dominance.
 */
const DEFAULT_FIELD_WEIGHTS: FieldWeightMap = {
  job_looking_for: 10.0, // MASSIVE priority
  exact_location: 8.0, // very high
  highest_education: 1.2,
  future_learning_plans: 1.0,

  skills: 1.5,
  work_history: 1.0,
  education_history: 0.9,
  certifications: 0.7,
  projects: 0.6,
  publications: 0.5,
  awards: 0.4,
  professional_affiliations: 0.4,
  interests: 0.3,
  professional_references: 0.2,
}

/***********************
 * Utility / NLP Tools
 ***********************/
function sanitizeText(s?: string): string {
  return (s || "").toString().trim()
}

function tokenize(text: string, options: IndexOptions): string[] {
  const raw = text.toLowerCase()
  const tokens = raw.split(options.tokenizeRegex!).map((t) => t.trim())
  return tokens.filter((t) => t.length >= (options.minTokenLen || 2) && !options.stopwords!.has(t))
}

/**
 * Levenshtein distance - iterative DP (case-insensitive)
 * Returns exact integer distance.
 */
function levenshteinDistance(a: string, b: string): number {
  // normalize
  const s = a.toLowerCase()
  const t = b.toLowerCase()
  const m = s.length
  const n = t.length
  // early exits
  if (m === 0) return n
  if (n === 0) return m

  const v0 = new Array(n + 1)
  const v1 = new Array(n + 1)
  for (let j = 0; j <= n; j++) v0[j] = j

  for (let i = 0; i < m; i++) {
    v1[0] = i + 1
    for (let j = 0; j < n; j++) {
      const cost = s[i] === t[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
    }
    for (let j = 0; j <= n; j++) v0[j] = v1[j]
  }
  return v1[n]
}

/**
 * Compute fuzzy score 0..1 from levenshtein, scaled by length
 * returns number in [0,1]
 */
function fuzzyScore(a: string, b: string): number {
  if (!a || !b) return 0
  const distance = levenshteinDistance(a, b)
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 0
  const similarity = 1 - distance / maxLen
  return Math.max(0, similarity)
}

/**
 * Expand term with synonyms from both job & skill dictionaries
 */
function expandTermWithSynonyms(term: string): string[] {
  const t = term.toLowerCase().trim()
  const set = new Set<string>([t])

  for (const [k, synonyms] of Object.entries(JOB_TITLE_SYNONYMS || {})) {
    if (k === t || (synonyms && synonyms.includes(t))) {
      set.add(k)
      for (const s of synonyms) set.add(s)
    }
  }
  for (const [k, synonyms] of Object.entries(SKILL_SYNONYMS || {})) {
    if (k === t || (synonyms && synonyms.includes(t))) {
      set.add(k)
      for (const s of synonyms) set.add(s)
    }
  }

  return Array.from(set)
}

/**********************
 * Index Builder
 **********************/
export function buildCandidatesIndex(
  candidates: CandidateRecord[],
  fieldWeights: FieldWeightMap = DEFAULT_FIELD_WEIGHTS,
  options: IndexOptions = DEFAULT_OPTIONS,
): CandidatesIndex {
  const inverted: Record<string, Map<string, Set<number>>> = {}
  const docFreqs: Record<string, Map<string, number>> = {}
  const termFreqs = new Map<number, Record<string, Record<string, number>>>()
  const fieldLengths = new Map<number, Record<string, number>>()
  const avgFieldLength: Record<string, number> = {}

  const fields = Object.keys(fieldWeights)

  // init maps per field
  for (const f of fields) {
    inverted[f] = new Map()
    docFreqs[f] = new Map()
  }

  // iterate candidates to build term frequencies and inverted index
  candidates.forEach((cand, idx) => {
    const perCandidateTermFreq: Record<string, Record<string, number>> = {}
    const perCandidateFieldLen: Record<string, number> = {}
    for (const f of fields) {
      const raw = sanitizeText(cand[f])
      perCandidateFieldLen[f] = raw.length
      perCandidateTermFreq[f] = {}

      if (!raw) continue
      const tokens = tokenize(raw, options)
      const uniqueTermsSeen = new Set<string>()

      tokens.forEach((tok) => {
        // token frequency in this field for candidate
        perCandidateTermFreq[f][tok] = (perCandidateTermFreq[f][tok] || 0) + 1

        // maintain inverted index
        if (!inverted[f].has(tok)) inverted[f].set(tok, new Set())
        inverted[f].get(tok)!.add(idx)

        // doc freq increment once per document per term
        if (!uniqueTermsSeen.has(tok)) {
          uniqueTermsSeen.add(tok)
          docFreqs[f].set(tok, (docFreqs[f].get(tok) || 0) + 1)
        }
      })
    }
    termFreqs.set(idx, perCandidateTermFreq)
    fieldLengths.set(idx, perCandidateFieldLen)
  })

  // compute average field lengths
  for (const f of fields) {
    let totalLen = 0
    let count = 0
    for (const [_, lens] of fieldLengths) {
      if (lens && lens[f] != null) {
        totalLen += lens[f]
        count++
      }
    }
    avgFieldLength[f] = count > 0 ? totalLen / count : 0
  }

  return {
    candidates,
    corpusSize: candidates.length,
    inverted,
    termFreqs,
    docFreqs,
    avgFieldLength,
    fieldLengths,
    options,
    fieldWeights,
  }
}

/***********************
 * Scoring Utilities
 ***********************/

/**
 * BM25-style term score per field (simplified)
 * k1 and b are tunable; returns non-negative number
 */
function bm25FieldScore(
  term: string,
  field: string,
  candIndex: number,
  index: CandidatesIndex,
  k1 = 1.2,
  b = 0.75,
): number {
  const tfMap = index.termFreqs.get(candIndex)
  if (!tfMap) return 0
  const termFreq = (tfMap[field] && tfMap[field][term]) || 0
  if (termFreq === 0) return 0

  const df = index.docFreqs[field].get(term) || 0
  const N = Math.max(1, index.corpusSize)
  const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5)) // BM25-ish IDF

  const fieldLen = index.fieldLengths.get(candIndex)![field] || 0
  const avgLen = index.avgFieldLength[field] || 1

  const numer = termFreq * (k1 + 1)
  const denom = termFreq + k1 * (1 - b + (b * fieldLen) / Math.max(1, avgLen))

  const score = idf * (numer / denom)
  return Math.max(0, score)
}

/**
 * Field fuzziness: if exact token not present, attempt fuzzy match against tokens in the field.
 * Returns best fuzzy match score (0..1) multiplied by a penalty factor (so fuzzy < exact)
 */
function fieldFuzzyTokenScore(term: string, field: string, candIndex: number, index: CandidatesIndex): number {
  // get all tokens present in this field for candidate (from termFreqs)
  const tfMap = index.termFreqs.get(candIndex)
  if (!tfMap || !tfMap[field]) return 0
  const tokens = Object.keys(tfMap[field])
  let best = 0
  for (const tok of tokens) {
    // short-circuit exact
    if (tok === term) return 1.0
    // partial match: prefix or substring
    if (tok.includes(term) || tok.startsWith(term) || term.startsWith(tok)) {
      best = Math.max(best, 0.8)
    } else {
      const fs = fuzzyScore(term, tok) // 0..1
      if (fs > best) best = fs * 0.9 // penalize fuzzy slightly
    }
  }
  return best
}

/**********************
 * Core Candidate Scoring
 **********************/
function scoreCandidateAgainstQuery(
  candIndex: number,
  index: CandidatesIndex,
  parsed: {
    terms: string[] // canonical tokens / expanded tokens
    rawJobTitle?: string
    rawLocation?: string
    requestedLocation?: string
  },
  config?: {
    fuzzyThreshold?: number
    topFieldBoostMultiplier?: number
  },
): EnhancedSearchResult {
  const candidate = index.candidates[candIndex]
  const matchedFields: EnhancedSearchResult["matchedFields"] = []
  let totalScore = 0

  const weights = index.fieldWeights

  const fuzzyThreshold = config?.fuzzyThreshold ?? 0.45
  const topFieldBoostMultiplier = config?.topFieldBoostMultiplier ?? 2.5

  /**
   * PHASE 1: STRICT PRIORITY CHECKS (job_looking_for and exact_location)
   * We evaluate these first and give them large multipliers to ensure dominance.
   * If they match strongly, candidate receives big boost.
   */

  // Utility to evaluate a field using BM25 + fuzzy + synonyms
  function evaluateField(field: string, boostForTop = 1) {
    const weight = weights[field] ?? 1
    const fieldValue = sanitizeText(candidate[field])

    // short-circuit: blank field yields nothing
    if (!fieldValue) return 0

    let fieldScore = 0

    // for every search term, compute BM25-term score (if present in inverted / tf)
    for (const term of parsed.terms) {
      // exact token BM25
      const bmScore = bm25FieldScore(term, field, candIndex, index)
      if (bmScore > 0) {
        fieldScore += bmScore * 1.0
        continue
      }

      // fuzzy / partial fallback: compute normalized fuzzy token score
      const fs = fieldFuzzyTokenScore(term, field, candIndex, index)
      if (fs >= fuzzyThreshold) {
        // penalize fuzzy vs BM25 but still give value
        fieldScore += fs * 0.8
      } else {
        // also allow substring presence on raw text as low-confidence match
        if (fieldValue.toLowerCase().includes(term)) {
          fieldScore += 0.5
        }
      }
    }

    // synonym expansion: check synonyms of raw jobTitle / rawTerm only once per field
    // (already expanded in parsed terms but remain defensive)
    // apply weight multipliers
    const weighted = fieldScore * weight * boostForTop
    return weighted
  }

  // Evaluate priority 1 fields first
  const priority1 = ["job_looking_for", "exact_location"]
  let priority1Score = 0
  for (const p of priority1) {
    const s = evaluateField(p, 1) // base multiplier; we will apply an extra top boost below
    if (s > 0) {
      matchedFields.push({ field: p, score: Math.round(s * 100) / 100, explanation: "Priority field initial match" })
    }
    priority1Score += s
  }

  // If either priority1 matched, apply extra multiplier to total (dominance)
  if (priority1Score > 0) {
    const boosted = priority1Score * topFieldBoostMultiplier
    totalScore += boosted
  }

  // PHASE 2: Secondary fields
  for (const f of Object.keys(weights)) {
    if (priority1.includes(f)) continue
    const s = evaluateField(f, 1)
    if (s > 0) {
      matchedFields.push({
        field: f,
        score: Math.round(s * 100) / 100,
        explanation: `Secondary field match (weight=${weights[f]})`,
      })
      totalScore += s
    }
  }

  // PHASE 3: Location-specific final checks & bonuses
  if (parsed.requestedLocation) {
    const candLoc = (sanitizeText(candidate.exact_location) + " " + sanitizeText(candidate.country)).toLowerCase()
    const wanted = parsed.requestedLocation.toLowerCase()
    // exact contains -> huge bonus
    if (candLoc.includes(wanted) && wanted.length > 0) {
      const locBonus = 40 * (weights["exact_location"] || 1)
      matchedFields.push({
        field: "location_bonus",
        score: locBonus,
        explanation: "Requested location directly matched (contains)",
      })
      totalScore += locBonus
    } else {
      // fuzzy check on location tokens
      // tokenise both sides and check best fuzzy score
      const locTokens = tokenize(candLoc, index.options)
      let bestFS = 0
      for (const t of tokenize(wanted, index.options)) {
        for (const lt of locTokens) {
          bestFS = Math.max(bestFS, fuzzyScore(t, lt))
        }
      }
      if (bestFS >= 0.75) {
        const locBonus = 25 * bestFS * (weights["exact_location"] || 1)
        matchedFields.push({
          field: "location_bonus",
          score: Math.round(locBonus),
          explanation: `Requested location fuzzy match (${Math.round(bestFS * 100)}%)`,
        })
        totalScore += locBonus
      }
    }
  }

  // PHASE 4: Small tie-breakers and length normalization adjustments
  // Shorter fields with matches might get slight penalty/bonus to avoid long garbage fields dominating
  // We'll compute a normalization factor across field lengths
  const normalizationFactor = 1 // reserved for future fine-tuning; kept 1 to preserve relative scores

  const finalScore = totalScore * normalizationFactor

  // Normalize to 0..100
  // We estimate a plausible soft cap and compress using logistic-like scaling to keep scores human-friendly.
  // The hard cap is 300 (arbitrary high value representing many matches). Map to 0..100.
  const hardCap = 300
  const norm = Math.round((Math.min(finalScore, hardCap) / hardCap) * 100)

  return {
    candidate: index.candidates[candIndex],
    score: norm,
    matchedFields,
    debug: { rawScore: finalScore, priority1Score },
  }
}

/**********************
 * Query Parsing
 **********************/
function parseQueryRaw(query: string): {
  rawJobTitle: string
  rawLocation: string
  requestedLocation?: string
  tokens: string[]
} {
  const q = query.trim()
  // detect location prepositions like "in", "near", "at", "around"
  const locationRegex =
    /\b(?:in|at|near|around|based in|based\s+at|located in|working in|stationed at)\b\s*([^\n,;]+)$/i
  let location = ""
  let jobPart = q
  const match = q.match(locationRegex)
  if (match && match[1]) {
    location = match[1].trim()
    jobPart = q.substring(0, match.index).trim()
  }

  // tokenization + expansion: get tokens from jobPart and location separately
  const opts = DEFAULT_OPTIONS
  const jobTokens = tokenize(jobPart, opts)
  const locationTokens = location ? tokenize(location, opts) : []

  // expand synonyms for job tokens (especially important for job_looking_for heavy weighting)
  const expandedTokens = new Set<string>()
  for (const t of jobTokens) {
    expandTermWithSynonyms(t).forEach((x) => expandedTokens.add(x))
  }
  // include location tokens plainly
  locationTokens.forEach((t) => expandedTokens.add(t))

  return {
    rawJobTitle: jobPart,
    rawLocation: location,
    requestedLocation: location || undefined,
    tokens: Array.from(expandedTokens),
  }
}

/**********************
 * Public Search API
 **********************/

/**
 * Main search function.
 * - index: built from buildCandidatesIndex(...)
 * - query: free text query e.g. "experienced teacher in Kumasi 3 years"
 * - options:
 *    topK: return top K candidates (default 50)
 *    minScore: min normalized score 0..100 to include (default 10)
 */
export function enhancedCandidateSearch(
  index: CandidatesIndex,
  query: string,
  options?: { topK?: number; minScore?: number; debug?: boolean },
): EnhancedSearchResult[] {
  const topK = options?.topK ?? 50
  const minScore = options?.minScore ?? 10
  const debug = options?.debug ?? false

  if (!query || query.trim().length === 0) {
    // return first topK by default ordering (no query)
    return index.candidates.slice(0, topK).map((c) => ({ candidate: c, score: 0, matchedFields: [] }))
  }

  const parsed = parseQueryRaw(query)
  const parsedForScoring = {
    terms:
      parsed.tokens.length > 0 ? parsed.tokens : tokenize(parsed.rawJobTitle + " " + parsed.rawLocation, index.options),
    rawJobTitle: parsed.rawJobTitle,
    rawLocation: parsed.rawLocation,
    requestedLocation: parsed.requestedLocation,
  }

  // Two-stage approach:
  // Stage A: Quick prefilter by priority fields (job_looking_for and exact_location) to massively reduce candidate set
  // Stage B: Full scoring on prefiltered list (or entire corpus if prefilter empty)

  const priorityFields = ["job_looking_for", "exact_location"]

  // build set of candidate idxs that match (even loosely) priority tokens
  const candidateSet = new Set<number>()

  for (const term of parsedForScoring.terms) {
    for (const pf of priorityFields) {
      // direct inverted index hits (token present)
      const m = index.inverted[pf].get(term)
      if (m) {
        for (const i of m) candidateSet.add(i)
      } else {
        // fallback: try fuzzy by scanning small set of terms in the field (costly but restricted to pf)
        // collect candidates that have tokens with decent fuzzy similarity to term
        for (const [tok, df] of index.docFreqs[pf]) {
          // skip extremely rare tokens? no - check fuzzy
          const fs = fuzzyScore(term, tok)
          if (fs >= 0.8) {
            // add all candidates containing tok
            const candIdxSet = index.inverted[pf].get(tok)
            if (candIdxSet) for (const i of candIdxSet) candidateSet.add(i)
          }
        }
      }
    }
  }

  // If no prefilter matches found, we will fallback to scanning whole corpus (but this is rare)
  const prefilterList =
    candidateSet.size > 0 ? Array.from(candidateSet) : Array.from({ length: index.corpusSize }, (_, i) => i)

  // Score all prefiltered candidates
  const scored: EnhancedSearchResult[] = prefilterList.map((ci) =>
    scoreCandidateAgainstQuery(ci, index, parsedForScoring, { fuzzyThreshold: 0.45, topFieldBoostMultiplier: 2.5 }),
  )

  // Sort by score desc, then by some tie-breaker (e.g., presence of job and exact_location text length or ID)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // tie-breaker: candidate with both job_looking_for & exact_location present wins
    const aHasPriority = (a.candidate.job_looking_for ? 1 : 0) + (a.candidate.exact_location ? 1 : 0)
    const bHasPriority = (b.candidate.job_looking_for ? 1 : 0) + (b.candidate.exact_location ? 1 : 0)
    if (bHasPriority !== aHasPriority) return bHasPriority - aHasPriority
    return 0
  })

  // Filter using minScore and return top K
  const filtered = scored.filter((r) => r.score >= minScore).slice(0, topK)

  if (filtered.length === 0) {
    // fallback behavior: return topK from scored even if below minScore, to never return empty
    return scored.slice(0, Math.min(topK, scored.length))
  }

  // optionally include debug info
  if (debug) return filtered
  // prune debug internals for production
  return filtered.map((r) => {
    const { candidate, score, matchedFields } = r
    return { candidate, score, matchedFields }
  })
}

/**********************
 * Search Insights API
 **********************/
export function getSearchInsights(index: CandidatesIndex, query: string) {
  const parsed = parseQueryRaw(query)
  const parsedForScoring = {
    terms:
      parsed.tokens.length > 0 ? parsed.tokens : tokenize(parsed.rawJobTitle + " " + parsed.rawLocation, index.options),
    rawJobTitle: parsed.rawJobTitle,
    rawLocation: parsed.rawLocation,
    requestedLocation: parsed.requestedLocation,
  }

  const scoredAll = Array.from({ length: index.corpusSize }, (_, i) =>
    scoreCandidateAgainstQuery(i, index, parsedForScoring),
  )
  scoredAll.sort((a, b) => b.score - a.score)
  const matched = scoredAll.filter((s) => s.score > 10)

  const avg = matched.length > 0 ? Math.round(matched.reduce((acc, cur) => acc + cur.score, 0) / matched.length) : 0

  return {
    totalCandidates: index.corpusSize,
    matchedCandidates: matched.length,
    topMatches: matched.slice(0, 10),
    averageScore: avg,
  }
}

/**********************
 * Example Usage (commented)
 **********************/
/*
import candidates from './data/candidates.json'
const index = buildCandidatesIndex(candidates)
const results = enhancedCandidateSearch(index, "experienced teacher in Kumasi", { topK: 30, minScore: 12 })
console.log(results.map(r => ({ id: r.candidate.id, score: r.score, matched: r.matchedFields })))
*/

/**********************
 * Notes & Tuning Guide
 **********************
 * - The two-stage prefilter ensures job_looking_for and exact_location are evaluated first.
 * - DEFAULT_FIELD_WEIGHTS makes job_looking_for and exact_location dominate; change these to soften.
 * - BM25 parameters in bm25FieldScore (k1,b) can be tuned to adjust term frequency behavior.
 * - fuzzyThreshold controls when fuzzy matches count; default 0.45 is permissive.
 * - topFieldBoostMultiplier gives extra dominance to priority fields after raw scoring.
 * - Use buildCandidatesIndex() once at app startup, and re-build when candidate data changes.
 *
 * If you want:
 *  - Geo-distance ranking (latitude/longitude): we can add a geo-field and compute haversine distance-based boosts.
 *  - Field-specific stopwords or analyzers (e.g., for names): add per-field tokenizers.
 *  - Real BM25 lib usage: we can export a vector representation and use an external search engine (elasticsearch, Typesense, MeiliSearch).
 *
 * Ready to extend: tell me if you want location geocoding + distance, or an API wrapper for pagination + cursor-based scrolling.
 ***************************/
