import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase Admin Client with Service Role Key
 * This client bypasses Row Level Security (RLS) policies and should only be used on the server-side
 * for administrative operations like creating orders, managing data, etc.
 *
 * IMPORTANT: Never expose the service role key to the client-side!
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNDE2OSwiZXhwIjoyMDY2MDkwMTY5fQ.Ypa9MilHbGjtrn7jjGwjMqXCycMZY1mHkj0mgWASbg0"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("Using fallback Supabase credentials for development")
}

// Create admin client with service role key
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Utility function to check if we're running on the server
export const isServerSide = () => typeof window === "undefined"

// Wrapper function to ensure admin client is only used server-side
export const getAdminClient = (): SupabaseClient => {
  if (!isServerSide()) {
    throw new Error("Admin client can only be used on the server-side!")
  }
  return supabaseAdmin
}

export default supabaseAdmin
