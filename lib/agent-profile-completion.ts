export type AgentProfileFields = {
  email?: string | null
  profession?: string | null
  exact_location?: string | null
  profile_image_url?: string | null
  profile_verified?: boolean | null
  isapproved?: boolean
  full_name?: string | null
}

export function isProfileFieldFilled(value: string | null | undefined): boolean {
  return Boolean(String(value ?? "").trim())
}

/** Profile complete + photo verified (dashboard badge / admin label). */
export function isAgentProfileVerified(agent: AgentProfileFields | null | undefined): boolean {
  return (
    isProfileFieldFilled(agent?.email) &&
    isProfileFieldFilled(agent?.profession) &&
    isProfileFieldFilled(agent?.exact_location) &&
    isProfileFieldFilled(agent?.profile_image_url) &&
    agent?.profile_verified === true
  )
}

/** All four profile fields filled (may still be unverified photo). */
export function isAgentProfileFieldsComplete(agent: AgentProfileFields | null | undefined): boolean {
  return (
    isProfileFieldFilled(agent?.email) &&
    isProfileFieldFilled(agent?.profession) &&
    isProfileFieldFilled(agent?.exact_location) &&
    isProfileFieldFilled(agent?.profile_image_url)
  )
}

export function isAgentProfileComplete(agent: AgentProfileFields | null | undefined): boolean {
  if (!agent?.isapproved) return true
  return isAgentProfileVerified(agent)
}

export function agentNeedsProfileCompletion(agent: AgentProfileFields | null | undefined): boolean {
  return Boolean(agent?.isapproved) && !isAgentProfileVerified(agent)
}

export function getAgentInitials(name: string | null | undefined): string {
  const parts = String(name ?? "A")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "A"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const AGENT_PROFILE_PRIVACY_NOTICE =
  "Your profile information is used to verify your identity and is kept private. Only platform administrators can view it."
