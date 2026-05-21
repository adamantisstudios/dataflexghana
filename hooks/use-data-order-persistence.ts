"use client"

import { useEffect, useCallback } from "react"
import {
  saveDataOrderState,
  loadDataOrderState,
  clearDataOrderState,
  type DataOrderState,
} from "@/lib/data-order-persistence"

/** Persist manual/wallet order draft immediately (no debounce — survives quick tab close on mobile). */
export function useDataOrderPersistence(data: DataOrderState | null | undefined) {
  useEffect(() => {
    if (!data) return
    saveDataOrderState(data)
  }, [data])

  const saveOrderState = useCallback((payload: DataOrderState) => {
    saveDataOrderState(payload)
  }, [])

  const restoreOrderState = useCallback(() => {
    return loadDataOrderState()
  }, [])

  const clearOrderState = useCallback(() => {
    clearDataOrderState()
  }, [])

  return {
    saveOrderState,
    restoreOrderState,
    clearOrderState,
  }
}
