import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()
    const { data, error } = await db.from("farm_platform_config").select("*").eq("id", 1).maybeSingle()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      data: {
        agent_commission_rate: Number(data?.agent_commission_rate ?? 0.1),
        default_delivery_fee: Number(data?.default_delivery_fee ?? 0),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load config" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.agent_commission_rate !== undefined) {
      const rate = Number(body.agent_commission_rate)
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
        return NextResponse.json({ success: false, error: "Rate must be between 0 and 1" }, { status: 400 })
      }
      updates.agent_commission_rate = rate
    }

    if (body.default_delivery_fee !== undefined) {
      const fee = Number(body.default_delivery_fee)
      if (!Number.isFinite(fee) || fee < 0) {
        return NextResponse.json({ success: false, error: "Invalid delivery fee" }, { status: 400 })
      }
      updates.default_delivery_fee = fee
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("farm_platform_config")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      data: {
        agent_commission_rate: Number(data.agent_commission_rate),
        default_delivery_fee: Number(data.default_delivery_fee),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
}
