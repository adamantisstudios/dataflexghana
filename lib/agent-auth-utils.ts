import type { AuthResult } from "@/lib/api-auth"

/** Agent record returned by authenticateAgent (stored on `user`, not `agent`). */
export function getAuthAgent(auth: AuthResult) {
  return auth.user as { id: string } | undefined
}

export function getAuthAgentId(auth: AuthResult, fallback?: string): string | null {
  return getAuthAgent(auth)?.id ?? fallback ?? null
}

/** Safely parse JSON from a fetch Response; avoids "Unexpected end of JSON input". */
export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response,
): Promise<{ ok: boolean; data: T; status: number }> {
  const status = res.status
  const text = await res.text()
  if (!text.trim()) {
    return {
      ok: false,
      data: { success: false, error: `Empty response from server (${status})` } as T,
      status,
    }
  }
  try {
    return { ok: true, data: JSON.parse(text) as T, status }
  } catch {
    return {
      ok: false,
      data: { success: false, error: `Invalid response from server (${status})` } as T,
      status,
    }
  }
}
