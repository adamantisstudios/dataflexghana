"use client"

import { useEffect, useCallback } from "react"
import { saveDataOrderState, loadDataOrderState, clearDataOrderState } from "@/lib/data-order-persistence"

export function useDataOrderPersistence(data: any) {
  // Load persisted data on mount
  useEffect(() => {
    const loadedData = loadDataOrderState()
    if (loadedData) {
      // Call the restoreOrderState function instead of directly using onLoad
      restoreOrderState()
    }
  }, [])

  // Auto-save data when it changes
  useEffect(() => {
    if (data) {
      const timeoutId = setTimeout(() => {
        saveOrderState(data)
      }, 500) // Debounce saves

      return () => clearTimeout(timeoutId)
    }
  }, [data])

  const saveOrderState = useCallback((data: any) => {
    saveDataOrderState(data)
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
