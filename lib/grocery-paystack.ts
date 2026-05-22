import { getAdminClient } from "@/lib/supabase-base"

export const GROCERY_COMMITMENT_AMOUNT_GHS = 20
export const GROCERY_COMMITMENT_AMOUNT_KOBO = 2000
export const GROCERY_COMMITMENT_SERVICE = "grocery_commitment"
export const GROCERY_WHATSAPP_PHONE = "233242799990"
export const GROCERY_PAYMENT_STORAGE_KEY = "grocery_commitment_reference"

const PAYSTACK_BASE_URL = "https://api.paystack.co"

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured")
  return key
}

export function generateGroceryPaymentReference(): string {
  return `GRC-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

export function getGroceryPaystackCallbackUrl(requestUrl?: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (requestUrl ? new URL(requestUrl).origin : "http://localhost:3000")
  return `${base}/api/grocery/paystack/callback`
}

export type GroceryPaystackVerifyResult = {
  ok: boolean
  reference?: string
  amountGhs?: number
  metadata?: Record<string, unknown>
  error?: string
}

export function isGroceryCommitmentMetadata(metadata: Record<string, unknown>): boolean {
  const service = String(metadata.service ?? metadata.payment_type ?? "").toLowerCase()
  return service === GROCERY_COMMITMENT_SERVICE || service.includes("grocery_commitment")
}

export async function verifyGroceryCommitmentWithPaystack(
  reference: string,
): Promise<GroceryPaystackVerifyResult> {
  const ref = reference.trim()
  if (!ref) return { ok: false, error: "Payment reference is required" }

  let secret: string
  try {
    secret = getPaystackSecretKey()
  } catch {
    return { ok: false, error: "Payment service is not configured" }
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(ref)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await response.json()

  if (!response.ok || !payload.status) {
    return {
      ok: false,
      error: payload.message || "Payment verification failed",
    }
  }

  const data = payload.data
  if (data.status !== "success") {
    return { ok: false, error: "Payment was not completed successfully" }
  }

  if (data.amount !== GROCERY_COMMITMENT_AMOUNT_KOBO) {
    return {
      ok: false,
      error: `Invalid payment amount. Expected GHS ${GROCERY_COMMITMENT_AMOUNT_GHS}.`,
    }
  }

  const metadata = (data.metadata || {}) as Record<string, unknown>
  if (!isGroceryCommitmentMetadata(metadata)) {
    return { ok: false, error: "This payment is not a valid grocery commitment fee" }
  }

  return {
    ok: true,
    reference: data.reference || ref,
    amountGhs: data.amount / 100,
    metadata,
  }
}

export async function isGroceryReferenceAlreadyUsed(reference: string): Promise<boolean> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("grocery_requests")
    .select("id")
    .eq("paystack_reference", reference.trim())
    .maybeSingle()

  if (error) {
    console.error("[grocery-paystack] reference check:", error)
    throw new Error("Could not verify payment reference")
  }

  return Boolean(data)
}
