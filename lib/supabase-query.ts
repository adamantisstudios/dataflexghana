import { createClient } from "@supabase/supabase-js"

export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const supabase = createSupabaseAdmin()

  // Use Supabase's rpc function to execute raw SQL
  const { data, error } = await supabase.rpc("exec_sql", {
    query_text: query,
    query_params: params,
  })

  if (error) {
    console.error("SQL Query Error:", error)
    throw new Error(`Database query failed: ${error.message}`)
  }

  return data as T[]
}
