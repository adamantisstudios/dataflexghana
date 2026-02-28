/**
 * API Client Utility
 * 
 * This utility helps make authenticated API calls by automatically including
 * admin/agent authentication data from localStorage in request headers.
 */

import { getStoredAdmin, getStoredAgent } from './unified-auth-system'

interface ApiOptions extends RequestInit {
  requireAuth?: boolean
  userType?: 'admin' | 'agent'
}

/**
 * Enhanced fetch function that automatically includes authentication headers
 */
export async function authenticatedFetch(url: string, options: ApiOptions = {}): Promise<Response> {
  const { requireAuth = true, userType, ...fetchOptions } = options

  // Prepare headers
  const headers = new Headers(fetchOptions.headers)
  
  // Set content type if not already set
  if (!headers.has('Content-Type') && (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT')) {
    headers.set('Content-Type', 'application/json')
  }

  // Add authentication headers if required
  if (requireAuth) {
    if (userType === 'admin' || !userType) {
      const admin = getStoredAdmin()
      if (admin) {
        headers.set('x-admin-id', admin.id)
        // Also set as cookie for server-side middleware
        document.cookie = `admin_id=${admin.id}; path=/; max-age=86400; SameSite=Strict`
      }
    }

    if (userType === 'agent' || !userType) {
      const agent = getStoredAgent()
      if (agent) {
        headers.set('x-agent-id', agent.id)
        // Also set as cookie for server-side middleware
        document.cookie = `agent_id=${agent.id}; path=/; max-age=86400; SameSite=Strict`
      }
    }
  }

  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers
  })

  // Handle authentication errors
  if (response.status === 401) {
    console.warn('Authentication failed for request:', url)
    // Could trigger logout or redirect to login here
  }

  return response
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(url: string, options: Omit<ApiOptions, 'method'> = {}): Promise<Response> {
  return authenticatedFetch(url, { ...options, method: 'GET' })
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(url: string, data?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(url: string, data?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(url: string, options: Omit<ApiOptions, 'method'> = {}): Promise<Response> {
  return authenticatedFetch(url, { ...options, method: 'DELETE' })
}

/**
 * Helper to make admin-specific API calls
 */
export async function adminApiCall(url: string, options: Omit<ApiOptions, 'userType'> = {}): Promise<Response> {
  return authenticatedFetch(url, { ...options, userType: 'admin' })
}

/**
 * Helper to make agent-specific API calls
 */
export async function agentApiCall(url: string, options: Omit<ApiOptions, 'userType'> = {}): Promise<Response> {
  return authenticatedFetch(url, { ...options, userType: 'agent' })
}

/**
 * Helper to handle API responses with proper error handling
 */
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // If response is not JSON, use the default error message
    }
    
    throw new Error(errorMessage)
  }

  try {
    return await response.json()
  } catch {
    // If response is not JSON, return empty object
    return {} as T
  }
}

/**
 * Complete API call with error handling
 */
export async function apiCall<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const response = await authenticatedFetch(url, options)
  return handleApiResponse<T>(response)
}
