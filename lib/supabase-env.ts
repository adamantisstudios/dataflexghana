/**
 * Supabase Environment Configuration
 *
 * This module handles loading and validating Supabase credentials from environment variables.
 * It provides clear error messages when credentials are missing.
 */

export interface SupabaseEnvConfig {
  url: string
  anonKey: string
  serviceKey: string
  isConfigured: boolean
  missingVars: string[]
}

export function getSupabaseEnv(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const missingVars: string[] = []
  if (!url) missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!anonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!serviceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY")

  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Supabase Environment Configuration:")
    console.log("  - NEXT_PUBLIC_SUPABASE_URL:", url ? `✓ ${url.substring(0, 30)}...` : "✗ NOT SET")
    console.log("  - NEXT_PUBLIC_SUPABASE_ANON_KEY:", anonKey ? "✓ SET" : "✗ NOT SET")
    console.log("  - SUPABASE_SERVICE_ROLE_KEY:", serviceKey ? "✓ SET" : "✗ NOT SET")

    if (missingVars.length > 0) {
      console.warn("[v0] Missing Supabase environment variables:", missingVars)
      console.warn("[v0] Please ensure .env.local is configured with all required variables")
    }
  }

  return {
    url: url || "",
    anonKey: anonKey || "",
    serviceKey: serviceKey || "",
    isConfigured: missingVars.length === 0,
    missingVars,
  }
}

/**
 * Validates that all required Supabase credentials are configured
 * @returns true if all credentials are present, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  const config = getSupabaseEnv()
  return config.isConfigured
}

/**
 * Gets a detailed error message about missing Supabase configuration
 * @returns Error message string or null if configured
 */
export function getSupabaseConfigError(): string | null {
  const config = getSupabaseEnv()

  if (config.isConfigured) {
    return null
  }

  const missingList = config.missingVars.join(", ")
  return `Supabase is not properly configured. Missing environment variables: ${missingList}. Please check your .env.local file.`
}
