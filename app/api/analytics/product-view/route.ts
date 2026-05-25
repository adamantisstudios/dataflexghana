import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product_id = String(body.product_id ?? "").trim()
    if (!product_id) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: product } = await db
      .from("agent_products")
      .select("id, view_count, is_active")
      .eq("id", product_id)
      .eq("is_active", true)
      .maybeSingle()

    if (!product) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const nextCount = Number(product.view_count ?? 0) + 1
    await db.from("agent_products").update({ view_count: nextCount }).eq("id", product_id)

    return NextResponse.json({ success: true, view_count: nextCount })
  } catch (e) {
    console.error("[product-view]", e)
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
  }
}
