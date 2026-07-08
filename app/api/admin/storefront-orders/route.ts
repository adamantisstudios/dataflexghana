import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { fetchEnrichedStorefrontOrders } from "@/lib/storefront-orders"
import { countPendingStorefrontOrders } from "@/lib/storefront-order-capture"

export const dynamic = "force-dynamic"

function normalizeStorefrontStatus(input: unknown): string {
  const raw = String(input ?? "").trim().toLowerCase()
  if (!raw) return ""
  if (raw === "pending") return "Pending"
  if (raw === "processing") return "Processing"
  if (raw === "completed") return "Completed"
  if (raw === "canceled" || raw === "cancelled" || raw === "cancel") return "Cancelled"
  return ""
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const status = searchParams.get("status") || "all"
    const normalizedStatus =
      status === "all" ? undefined : normalizeStorefrontStatus(status)
    const search = searchParams.get("search") || ""

    const [result, pendingCount] = await Promise.all([
      fetchEnrichedStorefrontOrders({
        includeAgents: true,
        page,
        limit,
        status: normalizedStatus,
        search: search.trim() || undefined,
      }),
      countPendingStorefrontOrders(),
    ])

    return NextResponse.json({ success: true, pendingCount, ...result })
  } catch (error) {
    console.error("admin storefront-orders GET:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch orders"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 })
    }

    const normalizedStatus = normalizeStorefrontStatus(status)
    if (!normalizedStatus) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("storefront_orders")
      .update({ status: normalizedStatus })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      const msg = error.message || "Update failed"
      const isConstraint =
        error.code === "23514" || msg.toLowerCase().includes("check constraint")
      return NextResponse.json(
        {
          error: isConstraint
            ? "Invalid order status. Allowed: Pending, Processing, Completed, or Cancelled."
            : msg,
        },
        { status: isConstraint ? 400 : 500 },
      )
    }

    return NextResponse.json({ success: true, order: data })
  } catch (e) {
    console.error("admin storefront-orders PATCH:", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("storefront_orders")
      .delete()
      .eq("status", "Completed")
      .select("id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length ?? 0,
    })
  } catch (error) {
    console.error("admin storefront-orders DELETE:", error)
    return NextResponse.json({ error: "Failed to delete completed orders" }, { status: 500 })
  }
}
