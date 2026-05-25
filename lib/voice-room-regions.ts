/** Ghana regions for voice room targeting (matches agent registration). */
export const VOICE_ROOM_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Western North",
  "Oti",
  "Savannah",
  "North East",
] as const

export function normalizeVoiceRegion(region: string | null | undefined): string {
  return String(region ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+region$/i, "")
    .replace(/\s+/g, " ")
}

export function voiceRegionsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeVoiceRegion(a)
  const nb = normalizeVoiceRegion(b)
  if (!na || !nb) return false
  if (na === nb) return true
  // "greater accra" vs "greater accra region"
  return na.includes(nb) || nb.includes(na)
}
