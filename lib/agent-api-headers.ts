/** Agent auth headers for API routes (Bearer + x-agent-id + optional phone). */
export function getAgentAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" }
  }

  try {
    const raw = localStorage.getItem("agent")
    if (!raw) {
      return { "Content-Type": "application/json" }
    }

    const agent = JSON.parse(raw) as {
      id?: string
      phone_number?: string
      full_name?: string
    }

    if (!agent?.id) {
      return { "Content-Type": "application/json" }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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
  try {
    const raw = localStorage.getItem("agent")
    if (!raw) return null
    const agent = JSON.parse(raw) as { id?: string }
    return agent?.id ? String(agent.id) : null
  } catch {
    return null
  }
}
