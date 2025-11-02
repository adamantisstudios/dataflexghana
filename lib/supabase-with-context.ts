import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase Client with User Context
 * This approach sets user context for RLS policies without using service role
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTQxNjksImV4cCI6MjA2NjA5MDE2OX0.zN_EzOp_PfwjzOReP9CjSWZMG5hhffqPOeutYJNw2i0"

// Create a client that can be used with user context
export const createSupabaseWithContext = (userToken?: string): SupabaseClient => {
  const client = createClient(supabaseUrl, supabaseAnonKey)
  
  // If we have a user token, set it for this client
  if (userToken) {
    client.auth.setSession({
      access_token: userToken,
      refresh_token: '', // Not needed for this use case
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: null // Will be populated by Supabase
    })
  }
  
  return client
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
