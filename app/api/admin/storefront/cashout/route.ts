import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin, requireAdminSession } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { isStorefrontWithdrawal, STOREFRONT_PAYOUT_NOTE } from "@/lib/storefront-payout"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { agent_id } = body

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: profile, error: fetchError } = await db
      .from("agent_store_profiles")
      .select("agent_id, storefront_commission_balance")
      .eq("agent_id", agent_id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const paidAmount = Number(profile?.storefront_commission_balance ?? 0)

    const { error: updateError } = await db
      .from("agent_store_profiles")
      .upsert(
        {
          agent_id,
          storefront_commission_balance: 0,
        },
        { onConflict: "agent_id" },
      )

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    let pendingRes: {
      data: Array<{ id: string; source?: string | null; admin_notes?: string | null; status?: string | null }> | null
      error: { message?: string } | null
    } = await db
      .from("withdrawals")
      .select("id, source, admin_notes, status")
      .eq("agent_id", agent_id)
      .in("status", ["requested", "pending", "processing"])

    if (pendingRes.error?.message?.includes("source")) {
      pendingRes = await db
        .from("withdrawals")
        .select("id, admin_notes, status")
        .eq("agent_id", agent_id)
        .in("status", ["requested", "pending", "processing"])
    }

    const storefrontWithdrawalIds = (pendingRes.data || [])
      .filter((row) => isStorefrontWithdrawal(row as { source?: string | null; admin_notes?: string | null }))
      .map((row) => row.id)

    if (storefrontWithdrawalIds.length > 0) {
      await db
        .from("withdrawals")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          admin_notes: `${STOREFRONT_PAYOUT_NOTE} | Paid from Storefront Cashout`,
        })
        .in("id", storefrontWithdrawalIds)
    }

    return NextResponse.json({
      success: true,
      agent_id,
      amount_paid: paidAmount,
      message: `Marked ₵${paidAmount.toFixed(2)} as paid and reset balance`,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    let agent_id = request.nextUrl.searchParams.get("agent_id")?.trim()
    let confirm_clear_balance = false

    try {
      const body = await request.json()
      if (!agent_id && body?.agent_id) agent_id = String(body.agent_id).trim()
      confirm_clear_balance = body?.confirm_clear_balance === true
    } catch {
      // query-only DELETE is fine
    }

    if (!agent_id) {
      return NextResponse.json({ success: false, error: "agent_id is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: profile, error: fetchError } = await db
      .from("agent_store_profiles")
      .select("agent_id, storefront_commission_balance, store_name")
      .eq("agent_id", agent_id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }
    if (!profile) {
      return NextResponse.json({ success: false, error: "Agent store profile not found" }, { status: 404 })
    }

    const balance = Number(profile.storefront_commission_balance ?? 0)
    if (balance > 0 && !confirm_clear_balance) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This agent has a positive commission balance. Confirm that you understand you are clearing the balance before deleting.",
          requires_confirmation: true,
          balance,
        },
        { status: 400 },
      )
    }

    const { error: updateError } = await db
      .from("agent_store_profiles")
      .upsert({ agent_id, storefront_commission_balance: 0 }, { onConflict: "agent_id" })

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_storefront_cashout",
      targetTable: "agent_store_profiles",
      targetId: agent_id,
      oldData: profile as Record<string, unknown>,
      newData: { agent_id, storefront_commission_balance: 0, cleared_balance: balance },
    })

    return NextResponse.json({
      success: true,
      agent_id,
      cleared_balance: balance,
      message:
        balance > 0
          ? `Cleared ₵${balance.toFixed(2)} and reset commission balance to ₵0`
          : "Commission balance reset to ₵0",
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    )
  }
}
