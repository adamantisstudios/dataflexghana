import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "./supabase-base"

/**
 * Supabase Client with User Context
 * 
 * ⚠️ IMPORTANT: Uses singleton from supabase-base - NO new createClient() calls
 * Sets user context for RLS policies without creating duplicate clients
 */

/**
 * Get the singleton client (optionally set user context)
 * The singleton handles session management automatically via auth listeners
 */
export const createSupabaseWithContext = (userToken?: string): SupabaseClient => {
  // Return the singleton - it manages auth state automatically
  if (userToken) {
    // Optionally set explicit session if needed
    supabase.auth.setSession({
      access_token: userToken,
      refresh_token: '',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: null
    }).catch(err => console.error('[Supabase] Failed to set session:', err))
  }
  
  return supabase
}

// Alternative approach: Create a custom JWT for agent operations
export const createAgentJWT = (agentId: string): string => {
  // This is a simplified JWT creation - in production, use a proper JWT library
  // and sign with your JWT secret from Supabase
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const payload = {
    sub: agentId,
    role: 'agent', // Custom role for agents
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
  }
  
  // Note: This is a placeholder - you need to implement proper JWT signing
  // with your Supabase JWT secret
  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.signature`
}

// Function to create Supabase client with agent context
export const createSupabaseForAgent = (agentId: string): SupabaseClient => {
  const agentToken = createAgentJWT(agentId)
  return createSupabaseWithContext(agentToken)
}

export default createSupabaseWithContext
