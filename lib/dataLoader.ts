import { supabase } from "@/lib/supabase"
import type { FormSubmission } from "@/lib/supabase"

/**
 * Load form submissions for a specific agent
 * Used by ComplianceTab to fetch form submission data
 */
export async function loadData(agentId: string): Promise<FormSubmission[]> {
  if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
    return []
  }

  try {
    const { data: submissionsData, error: submissionsError } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("agent_id", agentId)
      .order("submitted_at", { ascending: false })

    if (submissionsError) {
      console.error("[v0] Error loading form submissions:", submissionsError)
      throw submissionsError
    }

    return submissionsData || []
  } catch (error) {
    console.error("[v0] Error in loadData:", error)
    return []
  }
}
