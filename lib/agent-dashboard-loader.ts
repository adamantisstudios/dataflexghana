import { supabase } from "@/lib/supabase"
import { supabaseJobs } from "@/lib/supabase-client-jobs"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"

export interface AgentDashboardData {
  commissionSummary: any
  agentData: any
  referralsData: any[]
  dataOrdersData: any[]
  wholesaleOrdersData: any[]
  withdrawalsData: any[]
  paidWithdrawalsData: any[]
}

export async function loadAgentDashboardData(agentId: string): Promise<AgentDashboardData> {
  try {
    // Parallel fetch all required data
    const [
      commissionSummary,
      agentData,
      referralsData,
      dataOrdersData,
      wholesaleOrdersData,
      withdrawalsData,
      paidWithdrawalsData,
    ] = await Promise.all([
      getAgentCommissionSummary(agentId),
      supabase.from("agents").select("wallet_balance").eq("id", agentId).single(),
      supabase
        .from("referrals")
        .select(`*, services (title, commission_amount)`)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("data_orders")
        .select(`*, data_bundles!fk_data_orders_bundle_id (name, provider, size_gb)`)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("wholesale_orders")
        .select(`*, wholesale_products (name, price)`)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .order("requested_at", { ascending: false })
        .limit(5),
      supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(10),
    ])

    return {
      commissionSummary,
      agentData: agentData.data,
      referralsData: referralsData.data || [],
      dataOrdersData: dataOrdersData.data || [],
      wholesaleOrdersData: wholesaleOrdersData.data || [],
      withdrawalsData: withdrawalsData.data || [],
      paidWithdrawalsData: paidWithdrawalsData.data || [],
    }
  } catch (error) {
    console.error("Error loading agent dashboard data:", error)
    throw error
  }
}

export async function loadTabData(tabName: string, agentId: string): Promise<any> {
  try {
    switch (tabName) {
      case "services":
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("service_type", "referral")
          .order("created_at", { ascending: false })
        return { services: servicesData || [] }

      case "data-bundles":
        const [dataBundlesResult, dataOrdersResult] = await Promise.all([
          supabase.from("data_bundles").select("*").eq("is_active", true).order("provider", { ascending: true }),
          supabase
            .from("data_orders")
            .select(`*, data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price)`)
            .eq("agent_id", agentId)
            .order("created_at", { ascending: false }),
        ])
        return {
          dataBundles: dataBundlesResult.data || [],
          dataOrders: dataOrdersResult.data || [],
        }

      case "referrals":
        const { data: referralsData } = await supabase
          .from("referrals")
          .select(`*, services (title, commission_amount)`)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
        return referralsData || []

      case "withdrawals":
        const { data: withdrawalsData } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("agent_id", agentId)
          .order("requested_at", { ascending: false })
        return withdrawalsData || []

      case "jobs":
        const { data: jobsData, error: jobsError } = await supabaseJobs
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (jobsError) {
          console.error("Error loading jobs:", jobsError)
          return []
        }
        return jobsData || []

      case "courses":
        const { data: coursesData, error: coursesError } = await supabase
          .from("online_courses")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (coursesError) {
          console.error("Error loading courses:", coursesError)
          return { courses: [] }
        }
        return { courses: coursesData || [] }

      case "paid-commissions":
        const { data: paidWithdrawalsData } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("agent_id", agentId)
          .eq("status", "paid")
          .order("paid_at", { ascending: false })
          .limit(10)
        return paidWithdrawalsData || []

      default:
        return null
    }
  } catch (error) {
    console.error(`Error loading ${tabName} data:`, error)
    throw error
  }
}
