import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const agent_id = String(body.agent_id ?? "").trim()
    if (!agent_id) return NextResponse.json({ error: "agent_id required" }, { status: 400 })

    const db = getAdminClient()
    const { error } = await db
      .from("agent_store_profiles")
      .upsert(
        {
          agent_id,
          can_list_products: Boolean(body.can_list_products),
        },
        { onConflict: "agent_id" },
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
