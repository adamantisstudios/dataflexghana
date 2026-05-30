import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { data } = await getAdminClient()
    .from("admin_users")
    .select("two_factor_enabled, two_factor_secret, two_factor_backup_codes")
    .eq("id", String(session.admin.id))
    .single()

  const backupRemaining = Array.isArray(data?.two_factor_backup_codes)
    ? data.two_factor_backup_codes.length
    : 0

  return NextResponse.json({
    enabled: Boolean(data?.two_factor_enabled),
    pendingSetup: Boolean(data?.two_factor_secret && !data?.two_factor_enabled),
    backupCodesRemaining: backupRemaining,
  })
}
