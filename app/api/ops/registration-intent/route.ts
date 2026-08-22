import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/**
 * POST /api/ops/registration-intent
 * Public (unauthenticated) — creates a pending manual registration payment intent
 * so MoMo SMS can match the short code. Rate-limited lightly by code uniqueness.
 *
 * Body: { reference_code, amount?, agent_name?, agent_email?, agent_phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const referenceCode = String(body.reference_code ?? body.referenceCode ?? "").trim()
    const amount = Number(body.amount ?? 47)
    const agentName = body.agent_name ?? body.agentName ?? null
    const agentEmail = body.agent_email ?? body.agentEmail ?? null
    const agentPhone = body.agent_phone ?? body.agentPhone ?? null

    if (!/^\d{5}$/.test(referenceCode)) {
      return NextResponse.json(
        { success: false, error: "reference_code must be a 5-digit code" },
        { status: 400 },
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const db = getAdminClient()

    const { data, error } = await db
      .from("registration_payment_intents")
      .insert({
        reference_code: referenceCode,
        amount,
        agent_name: agentName,
        agent_email: agentEmail,
        agent_phone: agentPhone,
        payment_method: "manual",
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, reference_code, amount, status, expires_at")
      .single()

    if (error) {
      // Unique pending code collision — return existing if still pending
      if (error.code === "23505") {
        const { data: existing } = await db
          .from("registration_payment_intents")
          .select("id, reference_code, amount, status, expires_at")
          .eq("reference_code", referenceCode)
          .eq("status", "pending")
          .maybeSingle()
        if (existing) {
          return NextResponse.json({ success: true, intent: existing, reused: true })
        }
      }
      console.error("[registration-intent]", error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, intent: data })
  } catch (err) {
    console.error("[api/ops/registration-intent]", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
