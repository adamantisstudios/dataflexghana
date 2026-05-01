import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import { adminCacheManager } from "@/lib/admin-cache-manager"

// Define proper types instead of any
interface AtRiskAgent {
  agent_id: string
  agent_name: string
  phone_number: string
  last_activity_at: string
  days_since_activity: number
  orders_7d: number
  orders_30d: number
  risk_level: "HIGH" | "MEDIUM" | "LOW"
  risk_reason: string
}

interface DashboardData {
  agents: Agent[]
  stats: { last_run_id: string | null } | null  // Simplified stats object
  atRisk: AtRiskAgent[]
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
      // 1. Fetch agents
      const { data: agents, error: agentsError } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (agentsError) throw agentsError

      // 2. Fetch automation stats - use maybeSingle() to avoid error when no rows
      const { data: statsData } = await supabase
        .from("agent_automation_logs")
        .select("id")
        .eq("run_type", "scheduled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()  // Changed from .single()

      // 3. Fetch at-risk agents (inactive >7 days)
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: atRiskData } = await supabase
        .from("agents")
        .select("id, full_name, phone_number, last_activity_at, data_orders_count_7d, data_orders_count_30d")
        .lt("last_activity_at", cutoffDate)
        .limit(10)

      // Map to strongly typed AtRiskAgent[]
      const atRisk: AtRiskAgent[] = (atRiskData || []).map((agent) => {
        const lastActivity = agent.last_activity_at ? new Date(agent.last_activity_at) : null
        const daysSinceActivity = lastActivity
          ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        const orders7d = agent.data_orders_count_7d || 0
        const orders30d = agent.data_orders_count_30d || 0

        let riskLevel: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM"
        let riskReason = ""

        if (orders7d === 0 && daysSinceActivity > 14) {
          riskLevel = "HIGH"
          riskReason = "No orders and inactive for over 2 weeks"
        } else if (orders7d === 0) {
          riskLevel = "HIGH"
          riskReason = "No orders in last 7 days"
        } else if (daysSinceActivity > 7) {
          riskLevel = "MEDIUM"
          riskReason = `Inactive for ${daysSinceActivity} days`
        } else {
          riskLevel = "LOW"
          riskReason = "Low activity"
        }

        return {
          agent_id: agent.id,
          agent_name: agent.full_name,
          phone_number: agent.phone_number,
          last_activity_at: agent.last_activity_at,
          days_since_activity: daysSinceActivity,
          orders_7d: orders7d,
          orders_30d: orders30d,
          risk_level: riskLevel,
          risk_reason: riskReason,
        }
      })

      return {
        agents: agents || [],
        stats: statsData ? { last_run_id: statsData.id } : null,
        atRisk,
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