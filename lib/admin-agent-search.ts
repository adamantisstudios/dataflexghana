import { getAdminAuthHeaders } from "@/lib/api-client"

export const ADMIN_AGENT_SEARCH_MIN_CHARS = 4
export const ADMIN_AGENT_SEARCH_DEBOUNCE_MS = 300

export interface AdminAgentSearchResult {
  id: string
  full_name: string
  phone_number?: string | null
  momo_number?: string | null
  email?: string | null
  isapproved?: boolean
  region?: string | null
}

export async function fetchAdminAgentsBySearch(
  query: string,
  limit = 30,
): Promise<AdminAgentSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < ADMIN_AGENT_SEARCH_MIN_CHARS) {
    return []
  }

  const params = new URLSearchParams({
    search: trimmed,
    limit: String(limit),
  })

  const res = await fetch(`/api/admin/agents/list?${params.toString()}`, {
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Failed to search agents")
  }
  return (data.agents || []) as AdminAgentSearchResult[]
}

export async function fetchAdminAgentById(id: string): Promise<AdminAgentSearchResult | null> {
  if (!id.trim()) return null

  const res = await fetch(`/api/admin/agents/list?id=${encodeURIComponent(id.trim())}`, {
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) return null
  const agents = (data.agents || []) as AdminAgentSearchResult[]
  return agents[0] ?? null
}
