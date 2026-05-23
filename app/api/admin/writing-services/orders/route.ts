import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { mapWritingOrderRow } from "@/lib/writing-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("writing_orders")
      .select("*, writing_services(*), agents(full_name, phone_number)")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      data: (data || []).map((r) => mapWritingOrderRow(r as Record<string, unknown>)),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 },
    )
  }
}
