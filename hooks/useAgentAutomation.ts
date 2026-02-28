"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

// Service role operations should only happen server-side via API routes

interface AutomationStats {
  total_runs: number
  successful_runs: number
  failed_runs: number
  total_agents_processed: number
  total_agents_deactivated: number
  avg_execution_time_ms: number
  last_run_at: string | null
  next_recommended_run: string | null
}

interface AgentAtRisk {
  agent_id: string
  agent_name: string
  phone_number: string
  last_activity_at: string
  days_since_activity: number
  orders_7d: number
  orders_30d: number
  risk_level: string
  risk_reason: string
}

const DEFAULT_AUTOMATION_STATS: AutomationStats = {
  total_runs: 0,
  successful_runs: 0,
  failed_runs: 0,
  total_agents_processed: 0,
  total_agents_deactivated: 0,
  avg_execution_time_ms: 0,
  last_run_at: null,
  next_recommended_run: null,
}

export function useAgentAutomation() {
  const [loading, setLoading] = useState(false)
  const [automationStats, setAutomationStats] = useState<AutomationStats | null>(null)
  const [agentsAtRisk, setAgentsAtRisk] = useState<AgentAtRisk[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchAutomationStats = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch("/api/admin/automation/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setAutomationStats(result.stats || DEFAULT_AUTOMATION_STATS)
      } else {
        throw new Error(result.error || "Failed to fetch automation stats")
      }
    } catch (error) {
      console.error("Error fetching automation stats:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to fetch automation statistics: ${errorMessage}`)

      if (!errorMessage.includes("connection") && !errorMessage.includes("not found")) {
        toast.error(`Failed to fetch automation statistics: ${errorMessage}`)
      }

      setAutomationStats(DEFAULT_AUTOMATION_STATS)
    }
  }, [])

  const fetchAgentsAtRisk = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch("/api/admin/automation/agents-at-risk", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setAgentsAtRisk(result.agents || [])
      } else {
        throw new Error(result.error || "Failed to fetch agents at risk")
      }
    } catch (error) {
      console.error("Error fetching agents at risk:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to fetch agents at risk: ${errorMessage}`)

      if (!errorMessage.includes("connection") && !errorMessage.includes("not found")) {
        toast.error(`Failed to fetch agents at risk: ${errorMessage}`)
      }

      setAgentsAtRisk([])
    }
  }, [])

  const runAutomation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/automation/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          run_type: "manual",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || "Automation process completed successfully")

        // Refresh data
        try {
          await fetchAutomationStats()
          await fetchAgentsAtRisk()
        } catch (refreshError) {
          console.warn("Failed to refresh data after automation:", refreshError)
        }

        return result
      } else {
        throw new Error(result.error || "Automation failed")
      }
    } catch (error) {
      console.error("Error running automation:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Error running automation: ${errorMessage}`)
      toast.error(`Error running automation: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
        message: "Automation failed to complete",
        processed_agents: 0,
        deactivated_agents: 0,
      }
    } finally {
      setLoading(false)
    }
  }, [fetchAutomationStats, fetchAgentsAtRisk])

  const reactivateAgent = useCallback(
    async (agentId: string, adminNotes: string) => {
      if (!agentId) {
        const errorMsg = "Agent ID is required for reactivation"
        setError(errorMsg)
        toast.error(errorMsg)
        throw new Error(errorMsg)
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/automation/reactivate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            admin_notes: adminNotes || `Manually reactivated by admin on ${new Date().toISOString()}`,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success) {
          toast.success("Agent has been reactivated successfully")

          try {
            await fetchAgentsAtRisk()
          } catch (refreshError) {
            console.warn("Failed to refresh agents at risk after reactivation:", refreshError)
          }

          return result.data
        } else {
          throw new Error(result.error || "Failed to reactivate agent")
        }
      } catch (error) {
        console.error("Error reactivating agent:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        setError(`Failed to reactivate agent: ${errorMessage}`)
        toast.error(`Failed to reactivate agent: ${errorMessage}`)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [fetchAgentsAtRisk],
  )

  const refreshData = useCallback(async () => {
    setError(null)
    try {
      await Promise.allSettled([fetchAutomationStats(), fetchAgentsAtRisk()])
    } catch (error) {
      console.error("Error refreshing data:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to refresh data: ${errorMessage}`)
    }
  }, [fetchAutomationStats, fetchAgentsAtRisk])

  return {
    loading,
    automationStats,
    agentsAtRisk,
    error,
    runAutomation,
    reactivateAgent,
    refreshData,
  }
}
