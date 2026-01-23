import { createClient, type SupabaseClient, type PostgrestResponse } from "@supabase/supabase-js"
import { sessionManager } from './session-manager'

/**
 * Enhanced Supabase client with automatic session management and proper singleton pattern
 */
class EnhancedSupabaseClient {
  private _client: SupabaseClient
  private static instance: EnhancedSupabaseClient | null = null
  private static isInitializing: boolean = false

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTQxNjksImV4cCI6MjA2NjA5MDE2OX0.zN_EzOp_PfwjzOReP9CjSWZMG5hhffqPOeutYJNw2i0"

    this._client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

    console.log('Enhanced Supabase client initialized')
  }

  public static getInstance(): EnhancedSupabaseClient {
    // Prevent multiple instances during initialization
    if (EnhancedSupabaseClient.isInitializing) {
      throw new Error('Supabase client is already being initialized. Please wait.')
    }

    if (!EnhancedSupabaseClient.instance) {
      EnhancedSupabaseClient.isInitializing = true
      try {
        EnhancedSupabaseClient.instance = new EnhancedSupabaseClient()
      } finally {
        EnhancedSupabaseClient.isInitializing = false
      }
    }
    return EnhancedSupabaseClient.instance
  }

  /**
   * Validate current session without making external calls
   */
  public async validateSession(): Promise<boolean> {
    try {
      const { data: { session } } = await this._client.auth.getSession()
      return !!session && !!session.access_token
    } catch (error) {
      console.error('Session validation failed:', error)
      return false
    }
  }

  /**
   * Check and refresh session if needed
   */
  public async ensureValidSession(): Promise<boolean> {
    try {
      const { data: { session } } = await this._client.auth.getSession()
      
      if (!session) {
        console.warn('No active session found')
        return false
      }

      // Check if token is close to expiry (within 5 minutes)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      const timeUntilExpiry = expiresAt - now

      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('Session close to expiry, refreshing...')
        const { data: { session: refreshedSession }, error } = await this._client.auth.refreshSession()
        
        if (error) {
          console.error('Session refresh failed:', error)
          return false
        }

        return !!refreshedSession
      }

      return true
    } catch (error) {
      console.error('Session validation/refresh failed:', error)
      return false
    }
  }

  /**
   * Execute a database operation with automatic session validation
   */
  public async executeWithSessionValidation<T>(
    operation: () => Promise<PostgrestResponse<T>>,
    operationName: string = 'Database operation',
    maxRetries: number = 2
  ): Promise<PostgrestResponse<T>> {
    let lastError: any = null
    let originalError: any = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Ensure session is valid before operation
        const sessionValid = await sessionManager.checkAndRefreshIfNeeded()

        if (!sessionValid && attempt === 0) {
          console.warn(`${operationName}: Session invalid, attempting refresh`)
          continue
        }

        // Execute the operation
        const result = await operation()

        // Check for session-related errors
        if (result.error) {
          const errorMessage = result.error.message?.toLowerCase() || ''
          const errorCode = result.error.code || ''

          // Store the original error for better debugging
          originalError = result.error

          // Check for session/auth related errors
          if (
            errorCode === 'PGRST301' || // JWT expired
            errorCode === 'PGRST302' || // JWT invalid
            errorMessage.includes('jwt') ||
            errorMessage.includes('expired') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('authentication')
          ) {
            console.warn(`${operationName}: Session error detected, attempting refresh`)
            lastError = result.error

            if (attempt < maxRetries) {
              const refreshed = await sessionManager.refreshSession()
              if (refreshed) {
                continue // Retry with refreshed session
              }
            }
          }
        }

        return result
      } catch (error) {
        console.error(`${operationName} attempt ${attempt + 1} failed:`, error)
        lastError = error
        originalError = originalError || error

        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    // If all retries failed, create a comprehensive error with preserved details
    const enhancedError = new Error(`${operationName} failed after ${maxRetries + 1} attempts`)
    
    // Preserve original error properties for better debugging
    if (originalError) {
      enhancedError.name = originalError.name || 'DatabaseError'
      enhancedError.cause = originalError
      // Add original error details as properties
      Object.assign(enhancedError, {
        originalError,
        originalMessage: originalError.message,
        originalCode: originalError.code,
        details: originalError.details,
        hint: originalError.hint
      })
    } else if (lastError) {
      enhancedError.cause = lastError
      Object.assign(enhancedError, {
        originalError: lastError,
        originalMessage: lastError.message
      })
    }

    throw enhancedError
  }

  /**
   * Enhanced from() method with session validation
   */
  public from(table: string) {
    const originalFrom = this._client.from(table)
    
    return {
      ...originalFrom,
      select: (columns?: string) => {
        const query = originalFrom.select(columns)
        const originalExecute = query.then.bind(query)
        
        query.then = (onfulfilled?: any, onrejected?: any) => {
          return this.executeWithSessionValidation(
            () => originalExecute(),
            `SELECT from ${table}`
          ).then(onfulfilled, onrejected)
        }
        
        return query
      },
      insert: (values: any) => {
        const query = originalFrom.insert(values)
        const originalExecute = query.then.bind(query)
        
        query.then = (onfulfilled?: any, onrejected?: any) => {
          return this.executeWithSessionValidation(
            () => originalExecute(),
            `INSERT into ${table}`
          ).then(onfulfilled, onrejected)
        }
        
        return query
      },
      update: (values: any) => {
        const query = originalFrom.update(values)
        const originalExecute = query.then.bind(query)
        
        query.then = (onfulfilled?: any, onrejected?: any) => {
          return this.executeWithSessionValidation(
            () => originalExecute(),
            `UPDATE ${table}`
          ).then(onfulfilled, onrejected)
        }
        
        return query
      },
      delete: () => {
        const query = originalFrom.delete()
        const originalExecute = query.then.bind(query)
        
        query.then = (onfulfilled?: any, onrejected?: any) => {
          return this.executeWithSessionValidation(
            () => originalExecute(),
            `DELETE from ${table}`
          ).then(onfulfilled, onrejected)
        }
        
        return query
      }
    }
  }

  /**
   * Enhanced rpc() method with session validation
   */
  public async rpc(fn: string, args?: any) {
    return this.executeWithSessionValidation(
      () => this._client.rpc(fn, args),
      `RPC ${fn}`
    )
  }

  /**
   * Get the underlying Supabase client for auth operations
   */
  public get auth() {
    return this._client.auth
  }

  /**
   * Get the underlying Supabase client for storage operations
   */
  public get storage() {
    return this._client.storage
  }

  /**
   * Get the underlying client for any other operations
   */
  public get client() {
    return this._client
  }

  /**
   * Check connection status
   */
  public async checkConnection(): Promise<boolean> {
    try {
      const { error } = await this._client.from('wholesale_products').select('id').limit(1)
      return !error
    } catch (error) {
      console.error('Connection check failed:', error)
      return false
    }
  }

  /**
   * Create a real-time channel with session validation
   */
  public async createChannel(channelName: string): Promise<any> {
    // Ensure session is valid before creating channel
    const sessionValid = await this.ensureValidSession()
    if (!sessionValid) {
      throw new Error('Cannot create real-time channel: invalid session')
    }

    return this._client.channel(channelName)
  }

  /**
   * Get channel method for real-time subscriptions
   */
  public channel(name: string) {
    return this._client.channel(name)
  }

  /**
   * Reset singleton instance (for testing purposes only)
   */
  public static resetInstance(): void {
    if (process.env.NODE_ENV === 'test') {
      EnhancedSupabaseClient.instance = null
      EnhancedSupabaseClient.isInitializing = false
    }
  }
}

// Export enhanced client instance using singleton pattern
export const enhancedSupabase = EnhancedSupabaseClient.getInstance()

// Export the client directly for backward compatibility
export const supabase = enhancedSupabase

// Export the class for advanced usage
export { EnhancedSupabaseClient }
