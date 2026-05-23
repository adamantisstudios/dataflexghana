import { NextResponse } from "next/server"
import { getPublicPropertiesMarketplace } from "@/lib/public-properties-marketplace"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const payload = await getPublicPropertiesMarketplace()
    return NextResponse.json(payload)
  } catch (error) {
    console.error("public properties:", error)
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 })
  }
}
