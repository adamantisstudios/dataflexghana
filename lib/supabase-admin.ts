/**
 * DEPRECATED: Use lib/supabase-base.ts instead
 * 
 * This file is kept for backward compatibility only.
 * All imports should be updated to use:
 *   import { supabase, getAdminClient } from '@/lib/supabase-base'
 * 
 * OR if you need a one-line change:
 *   import { supabase, getAdminClient } from '@/lib/supabase-base'
 *   export { supabase, getAdminClient }
 */

import { supabase, getAdminClient } from "./supabase-base"

// Re-export for backward compatibility
export { supabase, getAdminClient }

// Legacy exports for backward compatibility
export const supabaseAdmin = supabase
export const isServerSide = () => typeof window === "undefined"
export default supabase
