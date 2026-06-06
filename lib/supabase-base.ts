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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  // Always create new instance for server operations (not singleton)
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
