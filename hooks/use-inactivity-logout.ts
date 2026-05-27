'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAgent } from '@/lib/unified-auth-system'

interface UseInactivityLogoutOptions {
  timeoutMinutes?: number // Default: 60 minutes
  showWarningMinutes?: number // Show warning before logout (default: 15 minutes before)
  enabled?: boolean
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    timeoutMinutes = 60,
    showWarningMinutes = 15,
    enabled = true,
  } = options

  const router = useRouter()
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = showWarningMinutes * 60 * 1000

  const handleLogout = () => {
    // Clear all caches and storage
    try {
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear specific localStorage items related to agent session
      const keysToPreserve = ['theme', 'language'] // Keep non-sensitive settings if needed
      const keysToRemove = Object.keys(localStorage).filter(
        key => !keysToPreserve.includes(key)
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear IndexedDB caches if present
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName)
          })
        })
      }
    } catch (error) {
      console.error('[v0] Error clearing caches:', error)
    }
    
    logoutAgent()
    router.push('/agent/login')
  }

  const resetInactivityTimer = () => {
    if (!enabled) return

    lastActivityRef.current = Date.now()

    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)

    if (showWarningMinutes > 0 && timeoutMs > warningMs) {
      warningTimerRef.current = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("inactivity-warning"))
      }, timeoutMs - warningMs)
    }

    inactivityTimerRef.current = setTimeout(() => {
      handleLogout()
    }, timeoutMs)
  }

  useEffect(() => {
    if (!enabled) return

    // Initial timer setup
    resetInactivityTimer()

    // List of activity events to track
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "touchmove", "click"]

    const handleActivity = () => {
      resetInactivityTimer()
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resetInactivityTimer()
      }
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("focus", handleActivity)

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("focus", handleActivity)

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    }
  }, [enabled, timeoutMinutes, showWarningMinutes])

  return { handleLogout }
}
