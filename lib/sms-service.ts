import { getSmsConfig, validateSmsConfig } from "@/lib/sms-config"
import { getAdminClient } from "@/lib/supabase-base"

const ARKESEL_API_BASE = "https://sms.arkesel.com/sms/api"

export interface SendSmsParams {
  phoneNumber: string
  message: string
  senderName?: string
  agentId?: string
  campaignName?: string
  schedule?: Date | string
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
  const status = data.status ?? data.Status ?? data.code
  if (status === "success" || status === "ok" || status === 200 || status === "200") {
    return true
  }
  if (status === "error" || status === "failed" || status === false) {
    return false
  }
  if (data.error || data.Error) {
    return false
  }
  return true
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
  },
): Promise<SendSmsResult> {
  const logContext = {
    agentId: options?.agentId,
    campaignName: options?.campaignName,
  }

  try {
    if (!validateSmsConfig()) {
      const error = "Arkesel SMS API key is not configured"
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

    const config = getSmsConfig()
    const to = normalizeGhanaSmsPhone(phoneNumber)

    const params = new URLSearchParams({
      action: "send-sms",
      api_key: config.apiKey,
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
      const errorMessage =
        (responseData?.message as string) ||
        (responseData?.error as string) ||
        (responseData?.description as string) ||
        responseText ||
        `HTTP ${response.status}`

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
  })
}

/**
 * Check Arkesel SMS balance (response=json).
 */
export async function checkSmsBalance(): Promise<SmsBalanceResult> {
  if (!validateSmsConfig()) {
    throw new Error("Arkesel SMS API key is not configured")
  }

  const config = getSmsConfig()
  const url = `${ARKESEL_API_BASE}?${new URLSearchParams({
    action: "check-balance",
    api_key: config.apiKey,
    response: "json",
  }).toString()}`

  const response = await fetch(url, { method: "GET", cache: "no-store" })
  const responseText = await response.text()

  let data: Record<string, unknown>
  try {
    data = JSON.parse(responseText) as Record<string, unknown>
  } catch {
    throw new Error(`Invalid balance response: ${responseText}`)
  }

  if (!response.ok) {
    throw new Error(
      (data.message as string) ||
        (data.error as string) ||
        `Balance check failed: HTTP ${response.status}`,
    )
  }

  const nested = data.data as Record<string, unknown> | undefined
  const balanceRaw =
    data.balance ??
    data.Balance ??
    data.sms_balance ??
    nested?.balance ??
    nested?.sms_balance

  const balance = Number(balanceRaw)
  if (!Number.isFinite(balance)) {
    throw new Error(
      (data.message as string) ||
        (data.error as string) ||
        "Balance not found in Arkesel response",
    )
  }

  return { balance, raw: data }
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
  const results: SendSmsResult[] = []

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    const result = await sendSms(recipient)
    results.push(result)

    if (i < recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}
