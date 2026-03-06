import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * SINGLETON CLIENT PATTERN - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️ CRITICAL: This module ensures ONLY ONE browser client instance exists.
 * Multiple createClient() calls = Multiple GoTrueClient instances = WARNING
 * 
 * Usage:
 * - Browser/Client code: Import { supabase } from './supabase-base' 
 * - Server-side: Use getAdminClient() which is created PER REQUEST (not singleton)
 */

// Global singleton for browser client - prevents HMR duplicates
declare global {
  var __supabase_browser__: SupabaseClient | undefined
}

/**
 * Get the singleton browser client (ONLY ONE instance)
 * Uses global to survive HMR and prevent multiple GoTrueClient instances
 */
function getBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTQxNjksImV4cCI6MjA2NjA5MDE2OX0.zN_EzOp_PfwjzOReP9CjSWZMG5hhffqPOeutYJNw2i0"

  // Return existing instance if available
  if (globalThis.__supabase_browser__) {
    return globalThis.__supabase_browser__
  }

  // Create new instance only if it doesn't exist
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

  // Store in global for HMR safety
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__supabase_browser__ = supabaseClient
  }

  return supabaseClient
}

/**
 * Export the singleton browser client
 * This MUST be imported by all browser/client code instead of creating new clients
 */
export const supabase = getBrowserClient()

/**
 * Get the singleton browser client via function (legacy support)
 */
export function getSupabaseClient(): SupabaseClient {
  return supabase
}

/**
 * Get admin client (SERVER-SIDE ONLY)
 * Creates a NEW instance per request - NOT a singleton
 * NEVER expose service role key to client
 */
export function getAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("[Supabase] Admin client can only be used on the server-side!")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNDE2OSwiZXhwIjoyMDY2MDkwMTY5fQ.Ypa9MilHbGjtrn7jjGwjMqXCycMZY1mHkj0mgWASbg0"

  // Always create new instance for server operations (not singleton)
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
