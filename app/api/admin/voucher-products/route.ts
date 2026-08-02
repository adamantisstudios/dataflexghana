import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  fetchAllVoucherProducts,
  seedVoucherProductsFromDefaults,
} from "@/lib/e-products-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const products = await fetchAllVoucherProducts()
    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error("GET /api/admin/voucher-products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const action = body.action

    if (action === "seed") {
      const result = await seedVoucherProductsFromDefaults()
      const products = await fetchAllVoucherProducts()
      return NextResponse.json({ success: true, ...result, products })
    }

    const title = String(body.title ?? "").trim()
    const price = Number(body.price)
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 })
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "price must be a positive number" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("e_products")
      .insert({
        title,
        description: String(body.description ?? "").trim() || null,
        image_url: String(body.image_url ?? "").trim() || null,
        price,
        quantity: Math.max(0, Math.round(Number(body.quantity ?? 0))),
        status: body.status === "draft" ? "draft" : "published",
      })
      .select("id, title, description, image_url, price, quantity, status")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error("POST /api/admin/voucher-products:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
