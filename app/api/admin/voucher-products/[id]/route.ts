import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title != null) updates.title = String(body.title).trim()
    if (body.description != null) updates.description = String(body.description).trim() || null
    if (body.image_url != null) updates.image_url = String(body.image_url).trim() || null
    if (body.price != null) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: "price must be positive" }, { status: 400 })
      }
      updates.price = price
    }
    if (body.quantity != null) updates.quantity = Math.max(0, Math.round(Number(body.quantity)))
    if (body.status != null) updates.status = body.status === "draft" ? "draft" : "published"
    updates.updated_at = new Date().toISOString()

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("e_products")
      .update(updates)
      .eq("id", id)
      .select("id, title, description, image_url, price, quantity, status")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error("PATCH /api/admin/voucher-products/[id]:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const db = getAdminClient()
  const { error } = await db.from("e_products").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
