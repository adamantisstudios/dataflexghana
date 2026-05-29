import type { AgentProfileFields } from "@/lib/agent-profile-completion"

export type PhotoVerificationStatus = "verified" | "pending" | "unverified"

/** Photo approval state — separate from full profile completion badge. */
export function getPhotoVerificationStatus(
  agent: Pick<AgentProfileFields, "profile_image_url" | "profile_verified"> | null | undefined,
): PhotoVerificationStatus {
  if (!agent) return "unverified"
  if (agent.profile_verified === true) return "verified"
  if (String(agent.profile_image_url ?? "").trim()) return "pending"
  return "unverified"
}

export function photoVerificationStatusLabel(status: PhotoVerificationStatus): string {
  if (status === "verified") return "Verified"
  if (status === "pending") return "Pending"
  return "Unverified"
}
