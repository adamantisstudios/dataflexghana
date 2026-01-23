interface DataOrderState {
  formData?: any
  timestamp?: number
}

const STORAGE_KEY = "dataOrderFormState"
const EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes

export function saveDataOrderState(data: any): void {
  try {
    const state: DataOrderState = {
      formData: data,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to save data order state:", error)
  }
}

export function loadDataOrderState(): any | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const state: DataOrderState = JSON.parse(stored)

    // Check if data has expired
    if (state.timestamp && Date.now() - state.timestamp > EXPIRY_TIME) {
      clearDataOrderState()
      return null
    }

    return state.formData
  } catch (error) {
    console.error("Failed to load data order state:", error)
    return null
  }
}

export function clearDataOrderState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear data order state:", error)
  }
}
