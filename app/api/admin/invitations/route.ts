import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "pending"
    const search = url.searchParams.get("search") || ""
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const pageSize = 10
    const offset = (page - 1) * pageSize

    console.log("[v0] Fetching referral credits with status:", status, "search:", search)

    let query = supabase
      .from("referral_credits")
      .select(
        `
        id,
        referring_agent_id,
        referred_agent_id,
        status,
        credit_amount,
        created_at,
        credited_at,
        referring_agent:agents!referral_credits_referring_agent_id_fkey (
          id,
          full_name,
          phone_number
        ),
        referred_agent:agents!referral_credits_referred_agent_id_fkey (
          id,
          full_name,
          phone_number
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: allData, error: allDataError } = await query

    if (allDataError) {
      console.error("[v0] Error fetching referral credits:", allDataError)
      throw allDataError
    }

    let filteredData = allData || []

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchFilter = search.trim().toLowerCase()
      filteredData = filteredData.filter((item: any) => {
        const referringName = item.referring_agent?.full_name?.toLowerCase() || ""
        const referringPhone = item.referring_agent?.phone_number?.toLowerCase() || ""
        const referredName = item.referred_agent?.full_name?.toLowerCase() || ""
        const referredPhone = item.referred_agent?.phone_number?.toLowerCase() || ""

        return (
          referringName.includes(searchFilter) ||
          referringPhone.includes(searchFilter) ||
          referredName.includes(searchFilter) ||
          referredPhone.includes(searchFilter)
        )
      })
    }

    const total = filteredData.length
    const paginatedData = filteredData.slice(offset, offset + pageSize)

    const mappedData = paginatedData.map((item: any) => ({
      id: item.id,
      referring_agent_id: item.referring_agent_id,
      referring_agent_name: item.referring_agent?.full_name || "Unknown",
      referring_agent_phone: item.referring_agent?.phone_number,
      referred_agent_id: item.referred_agent_id,
      referred_agent_name: item.referred_agent?.full_name || "Unknown",
      referred_agent_phone: item.referred_agent?.phone_number,
      status: item.status,
      credit_amount: item.credit_amount,
      created_at: item.created_at,
      credited_at: item.credited_at,
    }))

    console.log("[v0] Found referral credits:", mappedData.length || 0)

    return NextResponse.json({
      success: true,
      data: mappedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
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
