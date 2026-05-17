"use client"

import { useEffect, useCallback } from "react"
import {
  saveDataOrderState,
  loadDataOrderState,
  clearDataOrderState,
  type DataOrderState,
} from "@/lib/data-order-persistence"

export function useDataOrderPersistence(data: DataOrderState | null | undefined) {
  useEffect(() => {
    if (!data) return
    const timeoutId = setTimeout(() => {
      saveDataOrderState(data)
    }, 400)
    return () => clearTimeout(timeoutId)
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
