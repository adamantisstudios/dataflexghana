export interface DataOrderState {
  bundleId?: string
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
const STORAGE_BACKUP_KEY = "dataOrderFormState_backup"
const EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes

function storage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage
}

function backupStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function writeEnvelope(envelope: StoredEnvelope): void {
  const payload = JSON.stringify(envelope)
  storage()?.setItem(STORAGE_KEY, payload)
  backupStorage()?.setItem(STORAGE_BACKUP_KEY, payload)
}

function readEnvelope(): StoredEnvelope | null {
  const raw =
    storage()?.getItem(STORAGE_KEY) ?? backupStorage()?.getItem(STORAGE_BACKUP_KEY) ?? null
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredEnvelope
  } catch {
    return null
  }
}

export function saveDataOrderState(data: DataOrderState): void {
  try {
    const bundleId =
      data.bundleId ||
      (data.selectedBundle && typeof data.selectedBundle === "object" && "id" in data.selectedBundle
        ? String((data.selectedBundle as { id: string }).id)
        : undefined)

    const state: StoredEnvelope = {
      formData: {
        ...data,
        bundleId,
      },
      timestamp: Date.now(),
    }
    writeEnvelope(state)
  } catch (error) {
    console.error("Failed to save data order state:", error)
  }
}

export function loadDataOrderState(): DataOrderState | null {
  try {
    const state = readEnvelope()
    if (!state?.formData) return null

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
    storage()?.removeItem(STORAGE_KEY)
    backupStorage()?.removeItem(STORAGE_BACKUP_KEY)
  } catch (error) {
    console.error("Failed to clear data order state:", error)
  }
}

export function hasInProgressDataOrder(state: DataOrderState | null): boolean {
  if (!state) return false
  return Boolean(
    state.bundleId ||
      state.selectedBundle ||
      state.recipientPhone?.trim() ||
      state.generatedReference?.trim() ||
      state.orderDetails,
  )
}
