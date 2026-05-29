import { getStoredAgent } from "@/lib/unified-auth-system"

/** Agent auth headers for API routes (Bearer + x-agent-id + phone). Always reads fresh from storage. */
export function getAgentAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" }
  }

  try {
    const agent = getStoredAgent()
    if (!agent?.id) {
      return { "Content-Type": "application/json" }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${btoa(JSON.stringify(agent))}`,
      "x-agent-id": String(agent.id),
    }

    if (agent.phone_number) {
      headers["x-agent-phone"] = String(agent.phone_number)
    }

    return headers
  } catch {
    return { "Content-Type": "application/json" }
  }
}

/** Read stored agent id for request body fallbacks (mobile-safe). */
export function getStoredAgentId(): string | null {
  if (typeof window === "undefined") return null
  return getStoredAgent()?.id ?? null
}
