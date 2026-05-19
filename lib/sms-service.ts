import { getSmsConfig, getHubtelBasicAuthHeader, validateSmsConfig } from "@/lib/sms-config"
import { supabase } from "@/lib/supabase-client";

export interface SendSmsParams {
  phoneNumber: string
  message: string
  senderName?: string
  agentId?: string
  campaignName?: string
}

export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
  statusCode?: number
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

/**
 * Sends an SMS via Hubtel API
 * @param params SMS parameters (phoneNumber, message, optional agentId for logging)
 * @returns SendSmsResult with success status and message ID or error
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  try {
    if (!validateSmsConfig()) {
      console.error("[v0] Hubtel SMS credentials not configured")
      return {
        success: false,
        error: "Hubtel SMS credentials are not configured",
      }
    }

    if (!params.phoneNumber) {
      console.error("[v0] Phone number is required")
      return {
        success: false,
        error: "Phone number is required",
      }
    }

    if (!params.message || params.message.trim().length === 0) {
      console.error("[v0] Message cannot be empty")
      return {
        success: false,
        error: "Message cannot be empty",
      }
    }

    if (params.message.length > 160) {
      console.error("[v0] Message exceeds 160 character limit")
      return {
        success: false,
        error: "Message exceeds 160 character limit",
      }
    }

    const config = getSmsConfig()
    console.log("[v0] Hubtel SMS config loaded")

    let normalizedPhone = params.phoneNumber.replace(/[\s\-\(\)]/g, "")

    if (normalizedPhone.startsWith("+")) {
      normalizedPhone = normalizedPhone.substring(1)
    }

    if (normalizedPhone.startsWith("233233")) {
      normalizedPhone = normalizedPhone.substring(3)
    }

    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = `233${normalizedPhone.substring(1)}`
    }

    if (!normalizedPhone.startsWith("233")) {
      normalizedPhone = `233${normalizedPhone}`
    }

    console.log("[v0] Normalized phone number for Hubtel")

    const requestBody = {
      from: config.senderId,
      to: normalizedPhone,
      content: params.message,
    }

    console.log("[v0] Sending SMS via Hubtel - Length:", params.message.length)

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: getHubtelBasicAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Hubtel SMS API response status:", response.status)

    let responseData: Record<string, unknown> | null = null
    const responseText = await response.text()

    try {
      responseData = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      console.error("[v0] Failed to parse Hubtel response as JSON:", responseText)
    }

    console.log("[v0] Hubtel SMS API response:", {
      status: responseData?.Status ?? responseData?.status,
      messageId: responseData?.MessageId ?? responseData?.messageId,
    })

    if (!response.ok) {
      const errorMessage =
        (responseData?.message as string) ||
        (responseData?.Message as string) ||
        (responseData?.statusDescription as string) ||
        `HTTP ${response.status}`
      console.error("[v0] Hubtel SMS API HTTP error:", response.status, errorMessage)
      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      }
    }

    const hubtelStatus = responseData?.Status ?? responseData?.status
    if (hubtelStatus !== undefined && hubtelStatus !== 0 && hubtelStatus !== "0") {
      const errorMessage =
        (responseData?.statusDescription as string) ||
        (responseData?.Message as string) ||
        "Hubtel returned a non-success status"
      console.error("[v0] Hubtel SMS API error status:", hubtelStatus, errorMessage)
      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      }
    }

    const messageId =
      (responseData?.MessageId as string) ||
      (responseData?.messageId as string) ||
      "sent"

    console.log("[v0] SMS sent successfully via Hubtel")
    return {
      success: true,
      messageId: String(messageId),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error sending SMS:", error)
    return {
      success: false,
      error: `Failed to send SMS: ${errorMessage}`,
    }
  }
}

/** Alias for sendSms (Hubtel integration) */
export const sendSMS = sendSms

/**
 * Logs SMS sent to the database for tracking and history
 * @param agentId Agent ID who received the SMS
 * @param phoneNumber Phone number SMS was sent to
 * @param message Message content (up to 160 chars)
 * @param status Status of SMS send (success or failed)
 * @param campaignName Optional campaign name for grouping
 * @param apiResponse Optional full API response for debugging
 */
export async function logSmsToDatabase(
  agentId: string,
  phoneNumber: string,
  message: string,
  status: "success" | "failed",
  campaignName?: string,
  apiResponse?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("sms_logs").insert({
      agent_id: agentId,
      phone_number: phoneNumber,
      message_content: message,
      sent_at: new Date().toISOString(),
      status,
      campaign_name: campaignName || null,
      api_response: apiResponse || null,
    })

    if (error) {
      console.error("[v0] Error logging SMS to database:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Failed to log SMS:", error)
    return false
  }
}

/**
 * Sends SMS to multiple recipients with error handling and logging
 * @param recipients Array of {phoneNumber, message, agentId, campaignName}
 * @param delayMs Optional delay between sends (to avoid rate limiting)
 * @returns Array of results for each send attempt
 */
export async function sendBulkSms(
  recipients: SendSmsParams[],
  delayMs: number = 100
): Promise<SendSmsResult[]> {
  const results: SendSmsResult[] = []

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    const result = await sendSms(recipient)
    results.push(result)

    if (recipient.agentId) {
      await logSmsToDatabase(
        recipient.agentId,
        recipient.phoneNumber,
        recipient.message,
        result.success ? "success" : "failed",
        recipient.campaignName,
        JSON.stringify(result)
      )
    }

    if (i < recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}
