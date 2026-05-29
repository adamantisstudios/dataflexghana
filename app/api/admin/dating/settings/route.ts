import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getDatingSettings, updateDatingSettings } from "@/lib/dating/dating-settings"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  const settings = await getDatingSettings()
  return NextResponse.json({ success: true, settings })
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const body = await request.json()
    const settings = await updateDatingSettings({
      silver_price: body.silver_price != null ? Number(body.silver_price) : undefined,
      gold_price: body.gold_price != null ? Number(body.gold_price) : undefined,
      coin_pack_price: body.coin_pack_price != null ? Number(body.coin_pack_price) : undefined,
      counselling_session_price:
        body.counselling_session_price != null
          ? Number(body.counselling_session_price)
          : undefined,
    })
    return NextResponse.json({ success: true, settings })
  } catch (e) {
    console.error("[admin/dating/settings PATCH]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update settings" },
      { status: 500 },
    )
  }
}
