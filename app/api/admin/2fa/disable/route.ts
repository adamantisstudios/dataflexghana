import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { verifyAdminPassword } from "@/lib/admin-auth-server"
import { verifyTotpToken } from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const adminId = String(session.admin.id)
  const { password, code } = await request.json()

  const { data: admin, error } = await getAdminClient()
    .from("admin_users")
    .select("password_hash, two_factor_secret, two_factor_enabled")
    .eq("id", adminId)
    .single()

  if (error || !admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 })
  if (!admin.two_factor_enabled) {
    return NextResponse.json({ success: true, message: "2FA was not enabled" })
  }

  let authorized = false
  if (password && (await verifyAdminPassword(admin.password_hash, String(password)))) {
    authorized = true
  }
  if (!authorized && code && admin.two_factor_secret && verifyTotpToken(String(code), admin.two_factor_secret)) {
    authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: "Enter your password or a valid authenticator code" }, { status: 401 })
  }

  await getAdminClient()
    .from("admin_users")
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)

  return NextResponse.json({ success: true })
}
