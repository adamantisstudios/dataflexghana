/**
 * Unified Authentication System - COMPREHENSIVE FIX
 *
 * This system provides consistent authentication across the entire application
 * using localStorage for both agents and admins, with Supabase as the backend.
 *
 * FIXES APPLIED:
 * - Uses new validate_admin_credentials function to bypass RLS issues
 * - Improved error handling and logging
 * - Fallback authentication methods
 * - Better permission handling
 * - Fixed case-insensitive email matching
 */

import { supabase } from './supabase-hybrid-auth'
import { signInWithSupabaseAuth, signOutSupabaseAuth, getCurrentSupabaseUser, hasSupabaseAuthSession } from './supabase-hybrid-auth'

// ============ TYPES ============

export interface Agent {
  id: string
  phone_number: string
  full_name: string
  email?: string
  isapproved: boolean
  region?: string
  momo_number?: string
  wallet_balance?: number
  created_at?: string
  updated_at?: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at?: string
  last_login?: string
}

// ============ STORAGE KEYS ============

const AGENT_STORAGE_KEY = 'agent'
const ADMIN_STORAGE_KEY = 'admin_user'

// ============ COOKIE HELPERS ============

/**
 * Set a cookie safely (works in browser environment)
 */
function setCookieSafe(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return

  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  } catch (error) {
    console.error('Error setting cookie:', error)
  }
}

/**
 * Remove a cookie safely
 */
function removeCookieSafe(name: string): void {
  if (typeof document === 'undefined') return

  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  } catch (error) {
    console.error('Error removing cookie:', error)
  }
}

// ============ AGENT AUTHENTICATION ============

/**
 * Get the current logged-in agent from localStorage
 */
export function getStoredAgent(): Agent | null {
  if (typeof window === 'undefined') return null

  try {
    const storedAgent = localStorage.getItem(AGENT_STORAGE_KEY)
    if (!storedAgent) return null

    const agent = JSON.parse(storedAgent)

    // Validate required fields
    if (!agent.id || !agent.phone_number || !agent.isapproved) {
      clearStoredAgent()
      return null
    }

    return agent
  } catch (error) {
    console.error('Error getting stored agent:', error)
    clearStoredAgent()
    return null
  }
}

/**
 * Store agent data in localStorage
 */
export function setStoredAgent(agent: Agent): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agent))
    console.log('✅ Agent session saved to localStorage')
  } catch (error) {
    console.error('Error storing agent:', error)
  }
}

/**
 * Clear agent data from localStorage (logout)
 */
export function clearStoredAgent(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(AGENT_STORAGE_KEY)
    console.log('🗑️ Agent session cleared from localStorage')
  } catch (error) {
    console.error('Error clearing stored agent:', error)
  }
}

/**
 * Check if an agent is currently logged in
 */
export function isAgentLoggedIn(): boolean {
  return getStoredAgent() !== null
}

/**
 * Get agent ID if logged in
 */
export function getAgentId(): string | null {
  const agent = getStoredAgent()
  return agent?.id || null
}

/**
 * Update stored agent data (for wallet balance updates, etc.)
 */
export function updateStoredAgent(updates: Partial<Agent>): void {
  const currentAgent = getStoredAgent()
  if (!currentAgent) return

  const updatedAgent = { ...currentAgent, ...updates }
  setStoredAgent(updatedAgent)
}

/**
 * Logout agent and clear session + cache
 */
export function logoutAgent(): void {
  clearStoredAgent()

  // Clear all caches and storage
  if (typeof window !== 'undefined') {
    try {
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear specific localStorage items (keep only theme/language settings)
      const keysToPreserve = ['theme', 'language']
      const keysToRemove = Object.keys(localStorage).filter(
        key => !keysToPreserve.includes(key)
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear IndexedDB caches if present
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName)
          })
        }).catch(error => {
          console.error('[v0] Error clearing caches:', error)
        })
      }
    } catch (error) {
      console.error('[v0] Error clearing storage:', error)
    }

    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: AGENT_STORAGE_KEY,
      newValue: null,
      oldValue: localStorage.getItem(AGENT_STORAGE_KEY)
    }))
  }
}

/**
 * Agent login function - validates credentials and stores session
 */
export async function loginAgent(phoneNumber: string, password: string): Promise<{
  success: boolean
  agent?: Agent
  error?: string
}> {
  try {
    console.log('🔐 Attempting agent login for:', phoneNumber)

    // Query the agents table directly
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('isapproved', true)
      .single()

    if (error || !agent) {
      console.log('❌ Agent not found or not approved')
      return { success: false, error: 'Invalid phone number or password' }
    }

    // Simple password verification (adjust based on your password storage method)
    const isValidPassword = agent.password === password || agent.password_hash === password

    if (!isValidPassword) {
      console.log('❌ Invalid password')
      return { success: false, error: 'Invalid phone number or password' }
    }

    // Store agent session
    setStoredAgent(agent)

    console.log('✅ Agent login successful!')
    return { success: true, agent }

  } catch (error) {
    console.error('💥 Agent login error:', error)
    return { success: false, error: 'An unexpected error occurred during login' }
  }
}

