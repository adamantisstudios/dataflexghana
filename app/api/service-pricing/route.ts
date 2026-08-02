import { NextResponse } from "next/server"
import { fetchServicePricingRows } from "@/lib/service-pricing-server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const pricing = await fetchServicePricingRows()
    return NextResponse.json({ success: true, pricing })
  } catch (error) {
    console.error("GET /api/service-pricing:", error)
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 })
  }
}
