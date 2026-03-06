/**
 * Job Title Formatting Utilities
 * Handles shortening of long job descriptions into concise titles
 */

/**
 * Common long phrases and their abbreviations
 */
const COMMON_PATTERNS: Record<string, string> = {
  "looking for": "",
  seeking: "",
  "searching for": "",
  "in search of": "",
  "open to": "",
  "interested in": "",
  "available for": "",
  "applying for": "",
  "applying to": "",
  "want to work as": "",
  "want to work in": "",
  "want to": "",
  "looking to": "",
  "trying to": "",
  "hoping to": "",
  "need a": "",
  "need an": "",
  "need to": "",
  " role": "",
  " position": "",
  " opportunity": "",
  " in": " @",
  " or any": ",",
  " and": ",",
  "with skills in": "",
  "experienced in": "",
  "experience in": "",
  "based in": "@",
  "located in": "@",
  "based near": "@",
}

/**
 * Shortens a long job description/title into a concise version
 * Handles sentences and converts them to brief job titles
 */
export function shortenJobTitle(jobTitle: string): string {
  if (!jobTitle) return "Not specified"

  // Trim and lowercase for processing
  let processed = jobTitle.trim()

  // If already short, return as is
  if (processed.length <= 40) {
    return processed.charAt(0).toUpperCase() + processed.slice(1)
  }

  // Replace common verbose patterns
  for (const [pattern, replacement] of Object.entries(COMMON_PATTERNS)) {
    const regex = new RegExp(pattern, "gi")
    processed = processed.replace(regex, replacement)
  }

  // Clean up extra spaces and punctuation
  processed = processed
    .replace(/\s+/g, " ") // Multiple spaces to single
    .replace(/[,;:]+/g, ",") // Normalize punctuation
    .replace(/,\s*,/g, ",") // Remove double commas
    .replace(/^\s*,\s*/, "") // Remove leading comma
    .replace(/,\s*$/, "") // Remove trailing comma
    .trim()

  // Split by comma and take first meaningful segment
  const segments = processed
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (segments.length > 0) {
    let result = segments[0]

    // If still too long, take first few words
    if (result.length > 50) {
      result = result.split(" ").slice(0, 5).join(" ")
    }

    return result.charAt(0).toUpperCase() + result.slice(1)
  }

  return "Professional Opportunity"
}

/**
 * Extracts location from a job title string (if included)
 */
export function extractLocationFromJobTitle(jobTitle: string): string | null {
  const locationPatterns = [
    / in ([A-Z][a-zA-Z\s]*(?:,\s*[A-Z][a-zA-Z]*)?)/,
    / @ ([A-Z][a-zA-Z\s]*(?:,\s*[A-Z][a-zA-Z]*)?)/,
    / at ([A-Z][a-zA-Z\s]*(?:,\s*[A-Z][a-zA-Z]*)?)/,
  ]

  for (const pattern of locationPatterns) {
    const match = jobTitle.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}
