import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const ALLOWED_STATUSES = ["pending", "approved", "rejected"] as const
type TopupStatus = (typeof ALLOWED_STATUSES)[number]

/**
 * Wallet top-up requests for admin clients.
 *
 * The web dashboard reads and writes `wallet_topups` through the browser Supabase
 * client, so there was no HTTP surface for the admin mobile app. This route
 * mirrors that behaviour (same select, same ordering, same pending-only default)
 * so both clients agree on what a top-up queue looks like.
 *
 * Crediting is deliberately NOT part of this route — approval must go through
 * POST /api/admin/wallet-topups/[id]/approve, which is idempotent and is the
 * only place a wallet credit is written.
 */
export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { searchParams } = new URL(request.url)
    const statusParam = (searchParams.get("status") || "pending").trim().toLowerCase()
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 200)
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0)

    if (statusParam !== "all" && !ALLOWED_STATUSES.includes(statusParam as TopupStatus)) {
      return NextResponse.json(
        { success: false, error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}, all` },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    let query = db
      .from("wallet_topups")
      .select("*, agents!inner(id, full_name, phone_number)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (statusParam !== "all") {
      query = query.eq("status", statusParam)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const items = data ?? []
    return NextResponse.json({
      success: true,
      data: items,
      items,
      meta: {
        total: count ?? items.length,
        limit,
        offset,
        hasMore: offset + items.length < (count ?? items.length),
      },
    })
  } catch (error) {
    console.error("Error listing wallet top-ups:", error)
    const message = error instanceof Error ? error.message : "Failed to list wallet top-ups"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * Raise a pending top-up request on an agent's behalf. Mirrors the dashboard's
 * "create wallet top-up" dialog: it only queues the request, it never credits.
 */
export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json().catch(() => ({}))
    const agentId = typeof body.agent_id === "string" ? body.agent_id.trim() : ""
    const amount = Number(body.amount)

    if (!agentId) {
      return NextResponse.json({ success: false, error: "agent_id is required" }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be a number greater than 0" },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: agent, error: agentError } = await db
      .from("agents")
      .select("id, full_name, phone_number")
      .eq("id", agentId)
      .maybeSingle()

    if (agentError) {
      return NextResponse.json({ success: false, error: agentError.message }, { status: 500 })
    }
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const insert: Record<string, unknown> = {
      agent_id: agentId,
      amount,
      status: "pending",
    }
    const paymentReference =
      typeof body.payment_reference === "string" ? body.payment_reference.trim() : ""
    if (paymentReference) insert.payment_reference = paymentReference
    const paymentMethod =
      typeof body.payment_method === "string" ? body.payment_method.trim() : ""
    if (paymentMethod) insert.payment_method = paymentMethod

    const { data, error } = await db
      .from("wallet_topups")
      .insert([insert])
      .select("*")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { ...data, agents: agent },
      message: `Top-up request for GH₵${amount.toFixed(2)} queued for approval`,
    })
  } catch (error) {
    console.error("Error creating wallet top-up:", error)
    const message = error instanceof Error ? error.message : "Failed to create wallet top-up"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
