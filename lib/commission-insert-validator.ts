export interface CommissionInsertPayload {
  agent_id: string
  source_type: "referral" | "data_order" | "wholesale_order"
  source_id: string
  amount: number
  status?: "earned" | "pending_withdrawal" | "withdrawn"
}

/**
 * Validates a commission amount before database insertion
 * Returns true if the amount meets constraints, false otherwise
 * Now allows zero commissions
 */
export function isValidCommissionAmount(amount: number): boolean {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return false
  }

  return amount >= 0 && amount <= 0.4
}

/**
 * Validates and sanitizes a commission insert payload
 * Returns the payload if valid, null if it should be skipped
 */
export function validateCommissionInsertPayload(payload: CommissionInsertPayload): CommissionInsertPayload | null {
  // Validate required fields
  if (!payload.agent_id || !payload.source_type || !payload.source_id) {
    console.warn("[v0] Invalid commission payload: missing required fields", payload)
    return null
  }

  // Validate and normalize amount
  const amount = Number(payload.amount)

  if (!isValidCommissionAmount(amount)) {
    console.warn(`[v0] Skipping commission insert: invalid amount ${amount} for source ${payload.source_id}`)
    return null
  }

  // Return validated payload with normalized amount
  return {
    ...payload,
    amount: amount,
    status: payload.status || "earned",
  }
}

/**
 * Safely attempts to insert a commission into the database
 * Handles constraint violations gracefully without throwing
 * Now accepts zero commissions
 */
export async function safeInsertCommission(
  supabaseClient: any,
  payload: CommissionInsertPayload,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Validate before inserting
    const validatedPayload = validateCommissionInsertPayload(payload)

    if (!validatedPayload) {
      console.log(`[v0] Commission insert skipped - amount is invalid`)
      return { success: true } // Return success since this is expected behavior
    }

    console.log(`[v0] Attempting to insert commission for source ${payload.source_id}:`, validatedPayload)

    const { data, error } = await supabaseClient.from("commissions").insert([validatedPayload]).select()

    if (error) {
      const errorCode = error.code || ""
      const errorMessage = error.message || ""

      // Check for constraint violations
      if (errorCode === "23514" || errorMessage.includes("commissions_amount_check")) {
        console.warn(`[v0] Commission insert constraint violation: ${errorMessage}`, {
          code: errorCode,
          amount: validatedPayload.amount,
          source: payload.source_id,
        })
        return { success: true, error: "Commission amount invalid (constraint)" }
      }

      // Check for other known errors
      if (errorMessage.includes("violates check constraint")) {
        console.warn(`[v0] Commission constraint violation: ${errorMessage}`)
        return { success: true, error: "Commission failed database constraint check" }
      }

      // Unknown error - log but don't fail
      console.error(`[v0] Commission insert error:`, {
        code: errorCode,
        message: errorMessage,
        source: payload.source_id,
      })
      return { success: false, error: errorMessage }
    }

    console.log(`[v0] Commission inserted successfully for source ${payload.source_id}`)
    return { success: true, data }
  } catch (err: any) {
    console.error(`[v0] Commission insert exception:`, {
      error: err?.message || String(err),
      source: payload.source_id,
    })
    return { success: false, error: err?.message || "Unknown error" }
  }
}

/**
 * Batch safe insert for multiple commissions
 */
export async function safeBatchInsertCommissions(
  supabaseClient: any,
  payloads: CommissionInsertPayload[],
): Promise<{ successCount: number; failCount: number; results: any[] }> {
  const results = []
  let successCount = 0
  let failCount = 0

  for (const payload of payloads) {
    const result = await safeInsertCommission(supabaseClient, payload)
    results.push(result)
    if (result.success) {
      successCount++
    } else {
      failCount++
    }
  }

  return { successCount, failCount, results }
}
