// Client-side order history manager for duplicate detection
// Stores recent orders in localStorage to prevent duplicate submissions

interface OrderHistoryEntry {
  bundleId: string
  recipientPhone: string
  paymentMethod: string
  timestamp: number
}

const ORDER_HISTORY_KEY = "orderHistory"
const DUPLICATE_CHECK_WINDOW = 10 * 60 * 1000 // 10 minutes in milliseconds
const MAX_HISTORY_ENTRIES = 50

export function getOrderHistory(): OrderHistoryEntry[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(ORDER_HISTORY_KEY)
    if (!stored) return []

    const history: OrderHistoryEntry[] = JSON.parse(stored)
    // Clean up old entries (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    return history.filter((entry) => entry.timestamp > oneHourAgo)
  } catch (error) {
    console.error("Failed to load order history:", error)
    return []
  }
}

export function addToOrderHistory(bundleId: string, recipientPhone: string, paymentMethod: string): void {
  if (typeof window === "undefined") return

  try {
    const history = getOrderHistory()
    const newEntry: OrderHistoryEntry = {
      bundleId,
      recipientPhone,
      paymentMethod,
      timestamp: Date.now(),
    }

    // Keep only recent entries
    history.unshift(newEntry)
    const recentHistory = history.slice(0, MAX_HISTORY_ENTRIES)

    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(recentHistory))
  } catch (error) {
    console.error("Failed to save order history:", error)
  }
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  lastOrderTime?: number
  minutesUntilAllowed?: number
  bundleName?: string
}

export function checkForDuplicateOrder(
  bundleId: string,
  recipientPhone: string,
  paymentMethod: string,
  bundleName?: string,
): DuplicateCheckResult {
  const normalizedPhone = recipientPhone.replace(/\D/g, "").slice(-10)

  const history = getOrderHistory()
  const now = Date.now()

  // Check for identical order within the duplicate window
  for (const entry of history) {
    const normalizedEntryPhone = entry.recipientPhone.replace(/\D/g, "").slice(-10)
    if (
      entry.bundleId === bundleId &&
      normalizedEntryPhone === normalizedPhone &&
      entry.paymentMethod === paymentMethod
    ) {
      const timeSinceOrder = now - entry.timestamp
      if (timeSinceOrder < DUPLICATE_CHECK_WINDOW) {
        const minutesUntilAllowed = Math.ceil((DUPLICATE_CHECK_WINDOW - timeSinceOrder) / 60000)
        return {
          isDuplicate: true,
          lastOrderTime: entry.timestamp,
          minutesUntilAllowed,
          bundleName,
        }
      }
    }
  }

  return { isDuplicate: false }
}

export function clearOrderHistory(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(ORDER_HISTORY_KEY)
  } catch (error) {
    console.error("Failed to clear order history:", error)
  }
}
