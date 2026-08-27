import { type NextRequest, NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { assertChannelAdmin } from "@/lib/channel-audio-auth"

/** Resolved caller context for a channel host/admin mutation. */
export type ChannelHostContext = {
  db: SupabaseClient
  channelId: string
  agentId: string
  agentName: string
  /** "admin" | "teacher" | "owner" | "platform_admin" */
  role: string
  channel: Record<string, any>
}

export type HostGuardResult =
  | { ok: true; ctx: ChannelHostContext }
  | { ok: false; response: NextResponse }

/**
 * Authenticates the mobile caller and proves they may administer [channelId].
 *
 * Authorisation is delegated to [assertChannelAdmin], which accepts the channel
 * teacher/admin roles, the `teaching_channels.created_by` owner and the
 * platform administrator — an ordinary active member is rejected with 403.
 */
export async function requireChannelHost(
  request: NextRequest,
  channelId: string,
): Promise<HostGuardResult> {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return { ok: false, response: createAuthErrorResponse(auth.error || "Unauthorized", 401) }
  }

  if (!channelId) {
    return { ok: false, response: NextResponse.json({ error: "channelId is required" }, { status: 400 }) }
  }

  const db = getAdminClient()

  const { data: channel } = await db
    .from("teaching_channels")
    .select("*")
    .eq("id", channelId)
    .maybeSingle()

  if (!channel) {
    return { ok: false, response: NextResponse.json({ error: "Channel not found" }, { status: 404 }) }
  }

  const agentId = String(auth.user.id)
  const access = await assertChannelAdmin(db, channelId, agentId, auth.user)
  if (!access.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You are not a host of this channel.", requires_host: true },
        { status: 403 },
      ),
    }
  }

  return {
    ok: true,
    ctx: {
      db,
      channelId,
      agentId,
      agentName: String(auth.user.full_name || auth.user.agent_name || "Teacher"),
      role: access.role,
      channel: channel as Record<string, any>,
    },
  }
}

/**
 * Confirms `id` exists in `table` **and** belongs to `channelId`, so a host of
 * one channel can never mutate another channel's rows by guessing an id.
 */
export async function rowBelongsToChannel(
  db: SupabaseClient,
  table: string,
  id: string,
  channelId: string,
): Promise<boolean> {
  if (!id) return false
  const { data } = await db
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("channel_id", channelId)
    .maybeSingle()
  return Boolean(data)
}

export function notInChannel(): NextResponse {
  return NextResponse.json({ error: "That content does not belong to this channel." }, { status: 404 })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverError(scope: string, error: unknown): NextResponse {
  console.error(`[agent mobile channel ${scope}]`, error)
  const message = error instanceof Error ? error.message : "Request failed"
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function readJson(request: NextRequest): Promise<Record<string, any>> {
  const body = await request.json().catch(() => ({}))
  return (body && typeof body === "object" ? body : {}) as Record<string, any>
}

export const str = (v: unknown): string => (v == null ? "" : String(v).trim())
export const num = (v: unknown): number | null => {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
