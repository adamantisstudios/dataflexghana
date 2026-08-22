import { type NextRequest, NextResponse } from "next/server"
import { authenticateOpsDevice } from "@/lib/ops/auth"
import { confirmMomoPayment } from "@/lib/ops/match-momo-payment"
import { parseMomoPaymentSms } from "@/lib/ops/parse-momo-sms"

export const dynamic = "force-dynamic"

/**
 * POST /api/ops/momo/confirm
 * Called by the Android ops app after parsing a MoMo payment SMS.
 * Auth: Bearer ops_<key>
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateOpsDevice(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const rawSms = typeof body.raw_sms === "string" ? body.raw_sms : body.rawSms
    const parsed = typeof rawSms === "string" && rawSms.trim() ? parseMomoPaymentSms(rawSms) : null

    const amount = Number(body.amount ?? parsed?.amount)
    const reference = (body.reference ?? body.reference_code ?? parsed?.reference ?? null) as
      | string
      | null
    const transactionId = String(
      body.transaction_id ?? body.transactionId ?? parsed?.transactionId ?? "",
    ).trim()
    const payerName = (body.payer_name ?? body.payerName ?? parsed?.payerName ?? null) as
      | string
      | null
    const receivedAt = (body.received_at ?? body.receivedAt ?? null) as string | null

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "transaction_id is required (or provide raw_sms)" },
        { status: 400 },
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid amount is required (or provide raw_sms)" },
        { status: 400 },
      )
    }

    const result = await confirmMomoPayment({
      amount,
      reference,
      transactionId,
      payerName,
      rawSms: rawSms ?? null,
      receivedAt,
      deviceId: auth.device.id,
    })

    return NextResponse.json({
      success: result.success,
      match_status: result.matchStatus,
      message: result.message,
      duplicate: result.duplicate ?? false,
      applied: result.applied ?? null,
      candidates: result.candidates ?? [],
      inbox_id: result.inboxId ?? null,
      parsed: parsed
        ? {
            amount: parsed.amount,
            reference: parsed.reference,
            transaction_id: parsed.transactionId,
            payer_name: parsed.payerName,
          }
        : null,
    })
  } catch (err) {
    console.error("[api/ops/momo/confirm]", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
