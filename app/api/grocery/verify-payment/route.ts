import { type NextRequest, NextResponse } from "next/server"
import {
  isGroceryReferenceAlreadyUsed,
  verifyGroceryCommitmentWithPaystack,
} from "@/lib/grocery-paystack"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")?.trim()
    if (!reference) {
      return NextResponse.json({ success: false, error: "Reference is required" }, { status: 400 })
    }

    const verified = await verifyGroceryCommitmentWithPaystack(reference)
    if (!verified.ok) {
      return NextResponse.json({ success: false, verified: false, error: verified.error }, { status: 400 })
    }

    const alreadyUsed = await isGroceryReferenceAlreadyUsed(reference)

    return NextResponse.json({
      success: true,
      verified: true,
      reference,
      amountGhs: verified.amountGhs,
      alreadyUsed,
    })
  } catch (err) {
    console.error("[api/grocery/verify-payment]", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Verification failed",
      },
      { status: 500 },
    )
  }
}
