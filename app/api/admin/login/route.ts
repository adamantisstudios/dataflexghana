import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { findAdminByEmail, verifyAdminPassword } from "@/lib/admin-auth-server"
import {
  createPending2FAToken,
  getTrustCookieFromRequest,
  sanitizeAdminForClient,
  verifyTrustDeviceCookie,
} from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const admin = await findAdminByEmail(String(email))
    if (!admin) {
      await logAuditFromRequest(request, {
        actorType: "admin",
        action: "failed_admin_login",
        severity: "warning",
        newData: { reason: "admin_not_found", email },
      })
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await verifyAdminPassword(admin.password_hash, String(password))
    if (!valid) {
      await logAuditFromRequest(request, {
        actorId: admin.id,
        actorType: "admin",
        action: "failed_admin_login",
        severity: "warning",
        targetTable: "admin_users",
        targetId: admin.id,
      })
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (admin.two_factor_enabled && admin.two_factor_secret) {
      const trustCookie = getTrustCookieFromRequest(request, "admin")
      if (!verifyTrustDeviceCookie(trustCookie, admin.id, "admin")) {
        await logAuditFromRequest(request, {
          actorId: admin.id,
          actorType: "admin",
          action: "admin_login_2fa_required",
          severity: "info",
          targetTable: "admin_users",
          targetId: admin.id,
        })
        return NextResponse.json({
          requires2FA: true,
          userId: admin.id,
          userType: "admin",
          pendingToken: createPending2FAToken(admin.id, "admin"),
        })
      }
    }

    await getAdminClient()
      .from("admin_users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id)

    await logAuditFromRequest(request, {
      actorId: admin.id,
      actorType: "admin",
      action: "admin_login",
      severity: "info",
      targetTable: "admin_users",
      targetId: admin.id,
    })

    return NextResponse.json({
      success: true,
      admin: sanitizeAdminForClient(admin as Record<string, unknown>),
    })
  } catch (e) {
    console.error("[admin/login]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 500 },
    )
  }
}
