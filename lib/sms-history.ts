import { supabase } from "@/lib/supabase"

export interface SmsLogWithAgent extends Record<string, any> {
  id: string
  agent_id: string
  phone_number: string
  message_content: string
  sent_at: string
  status: "success" | "failed"
  campaign_name?: string
  api_response?: string
  agent_name?: string
}

/**
 * Fetches all SMS logs for a specific agent
 */
export async function getAgentSmsHistory(agentId: string): Promise<SmsLogWithAgent[]> {
  try {
    const { data, error } = await supabase
      .from("sms_logs")
      .select("*")
      .eq("agent_id", agentId)
      .order("sent_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching agent SMS history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Failed to fetch agent SMS history:", error)
    return []
  }
}

/**
 * Fetches SMS logs with agent details
 */
export async function getSmsHistoryWithAgents(
  filters?: {
    campaignName?: string
    status?: "success" | "failed"
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<SmsLogWithAgent[]> {
  try {
    console.log("[v0] Fetching SMS history from database...")
    let query = supabase
      .from("sms_logs")
      .select("*")
      .order("sent_at", { ascending: false })

    if (filters?.campaignName) {
      query = query.eq("campaign_name", filters.campaignName)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.startDate) {
      query = query.gte("sent_at", filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte("sent_at", filters.endDate.toISOString())
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching SMS history from database:", error)
      return []
    }

    console.log("[v0] SMS logs fetched:", data?.length || 0, "records")

    if (!data || data.length === 0) {
      console.log("[v0] No SMS logs found in database")
      return []
    }

    // Fetch agent details for all agent IDs
    const agentIds = [...new Set(data.map((log: any) => log.agent_id))]
    console.log("[v0] Fetching details for", agentIds.length, "unique agents")
    
    const { data: agents, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name")
      .in("id", agentIds)

    if (agentError) {
      console.error("[v0] Error fetching agents:", agentError)
      return data.map((log: any) => ({
        ...log,
        agent_name: "Unknown Agent",
      }))
    }

    console.log("[v0] Agents fetched:", agents?.length || 0, "records")
    
    const agentMap = new Map((agents || []).map((a: any) => [a.id, a.full_name]))

    // Map agent names to logs
    const result = data.map((log: any) => ({
      ...log,
      agent_name: agentMap.get(log.agent_id) || "Unknown Agent",
    })) as SmsLogWithAgent[]
    
    console.log("[v0] SMS history with agent names returned:", result.length, "records")
    return result
  } catch (error) {
    console.error("[v0] Failed to fetch SMS history:", error)
    return []
  }
}

/**
 * Gets agents who have NOT received SMS
 */
export async function getAgentsWithoutSms(
  allAgents: any[],
  campaignName?: string
): Promise<string[]> {
  try {
    let query = supabase.from("sms_logs").select("agent_id", { count: "exact" })

    if (campaignName) {
      query = query.eq("campaign_name", campaignName)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching agents with SMS:", error)
      return allAgents.map((a) => a.id)
    }

    const agentIdsWithSms = new Set((data || []).map((log: any) => log.agent_id))
    return allAgents.filter((agent) => !agentIdsWithSms.has(agent.id)).map((a) => a.id)
  } catch (error) {
    console.error("[v0] Failed to get agents without SMS:", error)
    return allAgents.map((a) => a.id)
  }
}

/**
 * Gets last SMS date for an agent
 */
export async function getAgentLastSmsDate(agentId: string): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from("sms_logs")
      .select("sent_at")
      .eq("agent_id", agentId)
      .eq("status", "success")
      .order("sent_at", { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return null
    }

    return new Date(data[0].sent_at)
  } catch (error) {
    console.error("[v0] Failed to get agent last SMS date:", error)
    return null
  }
}

/**
 * Gets count of successful SMS sent to an agent
 */
export async function getAgentSmsSentCount(agentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("sms_logs")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("status", "success")

    if (error) {
      console.error("[v0] Error counting SMS:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("[v0] Failed to count SMS:", error)
    return 0
  }
}

/**
 * Gets available campaigns
 */
export async function getAvailableCampaigns(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("sms_logs")
      .select("campaign_name")
      .not("campaign_name", "is", null)
      .order("campaign_name")

    if (error) {
      console.error("[v0] Error fetching campaigns:", error)
      return []
    }

    // Get unique campaign names
    const campaigns = data?.map((log) => log.campaign_name) || []
    return [...new Set(campaigns)].filter(Boolean) as string[]
  } catch (error) {
    console.error("[v0] Failed to get campaigns:", error)
    return []
  }
}
