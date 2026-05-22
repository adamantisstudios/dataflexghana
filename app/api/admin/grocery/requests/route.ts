import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { GROCERY_STATUSES } from "@/lib/grocery-types"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")?.trim()
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const search = searchParams.get("search")?.trim()
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const db = getAdminClient()
    let query = db
      .from("grocery_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (status && status !== "all" && GROCERY_STATUSES.includes(status as (typeof GROCERY_STATUSES)[number])) {
      query = query.eq("status", status)
    }

    if (search && search.length >= 2) {
      const escaped = search.replace(/[%_\\]/g, "\\$&")
      const pattern = `%${escaped}%`
      query = query.or(`full_name.ilike.${pattern},phone.ilike.${pattern},whatsapp.ilike.${pattern}`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load requests" },
      { status: 500 },
    )
  }
}
