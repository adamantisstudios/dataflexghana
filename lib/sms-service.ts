import { getSmsConfig, validateSmsConfig } from "@/lib/sms-config"
import { supabase } from "@/lib/supabase"

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
 * Sends an SMS via USMS-GH API
 * @param params SMS parameters (phoneNumber, message, optional senderName)
 * @returns SendSmsResult with success status and message ID or error
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  try {
    if (!validateSmsConfig()) {
      console.error("[v0] SMS API token not configured")
      return {
        success: false,
        error: "SMS API token is not configured",
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
    console.log("[v0] SMS Config loaded")

    // Normalize phone number - USMS-GH expects format like 2335XXXXXXXXX
    let normalizedPhone = params.phoneNumber.replace(/[\s\-\(\)]/g, "")
    
    // Remove leading + if present
    if (normalizedPhone.startsWith("+")) {
      normalizedPhone = normalizedPhone.substring(1)
    }
    
    // Prevent double country codes (233233...)
    if (normalizedPhone.startsWith("233233")) {
      normalizedPhone = normalizedPhone.substring(3)
    }
    
    console.log("[v0] Normalized phone number")

    // USMS-GH API endpoint: https://webapp.usmsgh.com/api/sms/send
    const apiUrl = "https://webapp.usmsgh.com/api/sms/send"

    // Request body per USMS-GH API documentation
    const requestBody = {
      recipient: normalizedPhone, // Phone number to send to
      sender_id: params.senderName || config.sender, // Sender name (max 11 chars)
      type: "plain", // SMS type must be "plain"
      message: params.message, // Message content
    }

    console.log("[v0] Sending SMS - Phone:", normalizedPhone, "Length:", params.message.length)

    const response = await fetch(apiUrl, {
      method: "POST", // USMS-GH requires POST
      headers: {
        "Authorization": `Bearer ${config.token}`, // Bearer token format
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] SMS API response status:", response.status)

    let responseData: any = null
    const responseText = await response.text()

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.error("[v0] Failed to parse response as JSON:", responseText)
    }

    console.log("[v0] SMS API response:", { status: responseData?.status, hasData: !!responseData?.data })

    // Check for HTTP errors
    if (!response.ok) {
      console.error("[v0] SMS API HTTP error:", response.status, responseData?.message)
      return {
        success: false,
        error: responseData?.message || `HTTP ${response.status}`,
        statusCode: response.status,
      }
    }

    // Check USMS-GH response format: {"status": "success", "data": "..."}
    if (responseData?.status === "error") {
      console.error("[v0] SMS API error:", responseData?.message)
      return {
        success: false,
        error: responseData?.message || "SMS provider returned error",
      }
    }

    if (responseData?.status !== "success") {
      console.error("[v0] Unexpected response status:", responseData?.status)
      return {
        success: false,
        error: "Unexpected response format from SMS provider",
      }
    }

    console.log("[v0] SMS sent successfully")
    return {
      success: true,
      messageId: responseData?.data?.uid || responseData?.data?.[0]?.uid || "sent",
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

    // Log the SMS to database for tracking
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

    // Add delay between sends to avoid rate limiting (except on last item)
    if (i < recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}
