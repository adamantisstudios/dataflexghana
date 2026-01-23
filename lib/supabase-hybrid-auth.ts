/**
 * Unified Supabase Client - CRITICAL FIX FOR MULTIPLE GOTRUECLIENT INSTANCES
 *
 * This client consolidates all Supabase operations into a single singleton instance
 * to prevent "Multiple GoTrueClient instances detected" warning.
 *
 * Configuration:
 * 1. Uses a single unified storage prefix to prevent conflicts
 * 2. Maintains session persistence for RLS policies with auth.uid()
 * 3. Handles both regular and admin operations
 * 4. Provides convenience exports for backward compatibility
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTQxNjksImV4cCI6MjA2NjA5MDE2OX0.zN_EzOp_PfwjzOReP9CjSWZMG5hhffqPOeutYJNw2i0"

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseUnifiedInstance: SupabaseClient | null = null

function createSupabaseUnifiedClient(): SupabaseClient {
  if (supabaseUnifiedInstance) {
    return supabaseUnifiedInstance
  }

  supabaseUnifiedInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // CRITICAL: Enable session persistence for RLS policies
      persistSession: true,
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Detect session in URL for OAuth flows
      detectSessionInUrl: true,
      // Use unified storage namespace to prevent conflicts
      storage: {
        getItem: (key: string) => {
          if (typeof window === "undefined") return null
          return localStorage.getItem(`supabase.${key}`)
        },
        setItem: (key: string, value: string) => {
          if (typeof window === "undefined") return
          localStorage.setItem(`supabase.${key}`, value)
        },
        removeItem: (key: string) => {
          if (typeof window === "undefined") return
          localStorage.removeItem(`supabase.${key}`)
        },
      },
    },
    global: {
      headers: {
        "X-Client-Info": "dataflex-unified-client",
      },
    },
  })

  return supabaseUnifiedInstance
}

export const supabaseHybridAuth: SupabaseClient = createSupabaseUnifiedClient()
export const supabase: SupabaseClient = supabaseHybridAuth

// This is separate because it uses different credentials
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "dataflex-admin-client",
        },
      },
    })
  : null

/**
 * Get current Supabase Auth user
 */
export async function getCurrentSupabaseUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabaseHybridAuth.auth.getUser()
    if (error) {
      console.error("Error getting Supabase user:", error)
      return null
    }
    return user
  } catch (error) {
    console.error("Error in getCurrentSupabaseUser:", error)
    return null
  }
}

/**
 * Sign in with email/password to establish Supabase Auth session
 */
export async function signInWithSupabaseAuth(email: string, password: string) {
  try {
    console.log("🔐 Attempting Supabase Auth signIn for:", email)

    const { data, error } = await supabaseHybridAuth.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    })

    if (error) {
      console.error("❌ Supabase Auth signIn error:", error)
      return { success: false, error: error.message, user: null }
    }

    if (data.user) {
      console.log("✅ Supabase Auth signIn successful! User ID:", data.user.id)
      return { success: true, user: data.user, session: data.session }
    }

    return { success: false, error: "No user returned from signIn", user: null }
  } catch (error) {
    console.error("💥 Unexpected error in signInWithSupabaseAuth:", error)
    return { success: false, error: "Unexpected error during Supabase Auth signIn", user: null }
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutSupabaseAuth() {
  try {
    console.log("🚪 Signing out from Supabase Auth...")
    const { error } = await supabaseHybridAuth.auth.signOut()

    if (error) {
      console.error("❌ Error signing out from Supabase Auth:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Supabase Auth signOut successful!")
    return { success: true }
  } catch (error) {
    console.error("💥 Unexpected error in signOutSupabaseAuth:", error)
    return { success: false, error: "Unexpected error during Supabase Auth signOut" }
  }
}

/**
 * Check if Supabase Auth session exists
 */
export async function hasSupabaseAuthSession(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabaseHybridAuth.auth.getSession()
    return !!session
  } catch (error) {
    console.error("Error checking Supabase Auth session:", error)
    return false
  }
}

/**
 * Get Supabase Auth session
 */
export async function getSupabaseAuthSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabaseHybridAuth.auth.getSession()
    if (error) {
      console.error("Error getting Supabase Auth session:", error)
      return null
    }
    return session
  } catch (error) {
    console.error("Error in getSupabaseAuthSession:", error)
    return null
  }
}