// ============ ADMIN AUTHENTICATION ============

/**
 * Get the current logged-in admin from localStorage
 */
export function getStoredAdmin(): AdminUser | null {
  if (typeof window === 'undefined') return null

  try {
    const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!storedAdmin) return null

    const admin = JSON.parse(storedAdmin)

    // Validate required fields
    if (!admin.id || !admin.email || !admin.is_active) {
      clearStoredAdmin()
      return null
    }

    return admin
  } catch (error) {
    console.error('Error getting stored admin:', error)
    clearStoredAdmin()
    return null
  }
}

/**
 * Store admin data in localStorage and cookies
 */
export function setStoredAdmin(admin: AdminUser): void {
  if (typeof window === 'undefined') return

  try {
    // Store in localStorage
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin))

    // Also store in cookies for server-side access
    setCookieSafe(ADMIN_STORAGE_KEY, JSON.stringify(admin), 7)

    console.log('✅ Admin session saved to localStorage and cookies')
  } catch (error) {
    console.error('Error storing admin:', error)
  }
}

/**
 * Clear admin data from localStorage and cookies (logout)
 */
export function clearStoredAdmin(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    removeCookieSafe(ADMIN_STORAGE_KEY)
    console.log('🗑️ Admin session cleared from localStorage and cookies')
  } catch (error) {
    console.error('Error clearing stored admin:', error)
  }
}

/**
 * Check if an admin is currently logged in
 */
export function isAdminLoggedIn(): boolean {
  return getStoredAdmin() !== null
}

/**
 * Logout admin and clear both sessions
 * HYBRID LOGOUT: Clears both localStorage and Supabase Auth sessions
 */
export function logoutAdmin(): void {
  console.log('🚪 Starting hybrid admin logout...')

  // Clear localStorage session (existing behavior)
  clearStoredAdmin()

  // Clear Supabase Auth session (new behavior)
  signOutSupabaseAuth().then((result) => {
    if (result.success) {
      console.log('✅ Supabase Auth session cleared')
    } else {
      console.log('⚠️ Error clearing Supabase Auth session:', result.error)
    }
  }).catch((error) => {
    console.log('⚠️ Unexpected error during Supabase Auth logout:', error)
  })

  // Trigger storage event for other tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new StorageEvent('storage', {
      key: ADMIN_STORAGE_KEY,
      newValue: null,
      oldValue: localStorage.getItem(ADMIN_STORAGE_KEY)
    }))
  }

  console.log('✅ Hybrid admin logout complete!')
}

// ============ NEW VALIDATE ADMIN LOGIN FUNCTION - COMPREHENSIVE FIX ============

/**
 * Validate Admin Login - COMPREHENSIVE FIX
 * Uses the new database function to bypass RLS issues completely
 */
export async function validateAdminLogin(adminEmail: string, adminPassword: string) {
  console.log("🔐 Attempting admin validation for:", adminEmail);

  try {
    // METHOD 1: Use the new database function (primary method)
    console.log("📋 Method 1: Using validate_admin_credentials function...");
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('validate_admin_credentials', {
        admin_email: adminEmail,
        admin_password: adminPassword
      });

    if (!functionError && functionResult && functionResult.length > 0) {
      const admin = functionResult[0];
      console.log("✅ Method 1 successful: Admin validated via function");
      console.log("📧 Admin Email:", admin.email);
      console.log("👤 Admin Name:", admin.full_name);
      console.log("🆔 Admin ID:", admin.admin_id);
      
      return {
        id: admin.admin_id,
        email: admin.email,
        full_name: admin.full_name || 'Admin User',
        role: admin.role || 'admin',
        is_active: admin.is_active,
        auth_uid: admin.auth_uid,
        created_at: admin.created_at,
        last_login: admin.last_login
      };
    }

    console.log("⚠️ Method 1 failed:", functionError?.message || "No results returned");

    // METHOD 2: Direct table query with service role (fallback)
    console.log("📋 Method 2: Direct table query fallback...");
    
    const { data: directResult, error: directError } = await supabase
      .from("admin_users")
      .select("*")
      .ilike("email", adminEmail)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!directError && directResult) {
      // Verify password
      const storedPassword = directResult.password_hash;
      if (adminPassword === storedPassword) {
        console.log("✅ Method 2 successful: Admin validated via direct query");
        return directResult;
      } else {
        console.log("❌ Method 2: Password mismatch");
        throw new Error("Invalid password");
      }
    }

    console.log("⚠️ Method 2 failed:", directError?.message || "No results returned");

    // METHOD 3: Service role query (last resort)
    console.log("📋 Method 3: Service role query (last resort)...");
    
    // This would require a service role client, which we don't have in client-side code
    // So we'll throw an error here
    
    throw new Error("All authentication methods failed");

  } catch (error) {
    console.error("💥 validateAdminLogin comprehensive error:", error);
    throw error;
  }
}

