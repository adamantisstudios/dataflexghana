import { NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error || "Admin authentication required" },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10) || 20),
  )
  const from = (page - 1) * limit
  const to = from + limit - 1

  try {
    const supabase = getAdminClient()
    const { data, error, count } = await supabase
      .from("maintenance_mode_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching maintenance logs:", error)
      return NextResponse.json(
        { error: "Failed to fetch maintenance logs" },
        { status: 500 },
      )
    }

    const total = count ?? 0
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Maintenance logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
