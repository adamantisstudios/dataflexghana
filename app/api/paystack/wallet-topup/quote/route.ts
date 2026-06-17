import { type NextRequest, NextResponse } from "next/server"
import { calculateWalletTopupPaystackFees } from "@/lib/paystack-wallet-fees"
import { WALLET_TOPUP_PAYSTACK_MIN_GHS } from "@/lib/paystack-wallet-topup"

export const dynamic = "force-dynamic"

/** Public fee quote for wallet Paystack top-up checkout breakdown. */
export async function GET(request: NextRequest) {
  try {
    const amount = Number(request.nextUrl.searchParams.get("amount"))

    if (!Number.isFinite(amount) || amount < WALLET_TOPUP_PAYSTACK_MIN_GHS) {
      return NextResponse.json(
        { error: `Minimum Paystack top-up is GH₵${WALLET_TOPUP_PAYSTACK_MIN_GHS}` },
        { status: 400 },
      )
    }

    const fees = calculateWalletTopupPaystackFees(amount)
    return NextResponse.json({ success: true, fees })
  } catch (e) {
    console.error("[wallet-topup quote]", e)
    return NextResponse.json({ error: "Failed to calculate fees" }, { status: 500 })
  }
}
