import type { SupabaseClient } from "@supabase/supabase-js"

export type PendingOrderItem = {
  id: string
  type: string
  created_at: string
  customer_phone?: string | null
  agent_name: string
  product: string
  amount?: number | null
  href_tab: string
}

export type PendingOrdersCategoryKey =
  | "data_orders"
  | "storefront_orders"
  | "grocery_requests"
  | "ad_orders"
  | "influencer_orders"
  | "farm_orders"
  | "writing_orders"
  | "compliance_orders"
  | "form_submissions"
  | "withdrawals"
  | "bulk_orders"
  | "mtnafa_registrations"
  | "wholesale_orders"
  | "property_requests"
  | "referrals"
  | "wallet_topups"
  | "professional_writing_submissions"

export type PendingOrdersPayload = {
  data_orders: PendingOrderItem[]
  storefront_orders: PendingOrderItem[]
  grocery_requests: PendingOrderItem[]
  ad_orders: PendingOrderItem[]
  influencer_orders: PendingOrderItem[]
  farm_orders: PendingOrderItem[]
  writing_orders: PendingOrderItem[]
  compliance_orders: PendingOrderItem[]
  form_submissions: PendingOrderItem[]
  withdrawals: PendingOrderItem[]
  bulk_orders: PendingOrderItem[]
  mtnafa_registrations: PendingOrderItem[]
  wholesale_orders: PendingOrderItem[]
  property_requests: PendingOrderItem[]
  referrals: PendingOrderItem[]
  wallet_topups: PendingOrderItem[]
  professional_writing_submissions: PendingOrderItem[]
  counts: Record<PendingOrdersCategoryKey, number>
  total_pending: number
  unified: PendingOrderItem[]
}

type AgentRow = { full_name?: string | null; phone_number?: string | null } | null

function pickAgentName(agent: AgentRow | AgentRow[]) {
  const row = Array.isArray(agent) ? agent[0] : agent
  return row?.full_name?.trim() || row?.phone_number?.trim() || "Unknown agent"
}

function rel<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

const LIST_LIMIT = 20

async function countRows(
  db: SupabaseClient,
  table: string,
  filter: (q: ReturnType<SupabaseClient["from"]>) => ReturnType<SupabaseClient["from"]>,
): Promise<number> {
  let query = db.from(table).select("id", { count: "exact", head: true })
  query = filter(query) as typeof query
  const { count, error } = await query
  if (error) {
    console.error(`[pending-orders] count ${table}:`, error.message)
    return 0
  }
  return count ?? 0
}

