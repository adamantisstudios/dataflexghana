import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { referralServiceAgentCommission } from "@/lib/referral-service-commission"
import { sanitizeSearchTerm } from "@/lib/postgrest-search"

export const dynamic = "force-dynamic"

function mapService(row: Record<string, unknown>) {
  const commissionAmount = Number(row.commission_amount ?? 0)
  const productCost = Number(row.product_cost ?? commissionAmount)
  const agentCommission =
    typeof row.agent_commission === "number"
      ? row.agent_commission
      : referralServiceAgentCommission({
          commission_amount: commissionAmount,
          product_cost: Number(row.product_cost ?? productCost),
        })

  const imageUrls = Array.isArray(row.image_urls)
    ? (row.image_urls as unknown[]).map(String).filter(Boolean)
    : []
  const imageUrl = (row.image_url as string | null) || imageUrls[0] || null

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    commission_amount: commissionAmount,
    product_cost: productCost,
    cost: productCost || commissionAmount,
    agent_commission: agentCommission,
    image_url: imageUrl,
    image_urls: imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [],
    materials_link: row.materials_link ?? row.material_link ?? null,
    materials_link_label: row.materials_link_label ?? null,
    service_type: row.service_type,
  }
}

/** List referral services (dashboard "Referral Services") + agent's referral history. */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchTerm(searchParams.get("search"))
    const historyOnly = searchParams.get("history") === "1"
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 100)
    const db = getAdminClient()

    if (historyOnly) {
      const { data, error } = await db
        .from("referrals")
        .select(
          "id, client_name, client_phone, description, status, allow_direct_contact, created_at, service_id, services(id, title, commission_amount, image_url)",
        )
        .eq("agent_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        referrals: data || [],
      })
    }

    let query = db
      .from("services")
      .select("*", { count: "exact" })
      .eq("service_type", "referral")
      .order("title", { ascending: true })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const services = (data || []).map((row) => mapService(row as Record<string, unknown>))

    return NextResponse.json({
      success: true,
      services,
      page,
      limit,
      total: count ?? services.length,
      totalPages: Math.max(1, Math.ceil((count ?? services.length) / limit)),
    })
  } catch (e) {
    console.error("[mobile referral-services GET]", e)
    return NextResponse.json({ error: "Failed to load referral services" }, { status: 500 })
  }
}

/** Submit a referral for a service (same shape as web /agent/refer/[id]). */
export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const body = await request.json()
    const serviceId = String(body.service_id || body.serviceId || "").trim()
    const clientName = String(body.client_name || body.clientName || "").trim()
    const clientPhone = String(body.client_phone || body.clientPhone || "").trim()
    const description = String(body.description || "").trim()
    const allowDirectContact =
      body.allow_direct_contact === undefined && body.allowDirectContact === undefined
        ? true
        : Boolean(body.allow_direct_contact ?? body.allowDirectContact)

    if (!serviceId || !clientName || !clientPhone || !description) {
      return NextResponse.json(
        { error: "service_id, client_name, client_phone, and description are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const { data: service, error: svcErr } = await db
      .from("services")
      .select("id, title, service_type")
      .eq("id", serviceId)
      .maybeSingle()

    if (svcErr || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }
    if (service.service_type !== "referral") {
      return NextResponse.json({ error: "Not a referral service" }, { status: 400 })
    }

    const { data, error } = await db
      .from("referrals")
      .insert({
        agent_id: auth.user.id,
        service_id: serviceId,
        client_name: clientName,
        client_phone: clientPhone,
        description,
        allow_direct_contact: allowDirectContact,
        status: "pending",
      })
      .select("id, status, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      referral: data,
      message: "Referral submitted successfully",
    })
  } catch (e) {
    console.error("[mobile referral-services POST]", e)
    return NextResponse.json({ error: "Failed to submit referral" }, { status: 500 })
  }
}
