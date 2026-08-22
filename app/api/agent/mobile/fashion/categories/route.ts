import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { FASHION_ASSET_BASE } from "@/lib/fashion-catalog"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const db = getAdminClient()
    const { data, error } = await db.from("fashion_categories").select("id, name, created_at").order("name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      categories: data || [],
      asset_base_url: FASHION_ASSET_BASE,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load categories"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
