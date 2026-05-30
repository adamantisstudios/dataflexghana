import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest, logNewOrderAudit } from "@/lib/audit-logger"
import { sendGroceryRequestNotificationEmail } from "@/lib/sendEmail"
import type { GroceryRequestFormPayload } from "@/lib/grocery-types"
import {
  isGroceryReferenceAlreadyUsed,
  verifyGroceryCommitmentWithPaystack,
} from "@/lib/grocery-paystack"
import {
  hasGroceryRequestInLast24Hours,
  isGroceryPhoneBlocked,
  normalizeGroceryPhone,
} from "@/lib/grocery-abuse"

export const dynamic = "force-dynamic"

function trimOptional(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s || null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GroceryRequestFormPayload

    const paystack_reference = String(body.paystack_reference ?? "").trim()
    if (!paystack_reference) {
      return NextResponse.json(
        { success: false, error: "Commitment fee payment is required before submitting your list" },
        { status: 400 },
      )
    }

    const verified = await verifyGroceryCommitmentWithPaystack(paystack_reference)
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: verified.error || "Invalid or unpaid commitment fee" },
        { status: 400 },
      )
    }

    if (await isGroceryReferenceAlreadyUsed(paystack_reference)) {
      return NextResponse.json(
        {
          success: false,
          error: "This payment has already been used for a grocery request",
        },
        { status: 409 },
      )
    }

    const full_name = String(body.full_name ?? "").trim()
    const phoneRaw = String(body.phone ?? "").trim()
    const shopping_list = String(body.shopping_list ?? "").trim()

    if (!full_name || !phoneRaw || !shopping_list) {
      return NextResponse.json(
        { success: false, error: "Full name, phone, and shopping list are required" },
        { status: 400 },
      )
    }

    const phone = normalizeGroceryPhone(phoneRaw)
    const db = getAdminClient()

    if (await isGroceryPhoneBlocked(db, phone)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This phone number is blocked from placing requests. Contact support for assistance.",
        },
        { status: 403 },
      )
    }

    if (await hasGroceryRequestInLast24Hours(db, phone)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can only submit one request per day. Please wait or contact us for urgent orders.",
        },
        { status: 429 },
      )
    }

    const attachments = Array.isArray(body.attachments)
      ? body.attachments.filter((u) => typeof u === "string" && u.trim()).slice(0, 5)
      : []

    const row = {
      full_name,
      phone,
      whatsapp: trimOptional(body.whatsapp),
      email: trimOptional(body.email),
      address: trimOptional(body.address),
      landmark: trimOptional(body.landmark),
      delivery_time: trimOptional(body.delivery_time),
      shopping_list,
      attachments,
      notes: trimOptional(body.notes),
      status: "new_request" as const,
      paystack_reference,
    }

    const { data, error } = await db.from("grocery_requests").insert(row).select("id").single()

    if (error) {
      console.error("[api/grocery/request] insert:", error)
      if (error.message?.includes("paystack_reference")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database migration required: run scripts/052_grocery_paystack_reference.sql on Supabase",
          },
          { status: 500 },
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorType: "public",
      action: "grocery_request_submitted",
      targetTable: "grocery_requests",
      targetId: data.id,
      newData: { ...row, id: data.id },
    })

    await logNewOrderAudit({
      orderId: data.id,
      orderType: "grocery_request",
      amount: verified.amountGhs ?? null,
      actorType: "public",
      targetTable: "grocery_requests",
      details: { full_name, phone, paystack_reference },
      ipAddress: null,
      userAgent: null,
    })

    void sendGroceryRequestNotificationEmail({
      id: data.id,
      full_name,
      phone,
      whatsapp: row.whatsapp,
      shopping_list,
      address: row.address,
      landmark: row.landmark,
      delivery_time: row.delivery_time,
      notes: row.notes,
      attachments,
      paystack_reference,
    }).catch((e) => console.error("[api/grocery/request] email:", e))

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error("[api/grocery/request]", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to submit request" },
      { status: 500 },
    )
  }
}