export async function fetchPendingOrders(db: SupabaseClient): Promise<PendingOrdersPayload> {
  const [
    dataOrdersRes,
    storefrontOrdersRes,
    groceryRes,
    adOrdersRes,
    influencerOrdersRes,
    farmOrdersRes,
    writingOrdersRes,
    complianceOrdersRes,
    formSubmissionsRes,
    withdrawalsRes,
    bulkOrdersRes,
    mtnafaRes,
    wholesaleOrdersRes,
    propertyRequestsRes,
    referralsRes,
    walletTopupsRes,
    legacyWritingRes,
    countResults,
  ] = await Promise.all([
    db
      .from("data_orders")
      .select(
        `
        id, status, created_at, recipient_phone, agent_id, commission_amount,
        agents ( id, full_name, phone_number ),
        data_bundles!fk_data_orders_bundle_id ( name, provider, price )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("storefront_orders")
      .select(
        `
        id, status, created_at, customer_phone, agent_id, total_paid, item_title, order_type,
        agents ( id, full_name, phone_number )
      `,
      )
      .in("status", ["Pending", "pending"])
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("grocery_requests")
      .select("id, status, created_at, full_name, phone, whatsapp, estimated_price")
      .eq("status", "new_request")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

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
      .limit(LIST_LIMIT),

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
      .limit(LIST_LIMIT),

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
      .limit(LIST_LIMIT),

    db
      .from("writing_orders")
      .select(
        `
        id, status, created_at, agent_id, total_paid, customer_name, customer_phone,
        agents ( id, full_name, phone_number )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("storefront_compliance_submissions")
      .select(
        `
        id, status, created_at, agent_id, amount_paid, form_type, customer_data,
        agents ( id, full_name, phone_number )
      `,
      )
      .in("status", ["paid_pending_form", "pending", "Pending"])
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("form_submissions")
      .select(
        `
        id, status, created_at, agent_id, form_id,
        agents ( id, full_name, phone_number )
      `,
      )
      .eq("status", "Pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("withdrawals")
      .select(
        `
        id, status, created_at, agent_id, amount, momo_number,
        agents ( id, full_name, phone_number )
      `,
      )
      .in("status", ["pending", "requested"])
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("bulk_orders")
      .select(
        `
        id, status, created_at, agent_id, row_count, accepted_count,
        agents ( id, full_name, phone_number )
      `,
      )
      .in("status", ["pending", "pending_admin_review"])
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("mtnafa_registrations")
      .select(
        `
        id, status, created_at, agent_id, full_name, phone_number,
        agents ( id, full_name, phone_number )
      `,
      )
      .in("status", ["pending", "pending_admin_review"])
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("wholesale_orders")
      .select(
        `
        id, status, created_at, agent_id, total_amount, delivery_phone,
        agents ( id, full_name, phone_number ),
        wholesale_products ( name )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("property_requests")
      .select("id, status, created_at, client_name, client_phone, property_type")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("referrals")
      .select(
        `
        id, status, created_at, agent_id, client_name, client_phone,
        agents ( id, full_name, phone_number )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("wallet_topups")
      .select(
        `
        id, status, created_at, agent_id, amount,
        agents ( id, full_name, phone_number )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    db
      .from("professional_writing_submissions")
      .select(
        `
        id, status, created_at, agent_id, service_type, client_name,
        agents ( id, full_name, phone_number )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),

    Promise.all([
      countRows(db, "data_orders", (q) => q.eq("status", "pending")),
      countRows(db, "storefront_orders", (q) => q.in("status", ["Pending", "pending"])),
      countRows(db, "grocery_requests", (q) => q.eq("status", "new_request")),
      countRows(db, "ad_orders", (q) => q.eq("status", "pending")),
      countRows(db, "influencer_orders", (q) => q.eq("status", "pending")),
      countRows(db, "farm_orders", (q) => q.eq("status", "pending")),
      countRows(db, "writing_orders", (q) => q.eq("status", "pending")),
      countRows(db, "storefront_compliance_submissions", (q) =>
        q.in("status", ["paid_pending_form", "pending", "Pending"]),
      ),
      countRows(db, "form_submissions", (q) => q.eq("status", "Pending")),
      countRows(db, "withdrawals", (q) => q.in("status", ["pending", "requested"])),
      countRows(db, "bulk_orders", (q) => q.in("status", ["pending", "pending_admin_review"])),
      countRows(db, "mtnafa_registrations", (q) => q.in("status", ["pending", "pending_admin_review"])),
      countRows(db, "wholesale_orders", (q) => q.eq("status", "pending")),
      countRows(db, "property_requests", (q) => q.eq("status", "pending")),
      countRows(db, "referrals", (q) => q.eq("status", "pending")),
      countRows(db, "wallet_topups", (q) => q.eq("status", "pending")),
      countRows(db, "professional_writing_submissions", (q) => q.eq("status", "pending")),
    ]),
  ])

  const queryErrors = [
    dataOrdersRes.error,
    storefrontOrdersRes.error,
    groceryRes.error,
    adOrdersRes.error,
    influencerOrdersRes.error,
    farmOrdersRes.error,
    writingOrdersRes.error,
    complianceOrdersRes.error,
    formSubmissionsRes.error,
    withdrawalsRes.error,
    bulkOrdersRes.error,
    mtnafaRes.error,
    wholesaleOrdersRes.error,
    propertyRequestsRes.error,
    referralsRes.error,
    walletTopupsRes.error,
    legacyWritingRes.error,
  ].filter(Boolean)

  if (queryErrors.length > 0) {
    console.error("[pending-orders] query errors:", queryErrors.map((e) => e?.message))
  }

  const data_orders: PendingOrderItem[] = (dataOrdersRes.data || []).map((o) => {
    const bundle = rel(o.data_bundles)
    return {
      id: o.id,
      type: "data_order",
      created_at: o.created_at,
      customer_phone: o.recipient_phone,
      agent_name: pickAgentName(o.agents),
      product: bundle?.name || bundle?.provider || "Data bundle",
      amount: bundle?.price ?? o.commission_amount,
      href_tab: "orders",
    }
  })

  const storefront_orders: PendingOrderItem[] = (storefrontOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "storefront_order",
    created_at: o.created_at,
    customer_phone: o.customer_phone,
    agent_name: pickAgentName(o.agents),
    product: o.item_title || o.order_type || "Storefront order",
    amount: o.total_paid,
    href_tab: "storefront-manager",
  }))

  const grocery_requests: PendingOrderItem[] = (groceryRes.data || []).map((g) => ({
    id: g.id,
    type: "grocery_request",
    created_at: g.created_at,
    customer_phone: g.phone || g.whatsapp,
    agent_name: g.full_name || "Customer",
    product: "Grocery request",
    amount: g.estimated_price,
    href_tab: "grocery-requests",
  }))

  const ad_orders: PendingOrderItem[] = (adOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "ad_order",
    created_at: o.created_at,
    customer_phone: o.customer_phone,
    agent_name: pickAgentName(o.agents),
    product: o.customer_name ? `Ad: ${o.customer_name}` : "Advertising order",
    amount: o.total_paid,
    href_tab: "advertising",
  }))

  const influencer_orders: PendingOrderItem[] = (influencerOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "influencer_order",
    created_at: o.created_at,
    agent_name: pickAgentName(o.agents),
    product: o.client_name
      ? `Influencer: ${o.client_name}`
      : rel(o.package)?.title || "Influencer package",
    amount: o.total_price,
    href_tab: "micro-influencers",
  }))

  const farm_orders: PendingOrderItem[] = (farmOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "farm_order",
    created_at: o.created_at,
    customer_phone: o.buyer_phone,
    agent_name: pickAgentName(o.agents),
    product: o.buyer_name ? `Farm: ${o.buyer_name}` : "Farm order",
    amount: o.total_price,
    href_tab: "farmers-friend",
  }))

  const writing_orders: PendingOrderItem[] = (writingOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "writing_order",
    created_at: o.created_at,
    customer_phone: o.customer_phone,
    agent_name: pickAgentName(o.agents),
    product: o.customer_name ? `Writing: ${o.customer_name}` : "Writing order",
    amount: o.total_paid,
    href_tab: "professional-writing",
  }))

  const compliance_orders: PendingOrderItem[] = (complianceOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "compliance_order",
    created_at: o.created_at,
    customer_phone:
      (o.customer_data && typeof o.customer_data === "object"
        ? (o.customer_data as Record<string, unknown>).phone
        : null) || null,
    agent_name: pickAgentName(o.agents),
    product: `Compliance: ${String(o.form_type || "submission").replace(/_/g, " ")}`,
    amount: o.amount_paid,
    href_tab: "compliance",
  }))

  const form_submissions: PendingOrderItem[] = (formSubmissionsRes.data || []).map((o) => ({
    id: o.id,
    type: "form_submission",
    created_at: o.created_at,
    agent_name: pickAgentName(o.agents),
    product: `Compliance form: ${String(o.form_id || "submission").replace(/_/g, " ")}`,
    href_tab: "compliance",
  }))

  const withdrawals: PendingOrderItem[] = (withdrawalsRes.data || []).map((w) => ({
    id: w.id,
    type: "withdrawal",
    created_at: w.created_at,
    customer_phone: w.momo_number,
    agent_name: pickAgentName(w.agents),
    product: "Withdrawal request",
    amount: w.amount,
    href_tab: "payouts",
  }))

  const bulk_orders: PendingOrderItem[] = (bulkOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "bulk_order",
    created_at: o.created_at,
    agent_name: pickAgentName(o.agents),
    product: `Bulk order (${o.accepted_count ?? o.row_count ?? 0} items)`,
    href_tab: "bulk-orders",
  }))

  const mtnafa_registrations: PendingOrderItem[] = (mtnafaRes.data || []).map((o) => ({
    id: o.id,
    type: "mtnafa_registration",
    created_at: o.created_at,
    customer_phone: o.phone_number,
    agent_name: pickAgentName(o.agents) !== "Unknown agent" ? pickAgentName(o.agents) : o.full_name,
    product: "MTN AFA registration",
    href_tab: "bulk-orders",
  }))

  const wholesale_orders: PendingOrderItem[] = (wholesaleOrdersRes.data || []).map((o) => ({
    id: o.id,
    type: "wholesale_order",
    created_at: o.created_at,
    customer_phone: o.delivery_phone,
    agent_name: pickAgentName(o.agents),
    product: rel(o.wholesale_products)?.name || "Wholesale order",
    amount: o.total_amount,
    href_tab: "wholesale",
  }))

  const property_requests: PendingOrderItem[] = (propertyRequestsRes.data || []).map((o) => ({
    id: o.id,
    type: "property_request",
    created_at: o.created_at,
    customer_phone: o.client_phone,
    agent_name: o.client_name || "Client",
    product: o.property_type ? `Property: ${o.property_type}` : "Property request",
    href_tab: "properties",
  }))

  const referrals: PendingOrderItem[] = (referralsRes.data || []).map((o) => ({
    id: o.id,
    type: "referral",
    created_at: o.created_at,
    customer_phone: o.client_phone,
    agent_name: pickAgentName(o.agents),
    product: o.client_name ? `Referral: ${o.client_name}` : "Referral request",
    href_tab: "referrals",
  }))

  const wallet_topups: PendingOrderItem[] = (walletTopupsRes.data || []).map((o) => ({
    id: o.id,
    type: "wallet_topup",
    created_at: o.created_at,
    agent_name: pickAgentName(o.agents),
    product: "Wallet top-up request",
    amount: o.amount,
    href_tab: "wallets",
  }))

  const professional_writing_submissions: PendingOrderItem[] = (legacyWritingRes.data || []).map((o) => ({
    id: o.id,
    type: "professional_writing_submission",
    created_at: o.created_at,
    agent_name: pickAgentName(o.agents),
    product: o.service_type
      ? `Writing (legacy): ${String(o.service_type).replace(/_/g, " ")}`
      : "Writing submission (legacy)",
    href_tab: "professional-writing",
  }))

  const counts: PendingOrdersPayload["counts"] = {
    data_orders: countResults[0],
    storefront_orders: countResults[1],
    grocery_requests: countResults[2],
    ad_orders: countResults[3],
    influencer_orders: countResults[4],
    farm_orders: countResults[5],
    writing_orders: countResults[6],
    compliance_orders: countResults[7],
    form_submissions: countResults[8],
    withdrawals: countResults[9],
    bulk_orders: countResults[10],
    mtnafa_registrations: countResults[11],
    wholesale_orders: countResults[12],
    property_requests: countResults[13],
    referrals: countResults[14],
    wallet_topups: countResults[15],
    professional_writing_submissions: countResults[16],
  }

  const unified = [
    ...data_orders,
    ...storefront_orders,
    ...grocery_requests,
    ...ad_orders,
    ...influencer_orders,
    ...farm_orders,
    ...writing_orders,
    ...compliance_orders,
    ...form_submissions,
    ...withdrawals,
    ...bulk_orders,
    ...mtnafa_registrations,
    ...wholesale_orders,
    ...property_requests,
    ...referrals,
    ...wallet_topups,
    ...professional_writing_submissions,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const total_pending = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return {
    data_orders,
    storefront_orders,
    grocery_requests,
    ad_orders,
    influencer_orders,
    farm_orders,
    writing_orders,
    compliance_orders,
    form_submissions,
    withdrawals,
    bulk_orders,
    mtnafa_registrations,
    wholesale_orders,
    property_requests,
    referrals,
    wallet_topups,
    professional_writing_submissions,
    counts,
    total_pending,
    unified,
  }
}
