import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import {
  getStoreSettings,
  upsertStoreSetting,
  deleteStoreSetting,
  type StoreItemType,
} from "@/lib/storefront-server"
import { isStoreItemType, normalizeStoreItemId } from "@/lib/storefront-catalog"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const settings = await getStoreSettings(agentId)
  const bundleIds = settings.filter((s) => s.item_type === "data_bundle").map((s) => s.item_id)
  const wholesaleIds = settings.filter((s) => s.item_type === "wholesale_product").map((s) => s.item_id)

  const db = getAdminClient()
    let savedBundles: Record<string, unknown>[] = []
    if (bundleIds.length > 0) {
      const { data } = await db
        .from("data_bundles")
        .select("id, name, provider, size_gb, price, image_url")
        .in("id", bundleIds)
      savedBundles = data || []
    }

    let savedWholesale: Record<string, unknown>[] = []
    if (wholesaleIds.length > 0) {
      const { data } = await db
        .from("wholesale_products")
        .select("id, name, description, price, image_urls")
        .in("id", wholesaleIds)
      savedWholesale = (data || []).map((p) => {
        const images = (p.image_urls as string[] | null) || []
        return { ...p, image_url: images[0] || null }
      })
    }

  const profileRes = await getAdminClient()
    .from("agent_store_profiles")
    .select("storefront_commission_balance")
    .eq("agent_id", agentId)
    .maybeSingle()

  return NextResponse.json({
    settings,
    savedBundles,
    savedWholesale,
    storefront_commission_balance: Number(profileRes.data?.storefront_commission_balance ?? 0),
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

    if (!isStoreItemType(item_type)) {
      return NextResponse.json({ error: `Invalid item_type: ${item_type}` }, { status: 400 })
    }

    const normalizedItemId = normalizeStoreItemId(item_id, item_type)
    const row = await upsertStoreSetting(agentId, normalizedItemId, item_type, {
      is_visible,
      custom_margin,
    })

    return NextResponse.json({ success: true, setting: row })
  } catch (error) {
    console.error("store-settings PUT:", error)
    const message = error instanceof Error ? error.message : "Failed to save setting"
    return NextResponse.json({ error: message }, { status: 500 })
  }
})

export const DELETE = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const agentId = body.agentId || user.id

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { item_id, item_type } = body as { item_id: string; item_type: StoreItemType }
    if (!item_id || !item_type) {
      return NextResponse.json({ error: "item_id and item_type required" }, { status: 400 })
    }

    await deleteStoreSetting(agentId, normalizeStoreItemId(item_id, item_type), item_type)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("store-settings DELETE:", error)
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 })
  }
})
