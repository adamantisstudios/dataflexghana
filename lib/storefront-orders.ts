import { getAdminClient } from "@/lib/supabase-base"

export interface StorefrontOrderRow {
  id: string
  agent_id: string
  data_bundle_id: string | null
  customer_phone: string | null
  paystack_reference: string
  base_cost: number
  agent_markup: number
  total_paid: number
  status: string
  created_at: string
  order_type?: string | null
  item_title?: string | null
  quantity?: number | null
  buyer_details?: Record<string, string> | null
  wholesale_product_id?: string | null
}

export interface EnrichedStorefrontOrder extends StorefrontOrderRow {
  data_bundles: {
    id: string
    name: string
    provider: string
    size_gb: number
    image_url?: string | null
  } | null
  agents?: {
    id: string
    full_name: string
    phone_number: string
  } | null
}

async function fetchBundlesMap(bundleIds: string[]) {
  const map = new Map<string, EnrichedStorefrontOrder["data_bundles"]>()
  if (bundleIds.length === 0) return map

  const db = getAdminClient()
  const unique = [...new Set(bundleIds.filter(Boolean))]
  const { data, error } = await db
    .from("data_bundles")
    .select("id, name, provider, size_gb, image_url")
    .in("id", unique)

  if (error) {
    console.error("fetchBundlesMap:", error)
    return map
  }

  for (const b of data || []) {
    map.set(b.id, b)
  }
  return map
}

async function fetchAgentsMap(agentIds: string[]) {
  const map = new Map<string, EnrichedStorefrontOrder["agents"]>()
  if (agentIds.length === 0) return map

  const db = getAdminClient()
  const unique = [...new Set(agentIds.filter(Boolean))]
  const { data, error } = await db.from("agents").select("id, full_name, phone_number").in("id", unique)

  if (error) {
    console.error("fetchAgentsMap:", error)
    return map
  }

  for (const a of data || []) {
    map.set(a.id, a)
  }
  return map
}

export interface OrdersQueryOptions {
  agentId?: string
  includeAgents?: boolean
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedOrdersResult {
  orders: EnrichedStorefrontOrder[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Fetch orders with pagination and optional status filter. */
export async function fetchEnrichedStorefrontOrders(
  options?: OrdersQueryOptions,
): Promise<PaginatedOrdersResult> {
  const db = getAdminClient()
  const page = Math.max(1, options?.page ?? 1)
  const limit = Math.min(50, Math.max(1, options?.limit ?? 20))
  const offset = (page - 1) * limit

  let query = db
    .from("storefront_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (options?.agentId) {
    query = query.eq("agent_id", options.agentId)
  }
  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  const search = (options?.search || "").trim()
  if (search) {
    const agentIdsFromSearch: string[] = []
    const { data: matchingAgents } = await db
      .from("agents")
      .select("id")
      .or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    for (const a of matchingAgents || []) {
      agentIdsFromSearch.push(a.id)
    }

    const orParts = [`customer_phone.ilike.%${search}%`, `id.ilike.%${search}%`]
    if (agentIdsFromSearch.length > 0) {
      orParts.push(`agent_id.in.(${agentIdsFromSearch.join(",")})`)
    }
    query = query.or(orParts.join(","))
  }

  query = query.range(offset, offset + limit - 1)

  const { data: orders, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  const rows = (orders || []) as StorefrontOrderRow[]
  const bundleMap = await fetchBundlesMap(
    rows.map((o) => o.data_bundle_id).filter((id): id is string => Boolean(id)),
  )
  const agentMap = options?.includeAgents
    ? await fetchAgentsMap(rows.map((o) => o.agent_id))
    : new Map()

  const enriched = rows.map((o) => ({
    ...o,
    data_bundles: o.data_bundle_id ? bundleMap.get(o.data_bundle_id) ?? null : null,
    agents: options?.includeAgents ? agentMap.get(o.agent_id) ?? null : undefined,
  }))

  const total = count ?? 0
  return {
    orders: enriched,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}
