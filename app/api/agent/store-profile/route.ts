import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { upsertStoreProfile, getStoreProfile, checkStoreSlugAvailable } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const profile = await getStoreProfile(agentId)
  return NextResponse.json({ profile })
})

export const PUT = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const agentId = body.agentId || user.id

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    let store_slug: string | null = body.store_slug ?? null
    if (store_slug !== null && store_slug !== undefined && String(store_slug).trim() !== "") {
      const check = await checkStoreSlugAvailable(String(store_slug), agentId)
      if (!check.available) {
        return NextResponse.json({ error: check.reason || "Slug unavailable" }, { status: 400 })
      }
      store_slug = check.normalized
    } else {
      store_slug = null
    }

    const profile = await upsertStoreProfile(agentId, {
      store_name: body.store_name,
      store_slug,
      whatsapp_number: body.whatsapp_number,
      phone_number: body.phone_number,
      primary_color: body.primary_color,
      business_info: body.business_info,
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("store-profile PUT:", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
})
