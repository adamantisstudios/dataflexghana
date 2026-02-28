// Enhanced API client that automatically handles authentication
// Works with localStorage-based authentication system

import { getStoredAgent } from './agent-auth'
import { supabase } from './supabase'
import { sessionManager } from './session-manager'
import { verifyAdminSession, getAdminToken } from './auth'
import { getStoredAdmin } from './auth'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  requireAuth?: boolean
  userType?: 'agent' | 'admin' | 'auto'
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  private getAuthHeaders(userType: 'agent' | 'admin' | 'auto' = 'auto'): Record<string, string> {
    const headers: Record<string, string> = {}

    if (userType === 'agent' || userType === 'auto') {
      const agent = getStoredAgent()
      if (agent) {
        headers['x-agent-id'] = agent.id
        headers['x-user-type'] = 'agent'
        return headers
      }
    }

    if (userType === 'admin' || userType === 'auto') {
      const admin = getStoredAdmin()
      if (admin) {
        headers['x-admin-id'] = admin.id
        headers['x-user-type'] = 'admin'
        return headers
      }
    }

    return headers
  }

  private async makeRequest(endpoint: string, options: ApiOptions = {}): Promise<Response> {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true,
      userType = 'auto'
    } = options

    const url = `${this.baseUrl}${endpoint}`
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Add authentication headers if required
    if (requireAuth) {
      const authHeaders = this.getAuthHeaders(userType)
      Object.assign(requestHeaders, authHeaders)
    }

    // For GET requests, add user ID to query params as fallback
    let finalUrl = url
    if (method === 'GET' && requireAuth) {
      const urlObj = new URL(url, window.location.origin)
      
      if (userType === 'agent' || userType === 'auto') {
        const agent = getStoredAgent()
        if (agent) {
          urlObj.searchParams.set('agentId', agent.id)
        }
      }
      
      if (userType === 'admin' || userType === 'auto') {
        const admin = getStoredAdmin()
        if (admin) {
          urlObj.searchParams.set('adminId', admin.id)
        }
      }
      
      finalUrl = urlObj.pathname + urlObj.search
    }

    // For POST/PUT requests, add user ID to body as fallback
    let finalBody = body
    if ((method === 'POST' || method === 'PUT') && requireAuth && body) {
      if (userType === 'agent' || userType === 'auto') {
        const agent = getStoredAgent()
        if (agent) {
          finalBody = { ...body, agentId: agent.id }
        }
      }
      
      if (userType === 'admin' || userType === 'auto') {
        const admin = getStoredAdmin()
        if (admin) {
          finalBody = { ...body, adminId: admin.id }
        }
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      ...(finalBody && { body: JSON.stringify(finalBody) })
    }

    return fetch(finalUrl, requestOptions)
  }

  // Convenience methods
  async get(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint: string, body?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'POST', body })
  }

  async put(endpoint: string, body?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'PUT', body })
  }

  async delete(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' })
  }

  // Specialized methods for different user types
  agent = {
    get: (endpoint: string, options: Omit<ApiOptions, 'method' | 'userType'> = {}) =>
      this.get(endpoint, { ...options, userType: 'agent' }),
    
    post: (endpoint: string, body?: any, options: Omit<ApiOptions, 'method' | 'body' | 'userType'> = {}) =>
      this.post(endpoint, body, { ...options, userType: 'agent' }),
    
    put: (endpoint: string, body?: any, options: Omit<ApiOptions, 'method' | 'body' | 'userType'> = {}) =>
      this.put(endpoint, body, { ...options, userType: 'agent' }),
    
    delete: (endpoint: string, options: Omit<ApiOptions, 'method' | 'userType'> = {}) =>
      this.delete(endpoint, { ...options, userType: 'agent' })
  }

  admin = {
    get: (endpoint: string, options: Omit<ApiOptions, 'method' | 'userType'> = {}) =>
      this.get(endpoint, { ...options, userType: 'admin' }),
    
    post: (endpoint: string, body?: any, options: Omit<ApiOptions, 'method' | 'body' | 'userType'> = {}) =>
      this.post(endpoint, body, { ...options, userType: 'admin' }),
    
    put: (endpoint: string, body?: any, options: Omit<ApiOptions, 'method' | 'body' | 'userType'> = {}) =>
      this.put(endpoint, body, { ...options, userType: 'admin' }),
    
    delete: (endpoint: string, options: Omit<ApiOptions, 'method' | 'userType'> = {}) =>
      this.delete(endpoint, { ...options, userType: 'admin' })
  }
}

// Create and export a default instance
export const apiClient = new ApiClient()

// Export the class for custom instances
export { ApiClient }

// Helper function to handle API responses
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Convenience function for making authenticated API calls
export async function apiCall<T = any>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiClient.makeRequest(endpoint, options)
  return handleApiResponse<T>(response)
}

// Savings-specific API helpers
export const savingsApi = {
  // Get agent's savings accounts
  getSavings: async (agentId?: string) => {
    const endpoint = agentId ? `/agent/savings?agentId=${agentId}` : '/agent/savings'
    const response = await apiClient.agent.get(endpoint)
    return handleApiResponse(response)
  },

  // Get agent's savings accounts (alias for compatibility)
  getAgentSavings: async (agentId?: string) => {
    const endpoint = agentId ? `/agent/savings?agentId=${agentId}` : '/agent/savings'
    const response = await apiClient.agent.get(endpoint)
    return handleApiResponse(response)
  },

  // Create new savings account
  createSavings: async (data: { savingsPlanId: string; amount: number; agentId?: string }) => {
    const response = await apiClient.agent.post('/agent/savings', data)
    return handleApiResponse(response)
  },

  // Get savings plans
  getSavingsPlans: async () => {
    const response = await apiClient.get('/agent/savings/plans', { requireAuth: false })
    return handleApiResponse(response)
  },

  // Get savings transactions
  getSavingsTransactions: async (savingsId: string) => {
    const response = await apiClient.agent.get(`/agent/savings/transactions?savingsId=${savingsId}`)
    return handleApiResponse(response)
  },

  // Request withdrawal
  requestWithdrawal: async (data: {
    savingsId: string
    amount: number
    withdrawalType: 'full' | 'partial' | 'early'
    mobileMoneyNumber: string
    mobileMoneyNetwork: string
    reason?: string
  }) => {
    const response = await apiClient.agent.post('/agent/savings/withdraw', data)
    return handleApiResponse(response)
  }
}

// Admin savings API helpers
export const adminSavingsApi = {
  // Get all savings accounts (admin view)
  getAllSavings: async () => {
    const response = await apiClient.admin.get('/admin/savings')
    return handleApiResponse(response)
  },

  // Get savings reports
  getSavingsReports: async () => {
    const response = await apiClient.admin.get('/admin/savings/reports')
    return handleApiResponse(response)
  },

  // Manage withdrawal requests
  getWithdrawalRequests: async () => {
    const response = await apiClient.admin.get('/admin/savings/withdrawals')
    return handleApiResponse(response)
  },

  // Process withdrawal request
  processWithdrawal: async (withdrawalId: string, action: 'approve' | 'reject', notes?: string) => {
    const response = await apiClient.admin.put(`/admin/savings/withdrawals/${withdrawalId}`, {
      action,
      notes
    })
    return handleApiResponse(response)
  }
}
