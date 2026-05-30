import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { checkSmsBalance } from "@/lib/sms-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) {
    return adminSession.response
  }

  try {
    const keyLength = process.env.ARKESEL_API_KEY?.trim().length ?? 0

    if (!process.env.ARKESEL_API_KEY?.trim()) {
      console.error("[api/admin/sms/balance] ARKESEL_API_KEY is not set")
      return NextResponse.json(
        {
          success: false,
          error: "ARKESEL_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.",
        },
        { status: 500 },
      )
    }

    const { balance, raw } = await checkSmsBalance()

    return NextResponse.json({
      success: true,
      balance,
      raw,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check SMS balance"

    console.error("[api/admin/sms/balance] error:", message, error)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
