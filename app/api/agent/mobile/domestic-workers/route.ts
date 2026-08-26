import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

function mapWorker(row: Record<string, unknown>) {
  return {
    id: row.id,
    full_name: row.full_name,
    age: Number(row.age ?? 0),
    years_of_experience: Number(row.years_of_experience ?? 0),
    highest_education_level: row.highest_education_level ?? "",
    key_skills: row.key_skills ?? "",
    current_location: row.current_location ?? "",
    availability_status: row.availability_status ?? "available",
    image_url_1: row.image_url_1 ?? null,
    image_url_2: row.image_url_2 ?? null,
    image_url_3: row.image_url_3 ?? null,
    religion: row.religion ?? null,
    primary_language: row.primary_language ?? null,
    other_languages: row.other_languages ?? null,
    willing_to_relocate: row.willing_to_relocate === true,
    job_type: row.job_type ?? null,
    tribe: row.tribe ?? null,
    marital_status: row.marital_status ?? null,
    created_at: row.created_at,
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const db = getAdminClient()
  const search = (request.nextUrl.searchParams.get("search") || "").trim()
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10))
  const limit = Math.min(24, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "12", 10)))
  const offset = (page - 1) * limit

  let query = db
    .from("domestic_workers_candidates")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,current_location.ilike.%${search}%,key_skills.ilike.%${search}%,primary_language.ilike.%${search}%`,
    )
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) {
    console.error("[mobile/domestic-workers GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    workers: (data || []).map((w) => mapWorker(w as Record<string, unknown>)),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; full_name?: string; phone_number?: string }
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const action = String(body.action || "hire_specific")
  const db = getAdminClient()

  if (action === "hire_general") {
    const clientName = String(body.client_full_name ?? body.clientName ?? "").trim()
    const clientPhone = String(body.client_phone ?? body.clientPhone ?? "").trim()
    const location = String(body.exact_location ?? body.clientLocation ?? "").trim()
    if (!clientName || !clientPhone || !location) {
      return NextResponse.json(
        { error: "client_full_name, client_phone, and exact_location are required" },
        { status: 400 },
      )
    }

    const insert = {
      client_full_name: clientName,
      client_phone: clientPhone,
      client_email: String(body.client_email ?? body.clientEmail ?? "").trim() || null,
      exact_location: location,
      number_of_people_needing_support: body.number_of_people_needing_support
        ? Number(body.number_of_people_needing_support)
        : null,
      person_needing_support: String(body.person_needing_support ?? "").trim() || null,
      religious_faith: String(body.religious_faith ?? "").trim() || null,
      salary_estimation: String(body.salary_estimation ?? body.budget_range ?? "").trim() || null,
      working_hours_days: String(body.working_hours_days ?? "").trim() || null,
      worker_type: String(body.worker_type ?? "").trim() || null,
      faith_preference: String(body.faith_preference ?? "").trim() || null,
      start_date_preference: String(body.start_date_preference ?? body.start_date ?? "").trim() || null,
      additional_info: String(body.additional_info ?? body.message ?? "").trim() || null,
      status: "pending",
      submitted_from: "agent",
      request_source: `agent:${agent.id}`,
      agent_id: agent.id,
      agent_name: agent.full_name ?? null,
      agent_phone: agent.phone_number ?? null,
    }

    const { data, error } = await db.from("domestic_workers_client_requests").insert([insert]).select().maybeSingle()
    if (error) {
      // Retry without optional agent columns if schema is older
      const { agent_id: _a, agent_name: _n, agent_phone: _p, ...fallback } = insert as Record<string, unknown>
      const retry = await db.from("domestic_workers_client_requests").insert([fallback]).select().maybeSingle()
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, request: retry.data })
    }
    return NextResponse.json({ success: true, request: data })
  }

  // hire_specific
  const clientName = String(body.clientName ?? body.client_name ?? "").trim()
  const clientPhone = String(body.clientPhone ?? body.client_phone ?? "").trim()
  const clientLocation = String(body.clientLocation ?? body.client_location ?? "").trim()
  const serviceType = String(body.serviceType ?? body.service_type ?? "").trim()
  if (!clientName || !clientPhone || !clientLocation || !serviceType) {
    return NextResponse.json(
      { error: "clientName, clientPhone, clientLocation, and serviceType are required" },
      { status: 400 },
    )
  }

  const getConstraintValue = (value: unknown, allowed: string[]) => {
    const v = String(value ?? "").trim()
    if (!v) return null
    return allowed.includes(v) ? v : null
  }

  const insertData: Record<string, unknown> = {
    client_name: clientName,
    client_full_name: clientName,
    client_phone: clientPhone,
    client_email: String(body.clientEmail ?? "").trim() || null,
    client_location: clientLocation,
    exact_location: clientLocation,
    service_type: serviceType,
    message: String(body.message ?? "").trim() || null,
    additional_info: String(body.message ?? "").trim() || null,
    budget_range: String(body.budgetRange ?? "").trim() || null,
    salary_estimation: String(body.budgetRange ?? "").trim() || null,
    start_date: String(body.startDate ?? "").trim() || null,
    start_date_preference: String(body.startDate ?? "").trim() || null,
    preferred_worker_id: body.preferredWorkerId ?? null,
    candidate_name: String(body.candidateName ?? "").trim() || null,
    number_of_people_needing_support: body.numberOfPeopleNeedingSupport
      ? Number.parseInt(String(body.numberOfPeopleNeedingSupport), 10)
      : null,
    person_needing_support: String(body.personNeedingSupport ?? "").trim() || null,
    religious_faith: String(body.religiousFaith ?? "").trim() || null,
    working_hours_days: String(body.workingHoursDays ?? "").trim() || null,
    status: "pending",
    submitted_from: "agent",
    agent_id: agent.id,
  }

  const faithPreference = getConstraintValue(body.faithPreference, [
    "same-faith",
    "any-faith",
    "different-faith",
    "christian",
    "muslim",
    "traditional",
    "no-preference",
  ])
  if (faithPreference) insertData.faith_preference = faithPreference

  const workerType = getConstraintValue(body.workerType, [
    "live-in",
    "live-out",
    "part-time",
    "full-time",
    "flexible",
  ])
  if (workerType) insertData.worker_type = workerType

  const { data, error } = await db.from("domestic_workers_requests").insert([insertData]).select().maybeSingle()
  if (error) {
    console.error("[mobile/domestic-workers POST hire]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, request: data }, { status: 201 })
}
