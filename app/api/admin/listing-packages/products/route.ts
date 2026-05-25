import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const db = getAdminClient()
    if (body.is_active !== undefined) {
      const { error } = await db
        .from("agent_products")
        .update({ is_active: Boolean(body.is_active) })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "No updates" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const id = request.nextUrl.searchParams.get("id")?.trim()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const db = getAdminClient()
  const { error } = await db.from("agent_products").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
