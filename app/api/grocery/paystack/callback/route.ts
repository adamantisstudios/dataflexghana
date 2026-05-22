import { type NextRequest, NextResponse } from "next/server"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { verifyGroceryCommitmentWithPaystack } from "@/lib/grocery-paystack"

export const dynamic = "force-dynamic"

function appOrigin(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin
  )
}

export async function GET(request: NextRequest) {
  const origin = appOrigin(request)
  const fail = (message: string) =>
    NextResponse.redirect(
      `${origin}/foodandGroceries?payment=failed&message=${encodeURIComponent(message)}`,
    )

  try {
    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return fail("No payment reference provided")
    }

    const verified = await verifyGroceryCommitmentWithPaystack(reference)
    if (!verified.ok) {
      return fail(verified.error || "Payment verification failed")
    }

    await logAuditFromRequest(request, {
      actorType: "public",
      action: "grocery_commitment_paid",
      targetTable: "grocery_requests",
      targetId: reference,
      newData: {
        reference,
        amount: verified.amountGhs,
        metadata: verified.metadata,
      },
    })

    const successUrl = new URL("/foodandGroceries", origin)
    successUrl.searchParams.set("payment", "success")
    successUrl.searchParams.set("reference", reference)

    return NextResponse.redirect(successUrl.toString(), 302)
  } catch (err) {
    console.error("[api/grocery/paystack/callback]", err)
    return fail("An error occurred while verifying your payment")
  }
}
