/**
 * CRITICAL SEARCH ENGINE - Job + Location Exclusive Matching
 * Database Columns: job_looking_for, exact_location
 * These TWO columns must ALWAYS be the priority
 */

export interface SearchMatch {
  field: string
  score: number
  matched: boolean
}

// 100+ Job Search Terms Database - Maps to job_looking_for column
const JOB_SEARCH_TERMS: Record<string, string[]> = {
  sales: [
    "sales executive",
    "sales representative",
    "sales girl",
    "sales person",
    "sales officer",
    "sales associate",
    "sales agent",
    "sales manager",
    "senior sales",
    "junior sales",
  ],
  business_development: [
    "business developer",
    "bd executive",
    "bd officer",
    "account manager",
    "client manager",
    "business manager",
  ],
  accounting: [
    "accountant",
    "accounting clerk",
    "accounts officer",
    "accounting assistant",
    "junior accountant",
    "senior accountant",
    "accounts payable",
    "accounts receivable",
  ],
  finance: [
    "finance officer",
    "financial analyst",
    "finance manager",
    "accounting finance",
    "financial controller",
    "finance executive",
  ],
  software_development: [
    "software developer",
    "developer",
    "software engineer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "react developer",
    "node developer",
    "web developer",
    "mobile developer",
  ],
  it_support: [
    "it support",
    "technical support",
    "support officer",
    "helpdesk",
    "it technician",
    "systems administrator",
    "network administrator",
  ],
  marketing: [
    "marketing executive",
    "marketing officer",
    "marketing specialist",
    "digital marketer",
    "social media marketing",
    "brand manager",
    "marketing manager",
  ],
  communications: ["communications officer", "public relations", "pr officer", "communications manager"],
  hr: [
    "hr officer",
    "hr manager",
    "human resources",
    "recruitment officer",
    "talent acquisition",
    "hr executive",
    "hr specialist",
    "recruiter",
  ],
  healthcare: [
    "nurse",
    "nursing officer",
    "healthcare officer",
    "medical officer",
    "doctor",
    "physician",
    "clinical officer",
    "health worker",
    "midwife",
  ],
  education: [
    "teacher",
    "tutor",
    "educational officer",
    "lecturer",
    "instructor",
    "academic",
    "education specialist",
    "trainer",
  ],
  operations: [
    "operations officer",
    "ops manager",
    "operations manager",
    "warehouse officer",
    "logistics officer",
    "supply chain",
    "procurement officer",
  ],
  customer_service: [
    "customer service",
    "customer care",
    "customer support",
    "service officer",
    "client service",
    "customer representative",
    "customer service manager",
  ],
  administration: [
    "administrator",
    "admin officer",
    "executive assistant",
    "office assistant",
    "secretary",
    "administrative officer",
    "office manager",
    "clerical officer",
    "clerk",
  ],
  engineering: [
    "engineer",
    "civil engineer",
    "mechanical engineer",
    "electrical engineer",
    "structural engineer",
    "project engineer",
    "engineering technician",
  ],
  hospitality: [
    "hotel manager",
    "restaurant manager",
    "hospitality officer",
    "front desk",
    "concierge",
    "food service",
    "tourism guide",
    "chef",
    "cook",
  ],
  manufacturing: [
    "production officer",
    "production supervisor",
    "factory worker",
    "manufacturing engineer",
    "quality control",
    "production manager",
  ],
  security: [
    "security officer",
    "security guard",
    "security personnel",
    "security supervisor",
    "facility security",
    "loss prevention",
  ],
  transportation: [
    "driver",
    "delivery driver",
    "commercial driver",
    "logistics driver",
    "transport officer",
    "bus driver",
  ],
  real_estate: [
    "real estate agent",
    "property manager",
    "estate officer",
    "real estate officer",
    "real estate manager",
  ],
  legal: ["lawyer", "attorney", "legal officer", "legal advisor", "legal assistant", "paralegal"],
  trades: ["electrician", "plumber", "carpenter", "welder", "mechanic", "technician", "tradesperson", "mason"],
  cleaning: ["cleaner", "cleaning officer", "housekeeping", "janitor", "sanitation officer", "cleaning staff"],
}

// Flatten for easy access
const ALL_JOB_TERMS = Object.values(JOB_SEARCH_TERMS).flat()

/**
 * Detect location prepositions: in, at, near, around, based in, located at, etc.
 */
function detectLocationPreposition(query: string): {
  preposition: string
  remainingAfterPrep: string
  found: boolean
  indexOfPrep: number
} {
  const lower = query.toLowerCase()

  const prepositionPatterns = [
    /\b(based\s+in|based\s+at|located\s+in|located\s+at|stationed\s+at|positioned\s+in|working\s+in|working\s+at)\b/gi,
    /\b(around)\s+/gi,
    /\b(near)\s+/gi,
    /\b(in)\s+/gi,
    /\b(at)\s+/gi,
  ]

  for (const pattern of prepositionPatterns) {
    const match = pattern.exec(query)
    if (match) {
      const foundPrep = match[0].trim()
      const remaining = query.substring(match.index + foundPrep.length).trim()
      return {
        preposition: foundPrep.toLowerCase(),
        remainingAfterPrep: remaining,
        found: true,
        indexOfPrep: match.index,
      }
    }
  }

  return { preposition: "", remainingAfterPrep: "", found: false, indexOfPrep: -1 }
}

