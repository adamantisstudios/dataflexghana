// Agent Authentication Utilities
// Simple localStorage-based authentication for agents

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

export const AGENT_STORAGE_KEY = "agent"

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
    
    // Also clear special agent cookies if they exist
    document.cookie = 'special_agent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'agent_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
 * Logout agent and clear session
 */
export function logoutAgent(): void {
  clearStoredAgent()

  // Trigger storage event for other tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new StorageEvent('storage', {
      key: AGENT_STORAGE_KEY,
      newValue: null,
      oldValue: localStorage.getItem(AGENT_STORAGE_KEY)
    }))
  }
}
