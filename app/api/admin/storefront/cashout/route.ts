import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"

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
