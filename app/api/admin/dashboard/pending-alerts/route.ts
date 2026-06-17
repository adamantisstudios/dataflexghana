import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

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
      pendingLegacyWalletTopupsData,
      pendingProfessionalWritingData,
      pendingInvitationsData,
      pendingDomesticWorkersData,
    ] = await Promise.all([
      supabase
        .from("agents")
        .select("id", { count: "exact" })
        .eq("isapproved", false)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      supabase.from("data_orders").select("id", { count: "exact" }).eq("status", "pending"),

      supabase
        .from("bulk_orders")
        .select("id", { count: "exact" })
        .in("status", ["pending", "pending_admin_review"]),

      supabase
        .from("mtnafa_registrations")
        .select("id", { count: "exact" })
        .in("status", ["pending", "pending_admin_review"]),

      supabase.from("form_submissions").select("id", { count: "exact" }).eq("status", "Pending"),

      supabase.from("property_requests").select("id", { count: "exact" }).eq("status", "pending"),

      supabase.from("referrals").select("id", { count: "exact" }).eq("status", "pending"),

      supabase
        .from("withdrawals")
        .select("id", { count: "exact" })
        .in("status", ["pending", "requested"]),

      supabase.from("domestic_worker_requests").select("id", { count: "exact" }).eq("status", "pending"),

      supabase.from("wallet_topups").select("id", { count: "exact" }).eq("status", "pending"),

      supabase
        .from("wallet_transactions")
        .select("id", { count: "exact" })
        .eq("status", "pending")
        .eq("transaction_type", "topup"),

      supabase
        .from("professional_writing_submissions")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      supabase.from("invitations").select("id", { count: "exact" }).eq("status", "pending"),

      supabase.from("domestic_workers").select("id", { count: "exact" }).eq("approval_status", "pending"),
    ])

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
      pendingWalletTopups:
        (pendingWalletTopupsData.count || 0) + (pendingLegacyWalletTopupsData.count || 0),
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
        (pendingLegacyWalletTopupsData.count || 0) +
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
