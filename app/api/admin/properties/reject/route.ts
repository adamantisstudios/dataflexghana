import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const propertyId = String(body.property_id || "").trim()
    if (!propertyId) {
      return NextResponse.json({ success: false, error: "property_id is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("properties")
      .update({ is_approved: false, status: "Unpublished" })
      .eq("id", propertyId)
      .select("id, title, is_approved, status")
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, property: data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Rejection failed" },
      { status: 500 },
    )
  }
}
