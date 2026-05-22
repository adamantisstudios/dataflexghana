import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { normalizeGroceryPhone } from "@/lib/grocery-abuse"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("blocked_phones")
      .select("phone, blocked_at")
      .order("blocked_at", { ascending: false })

    if (error) {
      if (error.message?.includes("blocked_phones") || error.code === "42P01") {
        return NextResponse.json({
          success: true,
          data: [],
          warning: "Run scripts/053_blocked_phones.sql on Supabase",
        })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load blocked numbers" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = (await request.json()) as { phone?: string }
    const raw = String(body.phone ?? "").trim()
    if (!raw) {
      return NextResponse.json({ success: false, error: "Phone is required" }, { status: 400 })
    }

    const phone = normalizeGroceryPhone(raw)
    const db = getAdminClient()
    const { error } = await db.from("blocked_phones").upsert({ phone }, { onConflict: "phone" })

    if (error) {
      if (error.message?.includes("blocked_phones") || error.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error: "Run scripts/053_blocked_phones.sql on Supabase before blocking numbers",
          },
          { status: 500 },
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorType: "admin",
      action: "grocery_phone_blocked",
      targetTable: "blocked_phones",
      targetId: phone,
      newData: { phone },
    })

    return NextResponse.json({ success: true, phone })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to block number" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const phoneParam = new URL(request.url).searchParams.get("phone")?.trim()
    if (!phoneParam) {
      return NextResponse.json({ success: false, error: "phone query parameter is required" }, { status: 400 })
    }

    const phone = normalizeGroceryPhone(phoneParam)
    const db = getAdminClient()
    const { error } = await db.from("blocked_phones").delete().eq("phone", phone)

    if (error) {
      if (error.message?.includes("blocked_phones") || error.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error: "Run scripts/053_blocked_phones.sql on Supabase",
          },
          { status: 500 },
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorType: "admin",
      action: "grocery_phone_unblocked",
      targetTable: "blocked_phones",
      targetId: phone,
      newData: { phone },
    })

    return NextResponse.json({ success: true, phone })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to unblock number" },
      { status: 500 },
    )
  }
}
