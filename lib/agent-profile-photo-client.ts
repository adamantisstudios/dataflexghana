import { getAgentAuthHeaders } from "@/lib/agent-api-headers"

/** After face-api validation + upload, mark profile photo verified on the server. */
export async function confirmAgentProfilePhotoVerified(
  profileImageUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/agent/profile-photo/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAgentAuthHeaders(),
    },
    credentials: "same-origin",
    body: JSON.stringify({ profile_image_url: profileImageUrl }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.error || "Could not confirm photo verification" }
  }
  return { ok: true }
}
