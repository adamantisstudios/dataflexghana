import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { COMPLIANCE_FORM_SOLE_PROPRIETORSHIP } from "@/lib/storefront-catalog"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agent_id,
      form_type,
      paystack_reference,
      customer_data,
    } = body as {
      agent_id?: string
      form_type?: string
      paystack_reference?: string
      customer_data?: Record<string, unknown>
    }

    if (!agent_id || !form_type || !paystack_reference || !customer_data) {
      return NextResponse.json(
        { error: "agent_id, form_type, paystack_reference, and customer_data are required" },
        { status: 400 },
      )
    }

    if (form_type !== COMPLIANCE_FORM_SOLE_PROPRIETORSHIP) {
      return NextResponse.json({ error: "Unsupported form type" }, { status: 400 })
    }

    const required = ["business_name", "owner_name", "phone", "email", "location", "signature"]
    for (const key of required) {
      if (!String(customer_data[key] ?? "").trim()) {
        return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 })
      }
    }

    const db = getAdminClient()

    const { data: existing } = await db
      .from("storefront_compliance_submissions")
      .select("id, status")
      .eq("paystack_reference", paystack_reference)
      .eq("agent_id", agent_id)
      .maybeSingle()

    if (existing?.status === "pending" || existing?.status === "processing" || existing?.status === "completed") {
      return NextResponse.json({ success: true, idempotent: true, submission_id: existing.id })
    }

    if (existing?.status === "paid_pending_form") {
      const { data: updated, error: updateError } = await db
        .from("storefront_compliance_submissions")
        .update({
          customer_data,
          status: "pending",
        })
        .eq("id", existing.id)
        .select("id")
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, submission_id: updated?.id })
    }

    return NextResponse.json(
      { error: "Payment not verified. Complete Paystack payment first." },
      { status: 402 },
    )
  } catch (error) {
    console.error("compliance submit:", error)
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 })
  }
}
