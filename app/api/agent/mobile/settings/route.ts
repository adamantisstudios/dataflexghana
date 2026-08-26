import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { hashPassword, verifyPassword } from "@/lib/supabase"
import { sanitizeAgentForMobile } from "@/lib/agent-mobile"

export const dynamic = "force-dynamic"

const PROFILE_SELECT =
  "id, full_name, phone_number, email, profession, exact_location, profile_image_url, profile_verified, isapproved, two_factor_enabled"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const db = getAdminClient()
  const { data, error } = await db.from("agents").select(PROFILE_SELECT).eq("id", agent.id).maybeSingle()

  if (error) {
    console.error("[mobile/settings GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    agent: sanitizeAgentForMobile(data),
  })
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = String(body.email ?? "").trim()
  const profession = String(body.profession ?? "").trim()
  const exact_location = String(body.exact_location ?? "").trim()
  const profile_image_url = String(body.profile_image_url ?? "").trim()

  if (!email || !profession || !exact_location) {
    return NextResponse.json(
      { error: "email, profession, and exact_location are required" },
      { status: 400 },
    )
  }

  const update: Record<string, unknown> = {
    email,
    profession,
    exact_location,
    updated_at: new Date().toISOString(),
  }
  if (profile_image_url) {
    update.profile_image_url = profile_image_url
  }

  const db = getAdminClient()
  const { data, error } = await db
    .from("agents")
    .update(update)
    .eq("id", agent.id)
    .select(PROFILE_SELECT)
    .maybeSingle()

  if (error) {
    console.error("[mobile/settings PUT]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    agent: sanitizeAgentForMobile(data || {}),
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const action = String(body.action ?? "change-password").trim()
  if (action !== "change-password") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  }

  const currentPassword = String(body.current_password ?? body.currentPassword ?? "")
  const newPassword = String(body.new_password ?? body.newPassword ?? "")

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "current_password and new_password are required" }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
  }

  const db = getAdminClient()
  const { data: row, error: fetchError } = await db
    .from("agents")
    .select("password_hash")
    .eq("id", agent.id)
    .maybeSingle()

  if (fetchError || !row?.password_hash) {
    return NextResponse.json({ error: "Could not verify current password" }, { status: 400 })
  }

  const ok = await verifyPassword(currentPassword, row.password_hash)
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  const password_hash = await hashPassword(newPassword)
  const { error: updateError } = await db
    .from("agents")
    .update({
      password_hash,
      password_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agent.id)

  if (updateError) {
    console.error("[mobile/settings POST]", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Password updated successfully" })
}
