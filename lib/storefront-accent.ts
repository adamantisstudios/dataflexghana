export const PREMIUM_INFLUENCER_ACCENT = "#D97706"
export const DEFAULT_STORE_ACCENT = "#3B82F6"

/** Premium influencers get gold by default; a saved custom primary_color overrides it. */
export function resolveStorefrontAccent(
  isPremiumInfluencer: boolean,
  primaryColor: string | null | undefined,
): string {
  const trimmed = primaryColor?.trim()
  if (!isPremiumInfluencer) {
    return trimmed || DEFAULT_STORE_ACCENT
  }
  if (!trimmed || trimmed.toLowerCase() === DEFAULT_STORE_ACCENT.toLowerCase()) {
    return PREMIUM_INFLUENCER_ACCENT
  }
  return trimmed
}
