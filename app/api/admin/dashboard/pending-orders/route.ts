import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

function pickAgentName(agent: { full_name?: string | null; phone_number?: string | null } | null) {
  return agent?.full_name?.trim() || agent?.phone_number?.trim() || "Unknown agent"
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()

    const [
      dataOrdersRes,
      storefrontOrdersRes,
      groceryRes,
      adOrdersRes,
      influencerOrdersRes,
      farmOrdersRes,
      withdrawalsRes,
    ] = await Promise.all([
      db
        .from("data_orders")
        .select(
          `
          id, status, created_at, customer_phone, agent_id, amount,
          agents ( id, full_name, phone_number ),
          data_bundles ( name, provider )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10),

      db
        .from("storefront_orders")
        .select(
          `
          id, status, created_at, customer_phone, agent_id, total_paid, item_title, order_type,
          agents ( id, full_name, phone_number )
        `,
        )
        .eq("status", "Pending")
        .order("created_at", { ascending: false })
        .limit(10),

      db
        .from("grocery_requests")
        .select("id, status, created_at, full_name, phone, whatsapp, total_estimate")
        .eq("status", "new_request")
        .order("created_at", { ascending: false })
        .limit(5),

      db
        .from("ad_orders")
        .select(
          `
          id, status, created_at, agent_id, total_paid, customer_name, customer_phone, package_id,
          agents ( id, full_name, phone_number )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),

      db
        .from("influencer_orders")
        .select(
          `
          id, status, created_at, agent_id, total_price, client_name,
          agents ( id, full_name, phone_number ),
          package:influencer_packages ( title )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),

      db
        .from("farm_orders")
        .select(
          `
          id, status, created_at, agent_id, total_price, buyer_phone, buyer_name,
          agents ( id, full_name, phone_number )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),

      db
        .from("withdrawals")
        .select(
          `
          id, status, created_at, agent_id, amount, phone_number,
          agents ( id, full_name, phone_number )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    const errors = [
      dataOrdersRes.error,
      storefrontOrdersRes.error,
      groceryRes.error,
      adOrdersRes.error,
      influencerOrdersRes.error,
      farmOrdersRes.error,
      withdrawalsRes.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error("[pending-orders]", errors)
    }

    const data_orders = (dataOrdersRes.data || []).map((o) => {
      const agent = Array.isArray(o.agents) ? o.agents[0] : o.agents
      const bundle = Array.isArray(o.data_bundles) ? o.data_bundles[0] : o.data_bundles
      return {
        id: o.id,
        created_at: o.created_at,
        customer_phone: o.customer_phone,
        agent_name: pickAgentName(agent),
        product: bundle?.name || bundle?.provider || "Data bundle",
        amount: o.amount,
        href_tab: "orders",
      }
    })

    const storefront_orders = (storefrontOrdersRes.data || []).map((o) => {
      const agent = Array.isArray(o.agents) ? o.agents[0] : o.agents
      return {
        id: o.id,
        created_at: o.created_at,
        customer_phone: o.customer_phone,
        agent_name: pickAgentName(agent),
        product: o.item_title || o.order_type || "Storefront order",
        amount: o.total_paid,
        href_tab: "storefront-manager",
      }
    })

    const grocery_requests = (groceryRes.data || []).map((g) => ({
      id: g.id,
      created_at: g.created_at,
      customer_phone: g.phone || g.whatsapp,
      agent_name: g.full_name || "Customer",
      product: "Grocery request",
      amount: g.total_estimate,
      href_tab: "grocery-requests",
    }))

    const ad_orders = (adOrdersRes.data || []).map((o) => {
      const agent = Array.isArray(o.agents) ? o.agents[0] : o.agents
      return {
        id: o.id,
        created_at: o.created_at,
        customer_phone: o.customer_phone,
        agent_name: pickAgentName(agent),
        product: o.customer_name ? `Ad: ${o.customer_name}` : "Advertising order",
        amount: o.total_paid,
        href_tab: "advertising",
      }
    })

    const influencer_orders = (influencerOrdersRes.data || []).map((o) => {
      const agent = Array.isArray(o.agents) ? o.agents[0] : o.agents
      const pkg = Array.isArray(o.package) ? o.package[0] : o.package
      return {
        id: o.id,
        created_at: o.created_at,
        agent_name: pickAgentName(agent),
        product: pkg?.title || "Influencer package",
        client_name: o.client_name,
        amount: o.total_price,
        href_tab: "micro-influencers",
      }
    })

    const farm_orders = (farmOrdersRes.data || []).map((o) => {
      const agent = Array.isArray(o.agents) ? o.agents[0] : o.agents
      return {
        id: o.id,
        created_at: o.created_at,
        customer_phone: o.buyer_phone,
        agent_name: pickAgentName(agent),
        product: o.buyer_name ? `Farm: ${o.buyer_name}` : "Farm order",
        amount: o.total_price,
        href_tab: "farmers-friend",
      }
    })

    const withdrawals = (withdrawalsRes.data || []).map((w) => {
      const agent = Array.isArray(w.agents) ? w.agents[0] : w.agents
      return {
        id: w.id,
        created_at: w.created_at,
        customer_phone: w.phone_number,
        agent_name: pickAgentName(agent),
        product: "Withdrawal request",
        amount: w.amount,
        href_tab: "payouts",
      }
    })

    const total_pending =
      data_orders.length +
      storefront_orders.length +
      grocery_requests.length +
      ad_orders.length +
      influencer_orders.length +
      farm_orders.length +
      withdrawals.length

    return NextResponse.json({
      data_orders,
      storefront_orders,
      grocery_requests,
      ad_orders,
      influencer_orders,
      farm_orders,
      withdrawals,
      total_pending,
    })
  } catch (e) {
    console.error("[admin/dashboard/pending-orders]", e)
    return NextResponse.json({ error: "Failed to fetch pending orders" }, { status: 500 })
  }
}
