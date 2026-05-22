import { getArkeselApiKey, getSmsConfig, validateSmsConfig } from "@/lib/sms-config"
import { getAdminClient } from "@/lib/supabase-base"

const ARKESEL_API_BASE = "https://sms.arkesel.com/sms/api"

function logArkeselKeyDiagnostics(context: string): string {
  const apiKey = getArkeselApiKey()
  console.log(`[sms-service] ${context} — ARKESEL_API_KEY length:`, apiKey.length)
  return apiKey
}

export interface SendSmsParams {
  phoneNumber: string
  message: string
  senderName?: string
  agentId?: string
  campaignName?: string
  schedule?: Date | string
  skipBalanceCheck?: boolean
}

export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
  statusCode?: number
  rawResponse?: string
}

export interface SmsLog {
  id: string
  agent_id: string
  phone_number: string
  message_content: string
  sent_at: string
  status: "success" | "failed"
  campaign_name?: string
  api_response?: string
}

export interface SmsBalanceResult {
  balance: number
  raw: Record<string, unknown>
}

export const INSUFFICIENT_SMS_BALANCE_ERROR =
  "Insufficient SMS balance. Top up your Arkesel account."

/** Ghana numbers → international 233… without leading + */
export function normalizeGhanaSmsPhone(phoneNumber: string): string {
  let normalized = phoneNumber.replace(/[\s\-()]/g, "")

  if (normalized.startsWith("+")) {
    normalized = normalized.slice(1)
  }

  if (normalized.startsWith("233233")) {
    normalized = normalized.slice(3)
  }

  if (normalized.startsWith("0")) {
    normalized = `233${normalized.slice(1)}`
  }

  if (!normalized.startsWith("233")) {
    normalized = `233${normalized}`
  }

  return normalized
}

function formatArkeselSchedule(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function parseArkeselSendSuccess(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? data.Status ?? "").toLowerCase()
  const code = data.code ?? data.status_code

  if (
    code === 401 ||
    code === 403 ||
    code === "401" ||
    code === "403" ||
    status === "error" ||
    status === "failed" ||
    status === "failure"
  ) {
    return false
  }

  if (data.error || data.Error) {
    return false
  }

  const message = String(data.message ?? data.Message ?? "").toLowerCase()
  if (
    message.includes("invalid api") ||
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("api key")
  ) {
    return false
  }

  if (status === "success" || status === "ok") {
    return true
  }

  if (data.message_id || data.messageId || data.id) {
    return true
  }

  return false
}

function extractArkeselError(data: Record<string, unknown>, responseText: string): string {
  return (
    (data.message as string) ||
    (data.Message as string) ||
    (data.error as string) ||
    (data.Error as string) ||
    (data.description as string) ||
    responseText ||
    "Arkesel request failed"
  )
}

function parseArkeselBalance(data: Record<string, unknown>): number | null {
  const nested = data.data
  const nestedObj =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : undefined

  const candidates = [
    data.balance,
    data.Balance,
    data.sms_balance,
    data.main_balance,
    data.credit,
    nestedObj?.balance,
    nestedObj?.sms_balance,
    nestedObj?.main_balance,
  ]

  for (const raw of candidates) {
    if (raw === undefined || raw === null || raw === "") continue
    const num = Number(raw)
    if (Number.isFinite(num)) return num
  }

  return null
}

/**
 * Sends an SMS via Arkesel query-parameter API.
 */
