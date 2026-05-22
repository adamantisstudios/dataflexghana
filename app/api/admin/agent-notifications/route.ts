import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const db = getAdminClient()
  const { data, error } = await db.from("agent_notifications").select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, message, start_date, end_date, frequency, template_name, is_active, target_agent_id } =
      body

    if (!title?.trim() || !message?.trim() || !start_date || !end_date || !frequency) {
      return NextResponse.json({ error: "title, message, start_date, end_date, and frequency are required" }, { status: 400 })
    }

    const db = getAdminClient()
    const insertRow: Record<string, unknown> = {
      title: title.trim(),
      message: message.trim(),
      start_date,
      end_date,
      frequency,
      template_name: template_name?.trim() || null,
      is_active: is_active !== false,
      target_agent_id: target_agent_id || null,
    }

    let { data, error } = await db.from("agent_notifications").insert(insertRow).select().single()

    if (error?.message?.includes("target_agent_id")) {
      delete insertRow.target_agent_id
      const retry = await db.from("agent_notifications").insert(insertRow).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, message, start_date, end_date, frequency, template_name, is_active, target_agent_id } =
      body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (message !== undefined) updates.message = message
    if (start_date !== undefined) updates.start_date = start_date
    if (end_date !== undefined) updates.end_date = end_date
    if (frequency !== undefined) updates.frequency = frequency
    if (template_name !== undefined) updates.template_name = template_name || null
    if (is_active !== undefined) updates.is_active = is_active
    if (target_agent_id !== undefined) updates.target_agent_id = target_agent_id || null

    let { data, error } = await db.from("agent_notifications").update(updates).eq("id", id).select().single()

    if (error?.message?.includes("target_agent_id")) {
      delete updates.target_agent_id
      const retry = await db.from("agent_notifications").update(updates).eq("id", id).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const db = getAdminClient()
  const { error } = await db.from("agent_notifications").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
