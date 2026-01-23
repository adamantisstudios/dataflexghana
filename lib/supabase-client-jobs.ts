import { createClient } from "@supabase/supabase-js"

let supabaseJobsClient: ReturnType<typeof createClient> | null = null

export function getSupabaseJobsClient() {
  if (supabaseJobsClient) {
    return supabaseJobsClient
  }

  const url = process.env.NEXT_PUBLIC_JOBS_SUPABASE_URL || "https://zgcpzvuwacdwzgjtwkkd.supabase.co"
  const anonKey =
    process.env.NEXT_PUBLIC_JOBS_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY3B6dnV3YWNkd3pnanR3a2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzM2MzUsImV4cCI6MjA3ODIwOTYzNX0.uUvS3pwlCDKUk9c97M-M_kfCtFkaJgsNlaQ45uvNN00"

  if (!url || !anonKey) {
    console.error("[v0] Jobs Supabase client: Missing NEXT_PUBLIC_JOBS_SUPABASE_URL or NEXT_PUBLIC_JOBS_SUPABASE_ANON_KEY")
    return null
  }

  supabaseJobsClient = createClient(url, anonKey)
  return supabaseJobsClient
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
