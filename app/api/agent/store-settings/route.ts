import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { getStoreSettings, upsertStoreSetting, type StoreItemType } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const db = getAdminClient()
  const [settings, bundles, services] = await Promise.all([
    getStoreSettings(agentId),
    db
      .from("data_bundles")
      .select("id, name, provider, size_gb, price, validity_months, image_url, is_active")
      .eq("is_active", true)
      .order("provider")
      .order("size_gb"),
    db.from("services").select("id, title, description, commission_amount, product_cost, image_url").order("title"),
  ])

  return NextResponse.json({
    settings,
    dataBundles: bundles.data || [],
    referralServices: services.data || [],
  })
})

export const PUT = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const agentId = body.agentId || user.id

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { item_id, item_type, is_visible, custom_margin } = body as {
      item_id: string
      item_type: StoreItemType
      is_visible?: boolean
      custom_margin?: number
    }

    if (!item_id || !item_type) {
      return NextResponse.json({ error: "item_id and item_type required" }, { status: 400 })
    }

    const row = await upsertStoreSetting(agentId, item_id, item_type, {
      is_visible,
      custom_margin,
    })

    return NextResponse.json({ success: true, setting: row })
  } catch (error) {
    console.error("store-settings PUT:", error)
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 })
  }
})
