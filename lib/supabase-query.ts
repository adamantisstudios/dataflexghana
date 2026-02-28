import { getAdminClient } from "./supabase-base"

/**
 * ⚠️ Server-side only - Creates admin client per request (not singleton)
 */
export function createSupabaseAdmin() {
  return getAdminClient()
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const supabase = getAdminClient()

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
