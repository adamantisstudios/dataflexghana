import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import {
  checkSmsBalance,
  sendBulkSms,
  sendSMS,
  sendSms,
  type SendSmsParams,
  type SendSmsResult,
} from "@/lib/sms-service"

function parseScheduleInput(value: unknown): Date | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function resolveBalanceFromResults(results: SendSmsResult[]): number | undefined {
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].success && results[i].balance != null) {
      return results[i].balance
    }
  }
  return undefined
}

async function resolveResponseBalance(results: SendSmsResult[]): Promise<number | undefined> {
  const fromSend = resolveBalanceFromResults(results)
  if (fromSend != null) return fromSend
  try {
    const { balance } = await checkSmsBalance()
    return balance
  } catch {
    return undefined
  }
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
      const failedCount = results.length - successCount
      const allSucceeded = failedCount === 0 && successCount > 0
      const balance = await resolveResponseBalance(results)
      const firstError = results.find((r) => !r.success)?.error

      return NextResponse.json({
        success: allSucceeded,
        balance,
        results,
        error: allSucceeded
          ? undefined
          : firstError || "One or more messages failed to send",
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount,
        },
      })
    }

    const { phoneNumber, message, agentId, campaignName } = body as SendSmsParams

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: "phoneNumber and message are required", balance: undefined },
        { status: 400 },
      )
    }

    const result = schedule
      ? await sendSMS(phoneNumber, message, { schedule, agentId, campaignName })
      : await sendSms({ phoneNumber, message, agentId, campaignName })

    const balance =
      result.balance ??
      (result.success ? (await resolveResponseBalance([result])) : undefined)

    return NextResponse.json({
      success: result.success,
      balance,
      result,
      error: result.success ? undefined : result.error,
    })
  } catch (error) {
    console.error("[api/admin/sms/send]", error)
    const message = error instanceof Error ? error.message : "Failed to send SMS"
    return NextResponse.json(
      {
        success: false,
        error: message,
        balance: undefined,
      },
      { status: 500 },
    )
  }
}
