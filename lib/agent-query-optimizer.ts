import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import { adminCacheManager } from "@/lib/admin-cache-manager"

interface DashboardData {
  agents: Agent[]
  stats: any
  atRisk: any[]
}

export async function fetchAllDashboardData(limit = 100, offset = 0): Promise<DashboardData> {
  const cacheKey = `agents:dashboard:${limit}:${offset}`

  // Try to get from cache first
  const cached = adminCacheManager.get<DashboardData>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Deduplicate concurrent requests
    const data = await adminCacheManager.dedupRequest(cacheKey, async () => {
      // Fetch agents
      const { data: agents, error: agentsError } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (agentsError) throw agentsError

      // Fetch automation stats - simplified query
      const { data: statsData } = await supabase
        .from("agent_automation_logs")
        .select("id")
        .eq("run_type", "scheduled")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // Fetch at-risk agents - simplified query
      const { data: atRiskData } = await supabase
        .from("agents")
        .select("id, full_name, phone_number, last_activity_at, data_orders_count_7d, data_orders_count_30d")
        .lt("last_activity_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10)

      return {
        agents: agents || [],
        stats: statsData || null,
        atRisk: atRiskData
          ? atRiskData.map((agent: any) => ({
              agent_id: agent.id,
              agent_name: agent.full_name,
              phone_number: agent.phone_number,
              last_activity_at: agent.last_activity_at,
              days_since_activity: agent.last_activity_at
                ? Math.floor((Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
              orders_7d: agent.data_orders_count_7d || 0,
              orders_30d: agent.data_orders_count_30d || 0,
              risk_level: agent.data_orders_count_7d === 0 ? "HIGH" : "MEDIUM",
              risk_reason: agent.data_orders_count_7d === 0 ? "No orders in last 7 days" : "Low activity",
            }))
          : [],
      }
    })

    // Cache the result for 5 minutes
    adminCacheManager.set(cacheKey, data, 5 * 60 * 1000)

    return data
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    // Return empty data on error
    return {
      agents: [],
      stats: null,
      atRisk: [],
    }
  }
}
