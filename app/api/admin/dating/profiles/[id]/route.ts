import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const action = String(body.action ?? "")

  const db = getAdminClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (action === "approve") {
    updates.is_approved = true
    updates.is_active = true
  } else if (action === "reject") {
    updates.is_approved = false
    updates.is_active = false
  } else if (action === "suspend") {
    updates.is_suspended = true
    updates.is_active = false
  } else if (action === "unsuspend") {
    updates.is_suspended = false
    updates.is_active = true
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const { data, error } = await db
    .from("dating_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, profile: data })
}
