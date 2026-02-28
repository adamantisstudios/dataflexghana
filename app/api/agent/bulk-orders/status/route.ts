import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const agentId = url.searchParams.get("agent_id")

    if (!agentId) {
      return Response.json({ error: "agent_id is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle cases where cookies cannot be set
            }
          },
        },
      },
    )

    console.log("[v0] Fetching bulk orders for agent:", agentId)

    const { data, error } = await supabase
      .from("bulk_orders")
      .select("id, source, row_count, accepted_count, rejected_count, status, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Supabase error:", error)
      throw error
    }

    console.log("[v0] Found bulk orders:", data?.length || 0)
    return Response.json(data || [])
  } catch (error) {
    console.error("Error fetching bulk order status:", error)
    return Response.json({ error: "Failed to fetch order status" }, { status: 500 })
  }
}