/**
 * Extract location from text after preposition
 */
function extractLocationFromText(text: string): string {
  const locationMatch = text.match(/^([a-zA-Z\s]+?)(?:\s+(?:and|or|with|for|who|looking|seeking|have)|[,.]|$)/i)
  return locationMatch ? locationMatch[1].trim() : text.split(/[\s,.]/, 1)[0]
}

/**
 * CRITICAL: Check if text matches any of the 100+ job search terms
 */
function matchJobSearchTerms(text: string): boolean {
  const lower = text.toLowerCase()
  for (const term of ALL_JOB_TERMS) {
    if (lower.includes(term)) {
      return true
    }
  }
  return false
}

/**
 * Parse natural language query with EXCLUSIVE job + location matching
 */
export function parseSearchQuery(query: string): {
  keywords: string[]
  locations: string[]
  jobTitle?: string
  hasLocationPreposition: boolean
  matchType: "all" | "any"
} {
  const {
    preposition,
    remainingAfterPrep,
    found: hasLocationPreposition,
    indexOfPrep,
  } = detectLocationPreposition(query)

  const locations: string[] = []
  let jobTitle = ""

  if (hasLocationPreposition) {
    // EXCLUSIVE MATCHING: Job BEFORE preposition, Location AFTER
    jobTitle = query.substring(0, indexOfPrep).trim()
    const extractedLocation = extractLocationFromText(remainingAfterPrep)
    if (extractedLocation) {
      locations.push(extractedLocation.toLowerCase())
    }
  } else {
    // No location preposition - treat whole query as potential job title
    jobTitle = query.trim()
  }

  const keywords = jobTitle
    .split(/\s+/)
    .filter((k) => k.length > 2)
    .map((k) => k.toLowerCase())

  const matchType = query.includes(",") ? "all" : "any"

  return {
    keywords,
    locations,
    jobTitle,
    hasLocationPreposition,
    matchType,
  }
}

/**
 * CRITICAL SCORING: job_looking_for + exact_location are TOP PRIORITY
 */
export function scoreCandidate(candidate: any, query: string): number {
  const parsed = parseSearchQuery(query)
  let score = 0

  const candidateJobTitle = (candidate.job_looking_for || "").toLowerCase()
  const candidateLocation = (candidate.exact_location || "").toLowerCase()
  const candidateCountry = (candidate.country || "").toLowerCase()

  if (parsed.hasLocationPreposition && parsed.locations.length > 0) {
    // EXCLUSIVE MODE: Both job_looking_for AND exact_location must match
    let jobMatched = false
    let locationMatched = false

    for (const term of ALL_JOB_TERMS) {
      if (candidateJobTitle.includes(term)) {
        score += 100
        jobMatched = true
        break
      }
    }

    for (const keyword of parsed.keywords) {
      if (keyword.length > 2 && candidateJobTitle.includes(keyword)) {
        score += 80
        jobMatched = true
      }
    }

    for (const searchLoc of parsed.locations) {
      if (searchLoc.length > 1) {
        if (candidateLocation.includes(searchLoc) || candidateCountry.includes(searchLoc)) {
          score += 90
          locationMatched = true
          break
        }
      }
    }

    if (parsed.locations.length > 0 && !locationMatched) {
      score = 0 // No score if location doesn't match
    }

    if (!jobMatched) {
      score = Math.max(0, score - 50)
    }

    if (jobMatched && locationMatched) {
      score += 30
    }
  } else {
    // No location preposition - still prioritize job_looking_for
    for (const term of ALL_JOB_TERMS) {
      if (candidateJobTitle.includes(term)) {
        score += 100
        break
      }
    }

    for (const keyword of parsed.keywords) {
      if (keyword.length > 2 && candidateJobTitle.includes(keyword)) {
        score += 80
        break
      }
    }

    // Location gets lower priority in general search (10 points)
    for (const keyword of parsed.keywords) {
      if (keyword.length > 2 && (candidateLocation.includes(keyword) || candidateCountry.includes(keyword))) {
        score += 10
      }
    }
  }

  return score
}

/**
 * Filter candidates using advanced search with exclusive job + location matching
 */
export function filterByAdvancedSearch(candidates: any[], query: string): any[] {
  if (!query || query.trim().length < 2) return candidates

  const parsed = parseSearchQuery(query)

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, query),
    }))
    .filter(({ score }) => score > 0)
    .sort(({ score: a }, { score: b }) => b - a)
    .map(({ candidate }) => candidate)
}
