export const DATING_INTENTIONS = [
  "serious_relationship",
  "marriage",
  "friendship",
  "open_to_possibilities_serious",
] as const

export type DatingIntention = (typeof DATING_INTENTIONS)[number]

export const DATING_PLANS = {
  free: { price: 0, swipesPerDay: 10, matchesPerDay: 2, label: "Free" },
  silver: { price: 15, swipesPerDay: 50, matchesPerDay: 10, label: "Silver" },
  gold: { price: 30, swipesPerDay: 999999, matchesPerDay: 20, label: "Gold" },
} as const

export type DatingPlan = keyof typeof DATING_PLANS

export const COINS_PACK = { price: 5, swipes: 20, matches: 5, label: "Coins Pack" }

export const COUNSELLING_SESSION_PRICE_GHS = 20
export const COUNSELLING_SESSION_MINUTES = 30

export const ICEBREAKER_PROMPTS = [
  "What's your favourite way to spend a Sunday?",
  "What values matter most to you in a relationship?",
  "What's something you're passionate about that you'd love to share?",
] as const

export const INTENTION_LABELS: Record<DatingIntention, string> = {
  serious_relationship: "Serious relationship",
  marriage: "Marriage",
  friendship: "Meaningful friendship",
  open_to_possibilities_serious: "Open to possibilities (serious only)",
}

export const EDUCATION_OPTIONS = [
  "High School",
  "Diploma",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
] as const

export const RELIGION_OPTIONS = ["Christian", "Muslim", "Other", "None"] as const

export const LIFESTYLE_OPTIONS = ["Never", "Socially", "Regularly"] as const

export const CHILDREN_OPTIONS = [
  "None",
  "Have children",
  "Want children someday",
  "Not sure",
] as const

export const PERSONALITY_TRAIT_OPTIONS = [
  "Outgoing",
  "Quiet",
  "Ambitious",
  "Funny",
  "Creative",
  "Caring",
  "Adventurous",
  "Thoughtful",
] as const

export const WEEKLY_AVAILABILITY_OPTIONS = [
  "Weekends",
  "Evenings",
  "Anytime",
  "Weekdays",
] as const

export const LANGUAGE_SUGGESTIONS = [
  "English",
  "Twi",
  "Ga",
  "Ewe",
  "Hausa",
  "French",
] as const

export function isFemaleGender(gender: string | null | undefined): boolean {
  const g = String(gender ?? "").toLowerCase()
  return g === "female" || g === "woman" || g === "f"
}

export function religionCompatible(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const open = new Set(["Other", "None"])
  return open.has(a) || open.has(b)
}

export function lifestyleAligned(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false
  if (a === b) return true
  return (a === "Never" && b === "Never") || (a === "Socially" && b === "Socially")
}

export function childrenCompatible(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const compatible: [string, string][] = [
    ["Want children someday", "Not sure"],
    ["None", "Not sure"],
  ]
  return compatible.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

export function locationProximityMatch(
  viewerLocation: string | null | undefined,
  candidateLocation: string | null | undefined,
  maxDistanceKm?: number | null,
): boolean {
  if (!viewerLocation?.trim() || !candidateLocation?.trim()) return false
  const v = viewerLocation.toLowerCase().trim()
  const c = candidateLocation.toLowerCase().trim()
  if (v === c) return true
  const vParts = v.split(/[,\s]+/).filter((p) => p.length > 2)
  const cParts = c.split(/[,\s]+/).filter((p) => p.length > 2)
  const shared = vParts.some((p) => cParts.includes(p) || c.includes(p) || v.includes(p))
  if (!shared && maxDistanceKm != null && maxDistanceKm >= 100) return true
  return shared
}

export function intentionCompatibilityScore(
  a: DatingIntention,
  b: DatingIntention,
): number {
  if (a === b) return 40
  const compatiblePairs: [DatingIntention, DatingIntention][] = [
    ["serious_relationship", "open_to_possibilities_serious"],
    ["marriage", "open_to_possibilities_serious"],
    ["marriage", "serious_relationship"],
    ["open_to_possibilities_serious", "serious_relationship"],
    ["open_to_possibilities_serious", "marriage"],
  ]
  for (const [x, y] of compatiblePairs) {
    if ((a === x && b === y) || (a === y && b === x)) return 20
  }
  return 5
}
