import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { sendBulkSms, sendSMS, sendSms, type SendSmsParams } from "@/lib/sms-service"

function parseScheduleInput(value: unknown): Date | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json()
    const delayMs = typeof body.delayMs === "number" ? body.delayMs : 150
    const schedule = parseScheduleInput(body.schedule)

    if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      const recipients = (body.recipients as SendSmsParams[]).map((r) => ({
        ...r,
        schedule: r.schedule ? parseScheduleInput(r.schedule) : schedule,
      }))
      const results = await sendBulkSms(recipients, delayMs)
      const successCount = results.filter((r) => r.success).length

      return NextResponse.json({
        success: successCount > 0,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: results.length - successCount,
        },
      })
    }

    const { phoneNumber, message, agentId, campaignName } = body as SendSmsParams

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: "phoneNumber and message are required" },
        { status: 400 },
      )
    }

    const result = schedule
      ? await sendSMS(phoneNumber, message, { schedule, agentId, campaignName })
      : await sendSms({ phoneNumber, message, agentId, campaignName })

    return NextResponse.json({
      success: result.success,
      result,
      error: result.error,
    })
  } catch (error) {
    console.error("[api/admin/sms/send]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send SMS",
      },
      { status: 500 },
    )
  }
}
