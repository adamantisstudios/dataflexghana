/**
 * Parse MTN MoMo "Payment received" SMS used on the admin payment SIM.
 *
 * Sample:
 * Payment received for GHS 47.50 from PHILIP AKUTSE AGBAVITOR
 * Current Balance: GHS 131.47 . Available Balance: GHS 131.47.
 * Reference: 71788. Transaction ID: 84157189921. TRANSACTION FEE: 0.00
 */

export type ParsedMomoSms = {
  amount: number | null
  reference: string | null
  transactionId: string | null
  payerName: string | null
  currentBalance: number | null
  availableBalance: number | null
  fee: number | null
  raw: string
}

function parseMoney(value: string | undefined | null): number | null {
  if (!value) return null
  const cleaned = value.replace(/,/g, "").trim()
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

export function parseMomoPaymentSms(rawSms: string): ParsedMomoSms {
  const raw = String(rawSms ?? "").trim()
  const normalized = raw.replace(/\s+/g, " ")

  const amountMatch =
    normalized.match(/Payment received for\s+GHS\s*([\d,.]+)/i) ||
    normalized.match(/received for\s+GHS\s*([\d,.]+)/i)

  const payerMatch = normalized.match(
    /from\s+(.+?)\s+(?:Current Balance|Available Balance|Reference:|Transaction ID:)/i,
  )

  const refMatch = normalized.match(/Reference:\s*([A-Za-z0-9]+)/i)
  const txnMatch = normalized.match(/Transaction ID:\s*([A-Za-z0-9]+)/i)
  const currentBalMatch = normalized.match(/Current Balance:\s*GHS\s*([\d,.]+)/i)
  const availBalMatch = normalized.match(/Available Balance:\s*GHS\s*([\d,.]+)/i)
  const feeMatch = normalized.match(/TRANSACTION FEE:\s*([\d,.]+)/i)

  let reference = refMatch?.[1]?.trim() || null
  // Prefer 5-digit platform codes when present in the reference field
  if (reference && /^\d{5}$/.test(reference) === false) {
    const five = reference.match(/\d{5}/)
    if (five) reference = five[0]
  }

  return {
    amount: parseMoney(amountMatch?.[1]),
    reference,
    transactionId: txnMatch?.[1]?.trim() || null,
    payerName: payerMatch?.[1]?.trim().replace(/\s+/g, " ") || null,
    currentBalance: parseMoney(currentBalMatch?.[1]),
    availableBalance: parseMoney(availBalMatch?.[1]),
    fee: parseMoney(feeMatch?.[1]),
    raw,
  }
}

export function normalizeReferenceCode(ref: string | null | undefined): string | null {
  if (!ref) return null
  const trimmed = String(ref).trim()
  if (!trimmed) return null
  if (/^\d{5}$/.test(trimmed)) return trimmed
  const five = trimmed.match(/\b(\d{5})\b/)
  return five?.[1] ?? trimmed
}

export function amountsEqual(a: number, b: number, tolerance = 0.02): boolean {
  return Math.abs(a - b) <= tolerance
}
