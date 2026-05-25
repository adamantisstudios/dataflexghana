export const WALLET_TOPUP_PAYSTACK_MIN_GHS = 300
export const WALLET_TOPUP_PAYMENT_TYPE = "agent_wallet_topup"

export function walletTopupPaystackReference(reference: string): string {
  return `PAYSTACK-WTU-${reference}`
}

export function isWalletTopupPaystackMetadata(meta: Record<string, unknown>): boolean {
  return (
    meta.payment_type === WALLET_TOPUP_PAYMENT_TYPE ||
    meta.transaction_type === WALLET_TOPUP_PAYMENT_TYPE
  )
}

export function getWalletTopupCallbackUrl(request?: { url?: string }): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof request?.url === "string" ? new URL(request.url).origin : "") ||
    "http://localhost:3000"
  return `${base.replace(/\/$/, "")}/api/paystack/wallet-topup/callback`
}