export async function sendSMS(
  phoneNumber: string,
  message: string,
  options?: {
    schedule?: Date | string
    agentId?: string
    campaignName?: string
    /** Set when bulk send already validated balance for all recipients */
    skipBalanceCheck?: boolean
  },
): Promise<SendSmsResult> {
  const logContext = {
    agentId: options?.agentId,
    campaignName: options?.campaignName,
  }

  try {
    if (!validateSmsConfig()) {
      const error = "ARKESEL_API_KEY is not set"
      if (logContext.agentId) {
        await logSmsToDatabase(
          logContext.agentId,
          phoneNumber,
          message,
          "failed",
          logContext.campaignName,
          error,
        )
      }
      return { success: false, error }
    }

    if (!phoneNumber?.trim()) {
      return { success: false, error: "Phone number is required" }
    }

    if (!message?.trim()) {
      return { success: false, error: "Message cannot be empty" }
    }

    if (!options?.skipBalanceCheck) {
      await assertSmsBalanceForSends(1)
    }

    const apiKey = logArkeselKeyDiagnostics("sendSMS")
    const config = getSmsConfig()
    const to = normalizeGhanaSmsPhone(phoneNumber)

    const params = new URLSearchParams({
      action: "send-sms",
      api_key: apiKey,
      to,
      from: config.senderId,
      sms: message,
    })

    if (options?.schedule) {
      const scheduleDate =
        options.schedule instanceof Date
          ? options.schedule
          : new Date(options.schedule)
      if (!Number.isNaN(scheduleDate.getTime())) {
        params.set("schedule", formatArkeselSchedule(scheduleDate))
      }
    }

    const url = `${ARKESEL_API_BASE}?${params.toString()}`
    const response = await fetch(url, { method: "GET", cache: "no-store" })
    const responseText = await response.text()

    let responseData: Record<string, unknown> | null = null
    try {
      responseData = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      responseData = { raw: responseText }
    }

    const apiOk =
      response.ok && (responseData ? parseArkeselSendSuccess(responseData) : responseText.length > 0)

    if (!apiOk) {
      const errorMessage = responseData
        ? extractArkeselError(responseData, responseText)
        : responseText || `HTTP ${response.status}`

      console.error("[sms-service] sendSMS Arkesel error:", {
        httpStatus: response.status,
        error: errorMessage,
      })

      if (logContext.agentId) {
        await logSmsToDatabase(
          logContext.agentId,
          to,
          message,
          "failed",
          logContext.campaignName,
          responseText,
        )
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
        rawResponse: responseText,
      }
    }

    const messageId =
      (responseData?.message_id as string) ||
      (responseData?.messageId as string) ||
      (responseData?.id as string) ||
      "sent"

    if (logContext.agentId) {
      await logSmsToDatabase(
        logContext.agentId,
        to,
        message,
        "success",
        logContext.campaignName,
        responseText,
      )
    }

    return {
      success: true,
      messageId: String(messageId),
      rawResponse: responseText,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[sms-service] sendSMS failed:", errorMessage)

    if (logContext.agentId) {
      await logSmsToDatabase(
        logContext.agentId,
        phoneNumber,
        message,
        "failed",
        logContext.campaignName,
        errorMessage,
      )
    }

    return {
      success: false,
      error: `Failed to send SMS: ${errorMessage}`,
    }
  }
}

/** Backward-compatible wrapper used by bulk send and legacy callers. */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const schedule =
    params.schedule instanceof Date
      ? params.schedule
      : params.schedule
        ? new Date(params.schedule)
        : undefined

  return sendSMS(params.phoneNumber, params.message, {
    schedule: schedule && !Number.isNaN(schedule.getTime()) ? schedule : undefined,
    agentId: params.agentId,
    campaignName: params.campaignName,
    skipBalanceCheck: params.skipBalanceCheck,
  })
}

/**
 * Check Arkesel SMS balance (response=json).
 */
export async function checkSmsBalance(): Promise<SmsBalanceResult> {
  const apiKey = logArkeselKeyDiagnostics("checkSmsBalance")

  const url = `${ARKESEL_API_BASE}?${new URLSearchParams({
    action: "check-balance",
    api_key: apiKey,
    response: "json",
  }).toString()}`

  let response: Response
  let responseText: string

  try {
    response = await fetch(url, { method: "GET", cache: "no-store" })
    responseText = await response.text()
  } catch (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError)
    console.error("[sms-service] checkSmsBalance fetch failed:", msg)
    throw new Error(`Arkesel balance request failed: ${msg}`)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(responseText) as Record<string, unknown>
  } catch {
    console.error("[sms-service] checkSmsBalance invalid JSON:", responseText.slice(0, 500))
    throw new Error(`Invalid balance response from Arkesel (HTTP ${response.status})`)
  }

  const balance = parseArkeselBalance(data)

  if (!response.ok || balance === null) {
    const errorMessage = extractArkeselError(data, responseText)
    console.error("[sms-service] checkSmsBalance Arkesel error:", {
      httpStatus: response.status,
      error: errorMessage,
      parsedBalance: balance,
    })
    throw new Error(errorMessage)
  }

  return { balance, raw: data }
}

/** Ensures Arkesel credits cover the requested send count (1 per recipient). */
export async function assertSmsBalanceForSends(recipientCount: number = 1): Promise<void> {
  const needed = Math.max(1, recipientCount)
  const { balance } = await checkSmsBalance()

  if (balance <= 0 || balance < needed) {
    throw new Error(INSUFFICIENT_SMS_BALANCE_ERROR)
  }
}

export async function logSmsToDatabase(
  agentId: string,
  phoneNumber: string,
  message: string,
  status: "success" | "failed",
  campaignName?: string,
  apiResponse?: string,
): Promise<boolean> {
  try {
    const db = typeof window === "undefined" ? getAdminClient() : null
    const payload = {
      agent_id: agentId,
      phone_number: phoneNumber,
      message_content: message,
      sent_at: new Date().toISOString(),
      status,
      campaign_name: campaignName || null,
      api_response: apiResponse || null,
    }

    if (db) {
      const { error } = await db.from("sms_logs").insert(payload)
      if (error) {
        console.error("[sms-service] Error logging SMS:", error)
        return false
      }
      return true
    }

    const { supabase } = await import("@/lib/supabase-client")
    const { error } = await supabase.from("sms_logs").insert(payload)
    if (error) {
      console.error("[sms-service] Error logging SMS:", error)
      return false
    }
    return true
  } catch (error) {
    console.error("[sms-service] Failed to log SMS:", error)
    return false
  }
}

export async function sendBulkSms(
  recipients: SendSmsParams[],
  delayMs: number = 100,
): Promise<SendSmsResult[]> {
  if (recipients.length > 0) {
    await assertSmsBalanceForSends(recipients.length)
  }

  const results: SendSmsResult[] = []

  for (let i = 0; i < recipients.length; i++) {
    const recipient = { ...recipients[i], skipBalanceCheck: true }
    const result = await sendSms(recipient)
    results.push(result)

    if (i < recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}