/**
 * Admin login function - COMPREHENSIVE FIX
 * Uses multiple fallback methods to ensure login works
 */
export async function loginAdmin(email: string, password: string): Promise<{
  success: boolean
  admin?: AdminUser
  error?: string
}> {
  try {
    console.log('🔐 Attempting comprehensive admin login for:', email)

    // STEP 1: Validate against admin_users table using comprehensive validation
    console.log('📋 Step 1: Comprehensive admin validation...')

    let adminData: any
    try {
      adminData = await validateAdminLogin(email, password)
    } catch (validationError: any) {
      console.log('❌ Admin validation failed:', validationError.message)
      return { success: false, error: 'Invalid email or password' }
    }

    console.log('✅ Step 1 complete: Admin credentials validated successfully!')

    // STEP 2: Sign in with Supabase Auth to establish session for RLS policies (optional)
    console.log('🔐 Step 2: Attempting Supabase Auth session (optional)...')
    const supabaseAuthResult = await signInWithSupabaseAuth(email, password)

    if (!supabaseAuthResult.success) {
      console.log('⚠️ Supabase Auth signIn failed, but admin_users validation succeeded')
      console.log('⚠️ This may indicate the admin user does not exist in Supabase Auth')
      console.log('⚠️ Proceeding with localStorage-only authentication...')
    } else {
      console.log('✅ Step 2 complete: Supabase Auth session established!')
      console.log('🆔 Supabase User ID:', supabaseAuthResult.user?.id)
    }

    // STEP 3: Create admin object for localStorage storage
    const admin: AdminUser = {
      id: adminData.id,
      email: adminData.email,
      full_name: adminData.full_name || 'Admin User',
      role: adminData.role || 'admin',
      is_active: adminData.is_active,
      created_at: adminData.created_at,
      last_login: adminData.last_login
    }

    // Store admin session in localStorage
    setStoredAdmin(admin)

    // STEP 4: Update last login in admin_users table
    try {
      const { error: updateError } = await supabase
        .rpc('update_admin_last_login', { admin_id: adminData.id });
      
      if (updateError) {
        console.log('⚠️ Could not update last login via function:', updateError.message)
        
        // Fallback: direct update
        await supabase
          .from('admin_users')
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', adminData.id)
      }
      
      console.log('✅ Last login updated successfully')
    } catch (updateError) {
      console.log('⚠️ Could not update last login:', updateError)
    }

    // STEP 5: Debug logging for both authentication systems
    console.log('🔍 COMPREHENSIVE AUTH DEBUG INFO:')
    console.log('📋 localStorage Admin ID:', admin.id)
    console.log('📋 localStorage Admin Email:', admin.email)

    // Get current Supabase user for debugging
    const currentSupabaseUser = await getCurrentSupabaseUser()
    if (currentSupabaseUser) {
      console.log('🔐 Supabase Auth User ID:', currentSupabaseUser.id)
      console.log('🔐 Supabase Auth Email:', currentSupabaseUser.email)
      console.log('✅ Both authentication systems are active!')
    } else {
      console.log('⚠️ Supabase Auth session not found - using localStorage only')
    }

    console.log('🎉 Comprehensive admin login successful!')
    return { success: true, admin }

  } catch (error: any) {
    console.error('💥 Comprehensive admin login error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred during login'
    
    if (error.message?.includes('permission denied')) {
      errorMessage = 'Database permission error. Please contact support.'
    } else if (error.message?.includes('Invalid password')) {
      errorMessage = 'Invalid email or password'
    } else if (error.message?.includes('not found')) {
      errorMessage = 'Admin account not found or inactive'
    }
    
    return { success: false, error: errorMessage }
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Clear all authentication data (useful for complete logout)
 */
export function clearAllAuth(): void {
  clearStoredAgent()
  clearStoredAdmin()
}

/**
 * Check if any user (agent or admin) is logged in
 */
export function isAnyUserLoggedIn(): boolean {
  return isAgentLoggedIn() || isAdminLoggedIn()
}

/**
 * Get current user type
 */
export function getCurrentUserType(): 'agent' | 'admin' | null {
  if (isAgentLoggedIn()) return 'agent'
  if (isAdminLoggedIn()) return 'admin'
  return null
}

// ============ BACKWARDS COMPATIBILITY ============
// Export functions with original names for backwards compatibility

export const getCurrentAgent = getStoredAgent
export const getCurrentAdmin = getStoredAdmin
export const setAdminSession = (admin: AdminUser) => setStoredAdmin(admin)
export const clearAdminSession = clearStoredAdmin
