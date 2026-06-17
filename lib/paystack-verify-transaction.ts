const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

export interface VerifiedPaystackTransaction {
  reference: string
  status: string
  amountKobo: number
  metadata: Record<string, unknown>
}

/** Server-side Paystack verify — required before any wallet credit. */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<{ ok: true; data: VerifiedPaystackTransaction } | { ok: false; error: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    return { ok: false, error: "Paystack not configured" }
  }

  const ref = reference.trim()
  if (!ref) {
    return { ok: false, error: "Missing payment reference" }
  }

  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        cache: "no-store",
      },
    )
    const body = await verifyRes.json()
    const tx = body?.data

    if (!verifyRes.ok || body?.status !== true) {
      return { ok: false, error: body?.message || "Paystack verification failed" }
    }

    if (String(tx?.status || "") !== "success") {
      return { ok: false, error: `Payment status is ${tx?.status || "unknown"}, not success` }
    }

    const amountKobo = Number(tx?.amount)
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      return { ok: false, error: "Invalid paid amount from Paystack" }
    }

    return {
      ok: true,
      data: {
        reference: ref,
        status: "success",
        amountKobo,
        metadata: (tx?.metadata || {}) as Record<string, unknown>,
      },
    }
  } catch (e) {
    console.error("[paystack-verify]", e)
    return { ok: false, error: "Paystack verification request failed" }
  }
}
