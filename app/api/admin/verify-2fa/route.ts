import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import {
  appendTrustDeviceCookie,
  sanitizeAdminForClient,
  verifyPending2FAToken,
  verifyTwoFactorCode,
} from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code ?? "").trim()
    const pendingToken = String(body.pendingToken ?? body.pending_token ?? "").trim()
    const rememberDevice = body.rememberDevice !== false

    if (!code || !pendingToken) {
      return NextResponse.json({ error: "Code and pending token are required" }, { status: 400 })
    }

    const pending = verifyPending2FAToken(pendingToken)
    if (!pending || pending.userType !== "admin") {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 })
    }

    const verify = await verifyTwoFactorCode(pending.userId, "admin", code)
    if (!verify.ok) {
      return NextResponse.json({ error: verify.error }, { status: 401 })
    }

    const { data: admin, error } = await getAdminClient()
      .from("admin_users")
      .select("*")
      .eq("id", pending.userId)
      .eq("is_active", true)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
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
      newData: { via_2fa: true, backup_code_used: verify.usedBackup },
    })

    const response = NextResponse.json({
      success: true,
      admin: sanitizeAdminForClient(admin as Record<string, unknown>),
      usedBackupCode: verify.usedBackup,
    })

    if (rememberDevice) {
      appendTrustDeviceCookie(response, admin.id, "admin")
    }

    return response
  } catch (e) {
    console.error("[admin/verify-2fa]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 },
    )
  }
}
