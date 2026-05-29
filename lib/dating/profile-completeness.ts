export type ProfileCompletenessInput = {
  display_name?: string | null
  bio?: string | null
  age?: number | null
  relationship_status?: string | null
  intentions?: string | null
  location?: string | null
  occupation?: string | null
  interests?: string[] | null
  photo_count?: number
  height_cm?: number | null
  education?: string | null
  religion?: string | null
  drinking?: string | null
  smoking?: string | null
  children?: string | null
  languages?: string[] | null
  personality_traits?: string[] | null
  weekly_availability?: string | null
}

const EXTRA_FIELDS: (keyof ProfileCompletenessInput)[] = [
  "height_cm",
  "education",
  "religion",
  "drinking",
  "smoking",
  "children",
  "languages",
  "personality_traits",
  "weekly_availability",
]

export function calculateProfileCompleteness(input: ProfileCompletenessInput): number {
  let score = 0

  if (input.display_name?.trim()) score += 5
  if (input.bio?.trim()) score += 10
  if (input.age && input.age >= 18) score += 5
  if (input.relationship_status?.trim()) score += 5
  if (input.intentions?.trim()) score += 10
  if (input.location?.trim()) score += 5
  if (input.occupation?.trim()) score += 5

  const interests = input.interests ?? []
  if (interests.length >= 1) score += 10

  const photoCount = input.photo_count ?? 0
  if (photoCount >= 1) score += 15
  if (photoCount >= 2) score += 5
  if (photoCount >= 3) score += 5
  if (photoCount >= 4) score += 5
  if (photoCount >= 5) score += 5

  for (const key of EXTRA_FIELDS) {
    const val = input[key]
    if (Array.isArray(val) ? val.length > 0 : val != null && String(val).trim() !== "") {
      score += 2
    }
  }

  return Math.min(100, score)
}
