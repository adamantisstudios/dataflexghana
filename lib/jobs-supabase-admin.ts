import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let jobsAdminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client for the external jobs database (HR postings).
 * Uses JOBS_SUPABASE_SERVICE_ROLE_KEY when set, otherwise the jobs anon key.
 */
export function getJobsSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getJobsSupabaseAdmin() is server-only");
  }

  const url =
    process.env.JOBS_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_JOBS_SUPABASE_URL;
  const serviceKey =
    process.env.JOBS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.JOBS_SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_JOBS_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing jobs database config: set NEXT_PUBLIC_JOBS_SUPABASE_URL and JOBS_SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_JOBS_SUPABASE_ANON_KEY)"
    );
  }

  if (!jobsAdminClient) {
    jobsAdminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return jobsAdminClient;
}
