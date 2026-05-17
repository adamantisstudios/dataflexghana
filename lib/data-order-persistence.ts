export interface DataOrderState {
  selectedBundle?: unknown
  recipientPhone?: string
  paymentMethod?: "manual" | "wallet"
  generatedReference?: string
  orderDetails?: unknown
}

interface StoredEnvelope {
  formData?: DataOrderState
  timestamp?: number
}

const STORAGE_KEY = "dataOrderFormState"
const EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes

function storage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage
}

export function saveDataOrderState(data: DataOrderState): void {
  try {
    const state: StoredEnvelope = {
      formData: data,
      timestamp: Date.now(),
    }
    storage()?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to save data order state:", error)
  }
}

export function loadDataOrderState(): DataOrderState | null {
  try {
    const stored = storage()?.getItem(STORAGE_KEY)
    if (!stored) return null

    const state: StoredEnvelope = JSON.parse(stored)

    if (state.timestamp && Date.now() - state.timestamp > EXPIRY_TIME) {
      clearDataOrderState()
      return null
    }

    return state.formData ?? null
  } catch (error) {
    console.error("Failed to load data order state:", error)
    return null
  }
}

export function clearDataOrderState(): void {
  try {
    storage()?.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear data order state:", error)
  }
}
