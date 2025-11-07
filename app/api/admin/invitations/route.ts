import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "pending"
    const search = url.searchParams.get("search") || ""
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const pageSize = 10
    const offset = (page - 1) * pageSize

    let countQuery = supabase
      .from("referral_tracking")
      .select("id", { count: "exact", head: true })
      .eq("admin_approval_status", status)

    // Build data query
    let dataQuery = supabase
      .from("referral_tracking")
      .select(
        `
        id,
        referral_code,
        referred_agent_id,
        referred_phone,
        referred_name,
        admin_approval_status,
        admin_rejection_reason,
        referred_user_registered,
        referred_user_registered_at,
        admin_approved_at,
        created_at,
        updated_at,
        referral_links (
          id,
          referral_code,
          agent_id,
          agents (
            id,
            agent_name,
            full_name,
            email
          )
        )
      `,
      )
      .eq("admin_approval_status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    // Apply search filters if provided
    if (search) {
      const searchFilter = `referred_name.ilike.%${search}%,referred_phone.ilike.%${search}%,referral_code.ilike.%${search}%`
      countQuery = countQuery.or(searchFilter)
      dataQuery = dataQuery.or(searchFilter)
    }

    const { count, error: countError } = await countQuery
    const { data, error: dataError } = await dataQuery

    if (countError) {
      console.error("[v0] Count error:", countError)
      throw countError
    }

    if (dataError) {
      console.error("[v0] Data error:", dataError)
      throw dataError
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error) {
    console.error("[v0] Error fetching invitations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch invitations",
      },
      { status: 500 },
    )
  }
}
