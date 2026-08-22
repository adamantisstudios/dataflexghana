import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getJobsSupabaseAdmin } from "@/lib/jobs-supabase-admin"

export const dynamic = "force-dynamic"

function pickJobFields(row: Record<string, unknown>) {
  return {
    id: row.id,
    job_title: row.job_title,
    employer_name: row.employer_name,
    employer_logo_url: row.employer_logo_url,
    location: row.location,
    industry: row.industry,
    salary_type: row.salary_type,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_exact: row.salary_exact,
    salary_custom: row.salary_custom,
    salary_currency: row.salary_currency,
    description: row.description,
    requirements: row.requirements,
    application_deadline: row.application_deadline,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    application_method: row.application_method,
    application_url: row.application_url,
    is_featured: row.is_featured,
    is_active: row.is_active,
    created_at: row.created_at,
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()
    const industry = (searchParams.get("industry") || "").trim()
    const featuredOnly = searchParams.get("featured") === "true"
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100)

    const supabase = getJobsSupabaseAdmin()
    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (featuredOnly) {
      query = query.eq("is_featured", true)
    }

    if (industry && industry !== "all" && industry !== "featured") {
      query = query.ilike("industry", `%${industry}%`)
    }

    if (search) {
      query = query.or(
        `job_title.ilike.%${search}%,employer_name.ilike.%${search}%,location.ilike.%${search}%,industry.ilike.%${search}%`,
      )
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const jobs = (data || []).map((row) => pickJobFields(row as Record<string, unknown>))

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total: count ?? jobs.length,
        totalPages: Math.ceil((count ?? jobs.length) / limit),
      },
      industries: [
        "Technology",
        "Finance",
        "Healthcare",
        "Marketing",
        "Sales",
        "Customer Service",
      ],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load jobs"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
