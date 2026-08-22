import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { AGENT_MOMO, COMPLIANCE_FORMS } from "@/lib/agent-mobile"
import { getAdminClient } from "@/lib/supabase-base"
import { notifyAdminOps } from "@/lib/ops/notify-admin-ops"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const db = getAdminClient()
  const { data, error } = await db
    .from("form_submissions")
    .select("id, form_id, status, created_at, form_data")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    forms: COMPLIANCE_FORMS,
    submissions: data || [],
    momo: AGENT_MOMO,
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; full_name?: string; phone_number?: string }
  let body: {
    form_id?: string
    client_name?: string
    client_phone?: string
    notes?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const formId = body.form_id?.trim()
  const formMeta = COMPLIANCE_FORMS.find((f) => f.id === formId || f.form_type === formId)
  if (!formMeta) {
    return NextResponse.json({ error: "Invalid form_id" }, { status: 400 })
  }

  const clientName = body.client_name?.trim() || ""
  const clientPhone = (body.client_phone || "").replace(/\D/g, "")
  if (!clientName || clientPhone.length < 10) {
    return NextResponse.json({ error: "client_name and 10-digit client_phone are required" }, { status: 400 })
  }

  const formData = {
    client_name: clientName,
    client_phone: clientPhone.slice(0, 10),
    notes: body.notes?.trim() || "",
    source: "agent_mobile_app",
    agent_phone: agent.phone_number || null,
  }

  const db = getAdminClient()
  const { data: row, error } = await db
    .from("form_submissions")
    .insert({
      agent_id: agent.id,
      form_id: formMeta.id,
      form_data: formData,
      status: "Pending",
    })
    .select("id, form_id, status, created_at")
    .single()

  if (error || !row) {
    return NextResponse.json({ error: error?.message || "Failed to submit" }, { status: 500 })
  }

  await notifyAdminOps({
    category: "compliance",
    severity: "warning",
    title: `Compliance: ${formMeta.form_name}`,
    body: `${agent.full_name || "Agent"} · ${clientName} · ${clientPhone.slice(0, 10)}`,
    deeplinkTab: "compliance",
    entityType: "form_submissions",
    entityId: row.id,
    requiresAck: true,
    source: "pending",
    payload: { form_id: formMeta.id, agent_id: agent.id, ...formData },
  })

  return NextResponse.json({
    success: true,
    submission: row,
    form: formMeta,
    payment: {
      momo: AGENT_MOMO,
      instructions: `Pay the compliance fee to ${AGENT_MOMO.number} (${AGENT_MOMO.name}). Admin will process ${formMeta.form_name}.`,
    },
  })
}
