/** Bearer token for agent API routes using withUnifiedAuth */
export function getAgentAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem("agent")
    if (!raw) return {}
    const agent = JSON.parse(raw)
    if (!agent?.id) return {}
    return { Authorization: `Bearer ${btoa(JSON.stringify(agent))}` }
  } catch {
    return {}
  }
}
