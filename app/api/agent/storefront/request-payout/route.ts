import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { getStoreProfile } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

const STOREFRONT_PAYOUT_NOTE = "source:storefront"

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json().catch(() => ({}))
    const agentId = (body.agentId as string) || user.id

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = getAdminClient()
    const profile = await getStoreProfile(agentId)
    const balance = Number(profile?.storefront_commission_balance ?? 0)

    if (balance <= 0) {
      return NextResponse.json(
        { error: "No storefront commission balance available to withdraw" },
        { status: 400 },
      )
    }

    const { data: agentRow, error: agentError } = await db
      .from("agents")
      .select("id, momo_number, phone_number")
      .eq("id", agentId)
      .single()

    if (agentError || !agentRow) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const momo = String(agentRow.momo_number || agentRow.phone_number || "").trim()
    if (!momo) {
      return NextResponse.json(
        { error: "Add your MoMo number in agent settings before requesting payout" },
        { status: 400 },
      )
    }

    const { data: pending } = await db
      .from("withdrawals")
      .select("id")
      .eq("agent_id", agentId)
      .eq("status", "requested")
      .ilike("admin_notes", `%${STOREFRONT_PAYOUT_NOTE}%`)

    if (pending?.length) {
      return NextResponse.json(
        { error: "You already have a pending storefront payout request" },
        { status: 400 },
      )
    }

    const { error: balanceError } = await db
      .from("agent_store_profiles")
      .update({
        storefront_commission_balance: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("agent_id", agentId)

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    const { data: withdrawal, error: withdrawalError } = await db
      .from("withdrawals")
      .insert({
        agent_id: agentId,
        amount: balance,
        momo_number: momo,
        status: "requested",
        requested_at: new Date().toISOString(),
        admin_notes: `${STOREFRONT_PAYOUT_NOTE} | Storefront commission payout (₵${balance.toFixed(2)})`,
      })
      .select("id, amount, status")
      .single()

    if (withdrawalError) {
      await db
        .from("agent_store_profiles")
        .update({ storefront_commission_balance: balance })
        .eq("agent_id", agentId)
      return NextResponse.json({ error: withdrawalError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        withdrawal_id: withdrawal?.id,
        amount: balance,
        message: `Payout request for ₵${balance.toFixed(2)} submitted. Admin will pay via MoMo.`,
      },
    })
  } catch (error) {
    console.error("storefront request-payout:", error)
    return NextResponse.json({ error: "Failed to submit payout request" }, { status: 500 })
  }
})
