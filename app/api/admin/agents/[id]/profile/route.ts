import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id: agentId } = await params
    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const email = body.email != null ? String(body.email).trim() : undefined
    const profession = body.profession != null ? String(body.profession).trim() : undefined
    const exact_location = body.exact_location != null ? String(body.exact_location).trim() : undefined
    const phone_number = body.phone_number != null ? String(body.phone_number).trim() : undefined
    const profile_image_url =
      body.profile_image_url != null ? String(body.profile_image_url).trim() : undefined

    const updates: Record<string, string> = {}
    if (email !== undefined) updates.email = email
    if (profession !== undefined) updates.profession = profession
    if (exact_location !== undefined) updates.exact_location = exact_location
    if (phone_number !== undefined) updates.phone_number = phone_number
    if (profile_image_url !== undefined) updates.profile_image_url = profile_image_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: existing, error: fetchError } = await db
      .from("agents")
      .select("id")
      .eq("id", agentId)
      .maybeSingle()

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const { data, error } = await db
      .from("agents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", agentId)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, agent: data })
  } catch (e) {
    console.error("[admin/agents/profile PATCH]", e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to update profile" },
      { status: 500 },
    )
  }
}
