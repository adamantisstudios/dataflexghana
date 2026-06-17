/** Paystack local (Ghana) transaction fee — ~1.95% per Paystack pricing. */
export const PAYSTACK_LOCAL_FEE_RATE = 0.0195

export interface WalletTopupPaystackFeeBreakdown {
  /** Amount credited to the agent wallet after successful payment. */
  wallet_credit_ghs: number
  /** Paystack processing fee passed to the customer. */
  paystack_fee_ghs: number
  /** Total amount charged via Paystack (wallet credit + fee). */
  total_payable_ghs: number
}

function roundGhs(value: number): number {
  return Math.round(value * 100) / 100
}

/** Compute Paystack checkout total so the agent receives the requested wallet credit. */
export function calculateWalletTopupPaystackFees(
  walletCreditGhs: number,
): WalletTopupPaystackFeeBreakdown {
  const wallet_credit_ghs = roundGhs(walletCreditGhs)
  const paystack_fee_ghs = roundGhs(wallet_credit_ghs * PAYSTACK_LOCAL_FEE_RATE)
  const total_payable_ghs = roundGhs(wallet_credit_ghs + paystack_fee_ghs)
  return { wallet_credit_ghs, paystack_fee_ghs, total_payable_ghs }
}
