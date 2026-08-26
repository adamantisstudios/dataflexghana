import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { AGENT_MOMO } from "@/lib/agent-mobile"
import {
  COMPLIANCE_MOBILE_SCHEMAS,
  enrichComplianceSchemasWithPricing,
  getComplianceMobileSchema,
} from "@/lib/compliance-mobile-schemas"
import { getAdminClient } from "@/lib/supabase-base"
import { notifyAdminOps } from "@/lib/ops/notify-admin-ops"

export const dynamic = "force-dynamic"

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path]
  const parts = path.split(".")
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined
    const idx = Number.isInteger(Number(part)) ? Number(part) : null
    if (idx != null && Array.isArray(cur)) {
      cur = cur[idx]
    } else {
      cur = (cur as Record<string, unknown>)[part]
    }
  }
  return cur
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const db = getAdminClient()
  const formId = request.nextUrl.searchParams.get("form_id")

  if (formId) {
    const schema = getComplianceMobileSchema(formId)
    if (!schema) return NextResponse.json({ error: "Unknown form" }, { status: 404 })
    const [form] = await enrichComplianceSchemasWithPricing([schema])
    return NextResponse.json({ success: true, form, momo: AGENT_MOMO })
  }

  const { data, error } = await db
    .from("form_submissions")
    .select("id, form_id, status, created_at, form_data")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const forms = await enrichComplianceSchemasWithPricing(COMPLIANCE_MOBILE_SCHEMAS)

  return NextResponse.json({
    success: true,
    forms,
    submissions: data || [],
    momo: AGENT_MOMO,
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; full_name?: string; phone_number?: string }
  let body: {
    form_id?: string
    form_data?: Record<string, unknown>
    images?: Array<{ image_type: string; image_url: string }>
    selected_cost?: number
    selected_cost_tier?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const formId = body.form_id?.trim()
  const schema = formId ? getComplianceMobileSchema(formId) : undefined
  if (!schema) {
    return NextResponse.json({ error: "Invalid form_id" }, { status: 400 })
  }

  const formData = { ...(body.form_data || {}) } as Record<string, unknown>
  if (body.selected_cost != null) formData.selected_cost = body.selected_cost
  if (body.selected_cost_tier) formData.selected_cost_tier = body.selected_cost_tier
  formData.source = "agent_mobile_app"
  formData.agent_phone = agent.phone_number || null

  for (const step of schema.steps) {
    for (const field of step.fields) {
      if (!field.required) continue
      const val = getByPath(formData, field.key)
      if (val == null || String(val).trim() === "") {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 })
      }
    }
  }

  for (const img of schema.required_images.filter((i) => i.required)) {
    const uploaded = (body.images || []).find((i) => i.image_type === img.key)
    if (!uploaded?.image_url) {
      return NextResponse.json({ error: `${img.label} is required` }, { status: 400 })
    }
  }

  const db = getAdminClient()
  const { data: row, error } = await db
    .from("form_submissions")
    .insert({
      agent_id: agent.id,
      form_id: schema.id,
      form_data: formData,
      status: "Pending",
    })
    .select("id, form_id, status, created_at")
    .single()

  if (error || !row) {
    return NextResponse.json({ error: error?.message || "Failed to submit" }, { status: 500 })
  }

  const images = body.images || []
  if (images.length > 0) {
    const { error: imgError } = await db.from("form_images").insert(
      images.map((img) => ({
        submission_id: row.id,
        image_type: img.image_type,
        image_url: img.image_url,
      })),
    )
    if (imgError) {
      console.error("[mobile/compliance] form_images:", imgError)
    }
  }

  const [enriched] = await enrichComplianceSchemasWithPricing([schema])
  const fee =
    formData.selected_cost != null
      ? Number(formData.selected_cost)
      : enriched.pricing.default_fee ?? 0

  await notifyAdminOps({
    category: "compliance",
    severity: "warning",
    title: `Compliance: ${schema.form_name}`,
    body: `${agent.full_name || "Agent"} submitted ${schema.form_name}`,
    deeplinkTab: "compliance",
    entityType: "form_submissions",
    entityId: row.id,
    requiresAck: true,
    source: "pending",
    payload: { form_id: schema.id, agent_id: agent.id, fee },
  })

  return NextResponse.json({
    success: true,
    submission: row,
    form: enriched,
    payment: {
      momo: AGENT_MOMO,
      amount: fee,
      instructions:
        fee > 0
          ? `Pay GHS ${Number(fee).toFixed(2)} to ${AGENT_MOMO.number} (${AGENT_MOMO.name}). Admin will process your ${schema.form_name} application.`
          : `No upfront fee. Admin will contact you to complete ${schema.form_name}.`,
    },
  })
}
