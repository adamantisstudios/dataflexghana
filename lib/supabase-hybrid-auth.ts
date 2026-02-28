/**
 * Hybrid Auth Client - Uses singleton from supabase-base
 * 
 * ⚠️ NO NEW CLIENT INSTANCES - This wraps the singleton to prevent GoTrueClient warnings
 * All code should use: import { supabase } from './supabase' OR from './supabase-base'
 */

import { type SupabaseClient } from "@supabase/supabase-js"
import { supabase as browserSingleton, getAdminClient } from "./supabase-base"

/**
 * Export the singleton browser client for hybrid auth operations
 */
export const supabaseHybridAuth: SupabaseClient = browserSingleton

export const supabase: SupabaseClient = browserSingleton

/**
 * Get admin client for server-side operations (creates new instance per call)
 */
export const getSupabaseAdmin = (): SupabaseClient => getAdminClient()

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
