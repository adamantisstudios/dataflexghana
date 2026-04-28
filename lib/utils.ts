import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility for performance-sensitive operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Format currency for display
export function formatCurrency(amount: number, currency: string = '₵'): string {
  return `${currency} ${amount.toFixed(2)}`
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString() + " - " + d.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  })
}

// Check if error is connection-related
export function isConnectionError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code || ''
  
  return (
    errorCode === 'PGRST301' || // JWT expired
    errorCode === 'PGRST302' || // JWT invalid
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('jwt') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication')
  )
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Local storage utilities with error handling
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error)
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error)
      return false
    }
  },
  
  remove: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
      return false
    }
  }
}
