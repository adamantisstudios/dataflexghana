import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
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

    console.log("[v0] Fetching invitations with status:", status, "search:", search)

    const countQuery = supabase
      .from("referral_credits")
      .select("id", { count: "exact", head: true })
      .eq("status", status)

    const dataQuery = supabase
      .from("referral_credits")
      .select(
        `
        id,
        credit_amount,
        status,
        created_at,
        referring_agent_id,
        referred_agent_id,
        agents!referral_credits_referring_agent_id_fkey (
          id,
          full_name,
          phone_number,
          agent_name,
          referral_code
        ),
        agents_referred:agents!referral_credits_referred_agent_id_fkey (
          id,
          full_name,
          phone_number,
          email
        )
      `,
      )
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    // Apply search filter if provided
    if (search && search.trim()) {
      // Search across agent names and phone numbers
      const searchFilter = search.trim().toLowerCase()

      // Fetch all data first, then filter client-side for complex searches
      const { data: allData, error: allDataError } = await supabase
        .from("referral_credits")
        .select(
          `
          id,
          credit_amount,
          status,
          created_at,
          referring_agent_id,
          referred_agent_id,
          agents!referral_credits_referring_agent_id_fkey (
            id,
            full_name,
            phone_number,
            agent_name,
            referral_code
          ),
          agents_referred:agents!referral_credits_referred_agent_id_fkey (
            id,
            full_name,
            phone_number,
            email
          )
        `,
        )
        .eq("status", status)

      if (allDataError) throw allDataError

      // Filter data based on search term
      const filtered = (allData || []).filter((item: any) => {
        const referringName = item.agents?.full_name?.toLowerCase() || ""
        const referringPhone = item.agents?.phone_number?.toLowerCase() || ""
        const referredName = item.agents_referred?.full_name?.toLowerCase() || ""
        const referredPhone = item.agents_referred?.phone_number?.toLowerCase() || ""

        return (
          referringName.includes(searchFilter) ||
          referringPhone.includes(searchFilter) ||
          referredName.includes(searchFilter) ||
          referredPhone.includes(searchFilter)
        )
      })

      const paginatedData = filtered.slice(offset, offset + pageSize)
      const total = filtered.length

      const mappedData = paginatedData.map((item: any) => ({
        id: item.id,
        credit_amount: item.credit_amount,
        status: item.status,
        created_at: item.created_at,
        referring_agent_id: item.referring_agent_id,
        referred_agent_id: item.referred_agent_id,
        referring_agent_name: item.agents?.full_name || "Unknown",
        referred_agent_name: item.agents_referred?.full_name || "Unknown",
        referred_phone: item.agents_referred?.phone_number,
        referring_phone: item.agents?.phone_number,
      }))

      return NextResponse.json({
        success: true,
        data: mappedData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      console.error("[v0] Count error:", countError)
      throw countError
    }

    const { data, error: dataError } = await dataQuery
    if (dataError) {
      console.error("[v0] Data error:", dataError)
      throw dataError
    }

    console.log("[v0] Found invitations:", data?.length || 0)

    const mappedData = (data || []).map((item: any) => ({
      id: item.id,
      credit_amount: item.credit_amount,
      status: item.status,
      created_at: item.created_at,
      referring_agent_id: item.referring_agent_id,
      referred_agent_id: item.referred_agent_id,
      referring_agent_name: item.agents?.full_name || "Unknown",
      referred_agent_name: item.agents_referred?.full_name || "Unknown",
      referred_phone: item.agents_referred?.phone_number,
      referring_phone: item.agents?.phone_number,
    }))

    return NextResponse.json({
      success: true,
      data: mappedData,
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
