import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const db = getAdminClient()
  const { data: packages, error } = await db
    .from("listing_packages")
    .select("*")
    .order("price", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: subsRaw } = await db
    .from("agent_listing_subscriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  const pkgMap = new Map((packages || []).map((p) => [p.id, p]))
  const subscriptions = (subsRaw || []).map((s) => ({
    ...s,
    package: pkgMap.get(s.package_id)
      ? {
          name: pkgMap.get(s.package_id)!.name,
          max_listings: pkgMap.get(s.package_id)!.max_listings,
          features: pkgMap.get(s.package_id)!.features ?? null,
        }
      : undefined,
  }))

  const { data: products } = await db
    .from("agent_products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  return NextResponse.json({
    success: true,
    packages: packages || [],
    subscriptions,
    products: products || [],
  })
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (body.name != null) updates.name = String(body.name).trim()
    if (body.price != null) updates.price = Number(body.price)
    if (body.max_listings != null) updates.max_listings = parseInt(String(body.max_listings), 10)
    if (body.includes_analytics !== undefined) updates.includes_analytics = Boolean(body.includes_analytics)
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
    if (body.features != null && typeof body.features === "object") {
      updates.features = body.features
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("listing_packages")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, package: data })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
