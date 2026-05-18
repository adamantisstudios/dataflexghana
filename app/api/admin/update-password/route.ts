import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import bcrypt from "bcryptjs"

async function passwordMatches(stored: string | null | undefined, candidate: string): Promise<boolean> {
  if (!stored) return false
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(candidate, stored)
  }
  return stored === candidate
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { admin_id, current_password, new_password } = await request.json()

    if (!admin_id || !current_password || !new_password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (String(new_password).length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    if (adminSession.user?.id && adminSession.user.id !== admin_id) {
      return NextResponse.json({ error: "You can only change your own password" }, { status: 403 })
    }

    const supabase = getAdminClient()

    const { data: admin, error: fetchError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, is_active, password_hash, created_at, last_login")
      .eq("id", admin_id)
      .eq("is_active", true)
      .single()

    if (fetchError || !admin) {
      console.error("[update-password] Admin fetch error:", fetchError)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const matches = await passwordMatches(admin.password_hash, current_password)
    if (!matches) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(String(new_password), 10)

    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin_users")
      .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
      .eq("id", admin_id)
      .select("id, email, full_name, role, is_active, created_at, last_login")
      .single()

    if (updateError || !updatedAdmin) {
      console.error("[update-password] Update error:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      admin: updatedAdmin,
    })
  } catch (error) {
    console.error("[update-password] Endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
