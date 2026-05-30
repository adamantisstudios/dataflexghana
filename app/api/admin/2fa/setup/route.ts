import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { buildOtpAuthUrl, generateTwoFactorSecret } from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const adminId = String(session.admin.id)
  const { data: admin, error } = await getAdminClient()
    .from("admin_users")
    .select("id, email, two_factor_enabled")
    .eq("id", adminId)
    .single()

  if (error || !admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 })
  }

  if (admin.two_factor_enabled) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 400 })
  }

  const secret = generateTwoFactorSecret()
  const label = String(admin.email || admin.id)
  const otpauthUrl = buildOtpAuthUrl(label, secret)

  await getAdminClient()
    .from("admin_users")
    .update({
      two_factor_secret: secret,
      two_factor_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)

  return NextResponse.json({
    success: true,
    secret,
    otpauthUrl,
    accountLabel: label,
  })
}
