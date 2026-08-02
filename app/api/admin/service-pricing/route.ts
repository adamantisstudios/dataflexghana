import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { fetchServicePricingRows } from "@/lib/service-pricing-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const pricing = await fetchServicePricingRows()
    return NextResponse.json({ success: true, pricing })
  } catch (error) {
    console.error("GET /api/admin/service-pricing:", error)
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const key = String(body.key ?? "").trim()
    const amount = Number(body.amount)
    const label = String(body.label ?? "").trim()

    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 })
    if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 })
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "amount must be zero or greater" }, { status: 400 })
    }

    // Registration pricing is intentionally excluded from admin control.
    if (key.startsWith("registration_")) {
      return NextResponse.json({ error: "Registration pricing cannot be changed here" }, { status: 403 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("platform_service_pricing")
      .upsert(
        {
          key,
          label,
          amount,
          description: body.description != null ? String(body.description).trim() || null : null,
          category: String(body.category ?? "compliance"),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )
      .select("*")
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: "Run scripts/platform-service-pricing.sql in Supabase if the table does not exist yet.",
        },
        { status: 500 },
      )
    }

    const pricing = await fetchServicePricingRows()
    return NextResponse.json({ success: true, row: data, pricing })
  } catch (error) {
    console.error("PUT /api/admin/service-pricing:", error)
    return NextResponse.json({ error: "Failed to save pricing" }, { status: 500 })
  }
}
