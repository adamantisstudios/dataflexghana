import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Base Supabase client without session management
 * This breaks the circular dependency
 */
let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTQxNjksImV4cCI6MjA2NjA5MDE2OX0.zN_EzOp_PfwjzOReP9CjSWZMG5hhffqPOeutYJNw2i0"

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  
  return supabaseClient
}

// Export the base client for backward compatibility
export const supabase = getSupabaseClient()
