import { getAdminClient } from "@/lib/supabase-base"

export function generate5DigitCode(): string {
  let code = ""
  for (let i = 0; i < 5; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

/**
 * Generate a 5-digit code that is not currently used on open pending payment rows.
 * Falls back to a random code after maxAttempts (non-blocking for UX).
 */
export async function generateUniquePaymentReferenceCode(options?: {
  maxAttempts?: number
}): Promise<string> {
  const maxAttempts = options?.maxAttempts ?? 12
  const db = getAdminClient()

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generate5DigitCode()
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const checks = await Promise.all([
      db
        .from("data_orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_reference", code)
        .eq("status", "pending")
        .gte("created_at", since),
      db
        .from("wholesale_orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_reference", code)
        .eq("status", "pending")
        .gte("created_at", since),
      db
        .from("registration_payment_intents")
        .select("id", { count: "exact", head: true })
        .eq("reference_code", code)
        .eq("status", "pending"),
      db
        .from("data_orders_log")
        .select("id", { count: "exact", head: true })
        .eq("reference_code", code)
        .gte("created_at", since),
    ])

    const taken = checks.some((r) => (r.count ?? 0) > 0)
    if (!taken) return code
  }

  return generate5DigitCode()
}

export function generatePaymentReferenceCode(): string {
  return generate5DigitCode()
}

export function generateShortPaymentReference(): string {
  return generate5DigitCode()
}

// Keep old function name for backward compatibility but point to new one
export function generate4CharCode(): string {
  return generate5DigitCode()
}

// Export as default for quick imports
export default generate5DigitCode
