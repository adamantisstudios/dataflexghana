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
  /** Remaining SMS credits returned by Arkesel after a successful send */
  balance?: number
}

/** Arkesel SMS API V1 error codes (100–111) */
export const ARKESEL_ERROR_MESSAGES: Record<string, string> = {
  "100": "Bad gateway request",
  "101": "Wrong action",
  "102": "Authentication failed",
  "103": "Invalid phone number",
  "104": "Phone coverage not active",
  "105": "Insufficient balance",
  "106": "Invalid Sender ID",
  "107": "Invalid message",
  "108": "Invalid message type",
  "109": "Invalid Schedule Time",
  "110": "Invalid gateway",
  "111": "SMS contains spam word. Wait for approval",
}

export interface ParsedArkeselResponse {
  success: boolean
  error?: string
  balance?: number
  messageId?: string
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

function normalizeArkeselCode(code: unknown): string {
  return String(code ?? "")
    .trim()
    .toLowerCase()
}

function isArkeselErrorCode(code: string): boolean {
  const numeric = code.replace(/\D/g, "")
  if (!numeric) return false
  const n = Number(numeric)
  return n >= 100 && n <= 111
}

function resolveArkeselErrorMessage(data: Record<string, unknown>, responseText: string): string {
  const rawCode = String(data.code ?? data.Code ?? "").trim()
  const normalized = normalizeArkeselCode(rawCode)

  if (isArkeselErrorCode(normalized) || (rawCode && ARKESEL_ERROR_MESSAGES[rawCode])) {
    const docMessage = ARKESEL_ERROR_MESSAGES[rawCode] || ARKESEL_ERROR_MESSAGES[normalized]
    const apiMessage = String(data.message ?? data.Message ?? "").trim()
    if (docMessage && apiMessage) {
      return `${docMessage}: ${apiMessage}`
    }
    return docMessage || apiMessage || `Arkesel error (code ${rawCode})`
  }

  return (
    String(data.message ?? data.Message ?? "").trim() ||
    String(data.error ?? data.Error ?? "").trim() ||
    String(data.description ?? "").trim() ||
    responseText ||
    "Arkesel request failed"
  )
}

/** Parse Arkesel JSON after logging raw body; success when `code` is `ok` (case-insensitive). */
export function parseArkeselSendResponse(
  data: Record<string, unknown>,
  responseText: string,
  context: string,
): ParsedArkeselResponse {
  const code = normalizeArkeselCode(data.code ?? data.Code)

  if (code === "ok") {
    const balance = parseArkeselBalance(data) ?? undefined
    const messageId =
      (data.message_id as string) ||
      (data.messageId as string) ||
      (data.id as string) ||
      undefined

    return { success: true, balance, messageId }
  }

  if (isArkeselErrorCode(code) || (String(data.code ?? data.Code ?? "").trim() && ARKESEL_ERROR_MESSAGES[String(data.code ?? data.Code).trim()])) {
    return {
      success: false,
      error: resolveArkeselErrorMessage(data, responseText),
    }
  }

  const status = String(data.status ?? data.Status ?? "").toLowerCase()
  if (status === "success" || status === "ok") {
    return {
      success: true,
      balance: parseArkeselBalance(data) ?? undefined,
      messageId: (data.message_id as string) || (data.messageId as string) || undefined,
    }
  }

  console.error(`[sms-service] ${context} unrecognized Arkesel response:`, {
    code: data.code ?? data.Code,
    status: data.status ?? data.Status,
  })

  return {
    success: false,
    error: resolveArkeselErrorMessage(data, responseText),
  }
}

function extractArkeselError(data: Record<string, unknown>, responseText: string): string {
  return resolveArkeselErrorMessage(data, responseText)
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

    console.log("[sms-service] sendSMS Arkesel raw response:", responseText.slice(0, 2000))

    let responseData: Record<string, unknown>
    try {
      responseData = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      console.error("[sms-service] sendSMS invalid JSON:", responseText.slice(0, 500))
      const parseError = responseText || `HTTP ${response.status}`
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
        error: parseError,
        statusCode: response.status,
        rawResponse: responseText,
      }
    }

    const parsed = parseArkeselSendResponse(responseData, responseText, "sendSMS")

    if (!response.ok || !parsed.success) {
      const errorMessage = parsed.error || `HTTP ${response.status}`

      console.error("[sms-service] sendSMS Arkesel error:", {
        httpStatus: response.status,
        code: responseData.code ?? responseData.Code,
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

    const messageId = parsed.messageId || "sent"

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
      balance: parsed.balance,
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
    console.log("[sms-service] checkSmsBalance Arkesel raw response:", responseText.slice(0, 2000))
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

  const code = normalizeArkeselCode(data.code ?? data.Code)
  const balance = parseArkeselBalance(data)

  if (code && code !== "ok" && isArkeselErrorCode(code)) {
    throw new Error(resolveArkeselErrorMessage(data, responseText))
  }

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
