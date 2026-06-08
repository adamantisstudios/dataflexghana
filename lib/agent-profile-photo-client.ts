import { getAgentAuthHeaders } from "@/lib/agent-api-headers"

/** After face-api validation + upload, submit photo for auto approval or admin review. */
export async function confirmAgentProfilePhotoVerified(
  profileImageUrl: string,
  autoApproved = false,
): Promise<{ ok: boolean; error?: string; pending?: boolean; profile_verified?: boolean }> {
  const res = await fetch("/api/agent/profile-photo/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAgentAuthHeaders(),
    },
    credentials: "same-origin",
    body: JSON.stringify({ profile_image_url: profileImageUrl, auto_approved: autoApproved }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.error || "Could not confirm photo verification" }
  }
  return { ok: true, pending: data.pending, profile_verified: data.profile_verified }
}
