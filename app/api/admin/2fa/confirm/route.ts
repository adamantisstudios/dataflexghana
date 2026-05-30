import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  generatePlainBackupCodes,
  hashBackupCodes,
  verifyTotpToken,
} from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const adminId = String(session.admin.id)
  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: "Verification code is required" }, { status: 400 })

  const { data: admin, error } = await getAdminClient()
    .from("admin_users")
    .select("two_factor_secret, two_factor_enabled")
    .eq("id", adminId)
    .single()

  if (error || !admin?.two_factor_secret) {
    return NextResponse.json({ error: "Start setup first" }, { status: 400 })
  }

  if (admin.two_factor_enabled) {
    return NextResponse.json({ error: "Already enabled" }, { status: 400 })
  }

  if (!verifyTotpToken(String(code), admin.two_factor_secret)) {
    return NextResponse.json({ error: "Invalid code. Check your authenticator app and try again." }, { status: 400 })
  }

  const plainBackupCodes = generatePlainBackupCodes()
  const hashed = hashBackupCodes(plainBackupCodes)

  await getAdminClient()
    .from("admin_users")
    .update({
      two_factor_enabled: true,
      two_factor_backup_codes: hashed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)

  return NextResponse.json({
    success: true,
    backupCodes: plainBackupCodes,
    message: "Save these backup codes in a safe place. Each can only be used once.",
  })
}
