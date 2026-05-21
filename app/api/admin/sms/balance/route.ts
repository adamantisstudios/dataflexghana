import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { checkSmsBalance } from "@/lib/sms-service"

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { balance, raw } = await checkSmsBalance()
    return NextResponse.json({ success: true, balance, raw })
  } catch (error) {
    console.error("[api/admin/sms/balance]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check SMS balance",
      },
      { status: 500 },
    )
  }
}
