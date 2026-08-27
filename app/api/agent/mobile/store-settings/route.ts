import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  getStoreSettings,
  upsertStoreSetting,
  deleteStoreSetting,
  type StoreItemType,
} from "@/lib/storefront-server"
import { isStoreItemType, normalizeStoreItemId } from "@/lib/storefront-catalog"

export const dynamic = "force-dynamic"

/**
 * Mobile twin of /api/agent/store-settings.
 *
 * The web route runs on withUnifiedAuth, which resolves cookie/localStorage
 * sessions and enforces the photo-verification gate differently from the mobile
 * Bearer flow, and its DELETE requires a JSON body. Both broke storefront edits
 * from the app, so mobile gets its own route on the standard mobile auth with
 * DELETE driven by query params.
 */

async function resolveAgent(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) return null
  return auth.user as { id: string }
}

async function buildPayload(agentId: string) {
  const settings = await getStoreSettings(agentId)
  const db = getAdminClient()

  const bundleIds = settings.filter((s) => s.item_type === "data_bundle").map((s) => s.item_id)
  const wholesaleIds = settings
    .filter((s) => s.item_type === "wholesale_product")
    .map((s) => s.item_id)

  let savedBundles: Record<string, unknown>[] = []
  if (bundleIds.length > 0) {
    const { data } = await db
      .from("data_bundles")
      .select("id, name, provider, size_gb, price, image_url, validity_months")
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

  const { data: profile } = await db
    .from("agent_store_profiles")
    .select("storefront_commission_balance")
    .eq("agent_id", agentId)
    .maybeSingle()

  return {
    success: true,
    settings,
    savedBundles,
    savedWholesale,
    storefront_commission_balance: Number(profile?.storefront_commission_balance ?? 0),
  }
}

export async function GET(request: NextRequest) {
  const agent = await resolveAgent(request)
  if (!agent) return createAuthErrorResponse("Unauthorized", 401)

  try {
    return NextResponse.json(await buildPayload(agent.id))
  } catch (error) {
    console.error("[mobile/store-settings GET]", error)
    const message = error instanceof Error ? error.message : "Failed to load store settings"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const agent = await resolveAgent(request)
  if (!agent) return createAuthErrorResponse("Unauthorized", 401)

  try {
    const body = (await request.json()) as {
      item_id?: string
      item_type?: StoreItemType
      is_visible?: boolean
      custom_margin?: number
    }

    const itemId = String(body.item_id || "").trim()
    const itemType = body.item_type
    if (!itemId || !itemType) {
      return NextResponse.json({ error: "item_id and item_type required" }, { status: 400 })
    }
    if (!isStoreItemType(itemType)) {
      return NextResponse.json({ error: `Invalid item_type: ${itemType}` }, { status: 400 })
    }

    const margin =
      body.custom_margin === undefined || body.custom_margin === null
        ? undefined
        : Number(body.custom_margin)
    if (margin !== undefined && (Number.isNaN(margin) || margin < 0)) {
      return NextResponse.json({ error: "custom_margin must be zero or greater" }, { status: 400 })
    }

    const setting = await upsertStoreSetting(
      agent.id,
      normalizeStoreItemId(itemId, itemType),
      itemType,
      { is_visible: body.is_visible, custom_margin: margin },
    )

    // Return the refreshed collection so the app never renders a stale list.
    const payload = await buildPayload(agent.id)
    return NextResponse.json({ ...payload, setting })
  } catch (error) {
    console.error("[mobile/store-settings PUT]", error)
    const message = error instanceof Error ? error.message : "Failed to save setting"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const agent = await resolveAgent(request)
  if (!agent) return createAuthErrorResponse("Unauthorized", 401)

  try {
    // Query params rather than a body: DELETE bodies are unreliable across the
    // Dart client and edge proxies.
    let itemId = (request.nextUrl.searchParams.get("item_id") || "").trim()
    let itemType = (request.nextUrl.searchParams.get("item_type") || "").trim()

    if (!itemId || !itemType) {
      try {
        const body = (await request.json()) as { item_id?: string; item_type?: string }
        itemId = itemId || String(body.item_id || "").trim()
        itemType = itemType || String(body.item_type || "").trim()
      } catch {
        // No body sent — query params are the supported path.
      }
    }

    if (!itemId || !itemType) {
      return NextResponse.json({ error: "item_id and item_type required" }, { status: 400 })
    }
    if (!isStoreItemType(itemType)) {
      return NextResponse.json({ error: `Invalid item_type: ${itemType}` }, { status: 400 })
    }

    await deleteStoreSetting(
      agent.id,
      normalizeStoreItemId(itemId, itemType as StoreItemType),
      itemType as StoreItemType,
    )

    const payload = await buildPayload(agent.id)
    return NextResponse.json(payload)
  } catch (error) {
    console.error("[mobile/store-settings DELETE]", error)
    const message = error instanceof Error ? error.message : "Failed to remove"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
