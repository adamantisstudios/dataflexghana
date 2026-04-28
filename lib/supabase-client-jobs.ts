import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * ⚠️ Jobs Supabase is a SEPARATE instance (different project)
 * This is intentional - NOT a duplication of the main app client
 * Only the MAIN app client uses the singleton pattern
 */

declare global {
  var __supabase_jobs__: SupabaseClient | undefined
}

function getSupabaseJobsClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_JOBS_SUPABASE_URL || "https://zgcpzvuwacdwzgjtwkkd.supabase.co"
  const anonKey =
    process.env.NEXT_PUBLIC_JOBS_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY3B6dnV3YWNkd3pnanR3a2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzM2MzUsImV4cCI6MjA3ODIwOTYzNX0.uUvS3pwlCDKUk9c97M-M_kfCtFkaJgsNlaQ45uvNN00"

  if (!url || !anonKey) {
    console.error("[v0] Jobs Supabase client: Missing credentials")
    return null
  }

  // Singleton for jobs client too (separate from main app)
  if (globalThis.__supabase_jobs__) {
    return globalThis.__supabase_jobs__
  }

  const client = createClient(url, anonKey)
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__supabase_jobs__ = client
  }
  return client
}

export const supabaseJobs = {
  from: (table: string) => {
    const client = getSupabaseJobsClient()
    if (!client) throw new Error("Jobs Supabase client not initialized")
    return client.from(table)
  },
  on: (event: string, table: string, callback: (payload: any) => void) => {
    const client = getSupabaseJobsClient()
    if (!client) throw new Error("Jobs Supabase client not initialized")
    return client
      .channel(`${table}_${event}`)
      .on("postgres_changes", { event: event as any, schema: "public", table: table }, callback)
      .subscribe()
  },
  getClient: () => {
    const client = getSupabaseJobsClient()
    if (!client) throw new Error("Jobs Supabase client not initialized")
    return client
  },
}
