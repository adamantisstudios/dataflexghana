import type { SupabaseClient } from "@supabase/supabase-js"
import { generateJobSlug, isJobUuid } from "@/lib/jobs-utils"

/**
 * Resolve a job by UUID or legacy title slug (from /job-details/[segment] URLs).
 */
export async function resolveJobBySegment(
  supabase: SupabaseClient,
  segment: string,
): Promise<{ job: Record<string, unknown> | null; error: string | null }> {
  const trimmed = segment?.trim()
  if (!trimmed) {
    return { job: null, error: "Missing job id" }
  }

  if (isJobUuid(trimmed)) {
    const { data, error } = await supabase.from("jobs").select("*").eq("id", trimmed).maybeSingle()
    if (error) {
      console.error(`[jobs-resolve] uuid lookup error:`, error)
      return { job: null, error: error.message }
    }
    return { job: data as Record<string, unknown> | null, error: null }
  }

  const slug = trimmed.toLowerCase()
  const { data: rows, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("[jobs-resolve] slug scan error:", error)
    return { job: null, error: error.message }
  }

  const match = (rows || []).find((row) => {
    const title = String((row as { job_title?: string }).job_title || "")
    return generateJobSlug(title) === slug
  })

  if (!match) {
    return { job: null, error: null }
  }

  return { job: match as Record<string, unknown>, error: null }
}
