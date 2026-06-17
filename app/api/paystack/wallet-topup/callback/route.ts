import { type NextRequest, NextResponse } from "next/server"
import { processWalletTopupPaystackSuccess } from "@/lib/wallet-topup-credit"
import { verifyPaystackTransaction } from "@/lib/paystack-verify-transaction"

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin
  const walletUrl = `${base}/agent/wallet`

  try {
    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Missing payment reference")}`,
      )
    }

    const verified = await verifyPaystackTransaction(reference)
    if (!verified.ok) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent(verified.error)}`,
      )
    }

    const result = await processWalletTopupPaystackSuccess({
      reference: verified.data.reference,
      metadata: verified.data.metadata,
      amountKobo: verified.data.amountKobo,
    })

    if (!result.ok) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent(result.error || "Could not credit wallet")}`,
      )
    }

    const credited = result.walletCreditGhs ?? 0
    const msg = result.alreadyCredited
      ? "Payment already processed"
      : `Wallet credited with GH₵${credited.toFixed(2)}`

    return NextResponse.redirect(
      `${walletUrl}?topup=success&message=${encodeURIComponent(msg)}`,
    )
  } catch (e) {
    console.error("[wallet-topup callback]", e)
    return NextResponse.redirect(
      `${walletUrl}?topup=failed&message=${encodeURIComponent("Verification error")}`,
    )
  }
}
