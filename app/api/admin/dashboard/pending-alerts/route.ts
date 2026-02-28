import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              console.error("Error setting cookies:", error)
            }
          },
        },
      },
    )

    // Fetch all pending counts in parallel
    const [
      newAgentsData,
      pendingOrdersData,
      pendingBulkOrdersData,
      pendingAFAData,
      pendingComplianceData,
      pendingPropertiesData,
      pendingReferralsData,
      pendingPayoutsData,
      pendingDomesticWorkerRequestsData,
      pendingWalletTopupsData,
      pendingProfessionalWritingData,
      pendingInvitationsData,
      pendingDomesticWorkersData,
    ] = await Promise.all([
      // 1. New agents pending approval (within last day)
      supabase
        .from("agents")
        .select("id", { count: "exact" })
        .eq("isapproved", false)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // 2. Pending data orders
      supabase
        .from("data_orders")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 3. Pending bulk orders
      supabase
        .from("bulk_orders")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 4. Pending AFA registrations
      supabase
        .from("mtnafa_registrations")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 5. Pending compliance requests
      supabase
        .from("form_submissions")
        .select("id", { count: "exact" })
        .eq("status", "Pending"),

      // 6. Pending property requests
      supabase
        .from("property_requests")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 7. Pending referrals
      supabase
        .from("referrals")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 8. Pending payouts
      supabase
        .from("withdrawals")
        .select("id", { count: "exact" })
        .in("status", ["pending", "requested"]),

      // 9. Pending domestic worker client requests
      supabase
        .from("domestic_worker_requests")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 10. Pending wallet top-ups
      supabase
        .from("wallet_topup_requests")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 11. Pending professional writing requests
      supabase
        .from("professional_writing_submissions")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 12. Pending invitations
      supabase
        .from("invitations")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 13. Pending domestic worker registrations
      supabase
        .from("domestic_workers")
        .select("id", { count: "exact" })
        .eq("approval_status", "pending"),
    ])

    // Extract counts from responses
    const alerts = {
      newAgents: newAgentsData.count || 0,
      pendingDataOrders: pendingOrdersData.count || 0,
      pendingBulkOrders: pendingBulkOrdersData.count || 0,
      pendingAFA: pendingAFAData.count || 0,
      pendingCompliance: pendingComplianceData.count || 0,
      pendingProperties: pendingPropertiesData.count || 0,
      pendingReferrals: pendingReferralsData.count || 0,
      pendingPayouts: pendingPayoutsData.count || 0,
      pendingDomesticWorkerRequests: pendingDomesticWorkerRequestsData.count || 0,
      pendingWalletTopups: pendingWalletTopupsData.count || 0,
      pendingProfessionalWriting: pendingProfessionalWritingData.count || 0,
      pendingInvitations: pendingInvitationsData.count || 0,
      pendingDomesticWorkers: pendingDomesticWorkersData.count || 0,
      totalAlerts:
        (newAgentsData.count || 0) +
        (pendingOrdersData.count || 0) +
        (pendingBulkOrdersData.count || 0) +
        (pendingAFAData.count || 0) +
        (pendingComplianceData.count || 0) +
        (pendingPropertiesData.count || 0) +
        (pendingReferralsData.count || 0) +
        (pendingPayoutsData.count || 0) +
        (pendingDomesticWorkerRequestsData.count || 0) +
        (pendingWalletTopupsData.count || 0) +
        (pendingProfessionalWritingData.count || 0) +
        (pendingInvitationsData.count || 0) +
        (pendingDomesticWorkersData.count || 0),
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error("Error fetching pending alerts:", error)
    return NextResponse.json({ error: "Failed to fetch pending alerts" }, { status: 500 })
  }
}
