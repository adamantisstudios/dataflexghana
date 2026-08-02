import { NextResponse } from "next/server"
import { fetchPublishedVoucherProducts } from "@/lib/e-products-server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const products = await fetchPublishedVoucherProducts()
    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error("GET /api/voucher-products:", error)
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 })
  }
}
