'use client'

import { useEffect, useRef } from 'react'

interface SuspiciousActivityDetectorOptions {
  enabled?: boolean
  onSuspiciousActivity?: (activityType: string) => void
}

export function useSuspiciousActivityDetector(options: SuspiciousActivityDetectorOptions = {}) {
  const { enabled = true, onSuspiciousActivity } = options
  const detectionTriggeredRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    let devtoolsOpen = false

    const detectDevtools = () => {
      const element = new Image()
      Object.defineProperty(element, 'id', {
        get: () => {
          if (!devtoolsOpen) {
            devtoolsOpen = true
            onSuspiciousActivity?.('devtools_console')
            console.warn('[v0] Developer console detected - suspicious activity flagged')
          }
        },
      })
      console.log('%c', element)
    }

    const detectDevtoolsViaPerformance = () => {
      const start = performance.now()
      debugger
      const end = performance.now()

      // If debugger statement was interrupted by dev tools, the time difference will be significant
      if (end - start > 100) {
        if (!devtoolsOpen) {
          devtoolsOpen = true
          onSuspiciousActivity?.('devtools_debugger')
          console.warn('[v0] Debugger/DevTools detected via performance timing')
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey

      // Check for common developer shortcuts
      const suspiciousShortcuts = [
        { key: 'F12', name: 'F12 (DevTools)' },
        { key: 'I', name: 'Ctrl+Shift+I (Inspect)' },
        { key: 'J', name: 'Ctrl+Shift+J (Console)' },
        { key: 'C', name: 'Ctrl+Shift+C (Inspector)' },
        { key: 'U', name: 'Ctrl+U (View Source)' },
      ]

      for (const shortcut of suspiciousShortcuts) {
        let isMatch = false

        if (shortcut.key === 'F12' && event.key === 'F12') {
          isMatch = true
        } else if (isCtrlOrCmd && event.shiftKey) {
          if (
            (shortcut.key === 'I' && event.key.toUpperCase() === 'I') ||
            (shortcut.key === 'J' && event.key.toUpperCase() === 'J') ||
            (shortcut.key === 'C' && event.key.toUpperCase() === 'C')
          ) {
            isMatch = true
          }
        } else if (isCtrlOrCmd && !event.shiftKey && shortcut.key === 'U' && event.key.toUpperCase() === 'U') {
          isMatch = true
        }

        if (isMatch) {
          event.preventDefault()
          if (!devtoolsOpen) {
            devtoolsOpen = true
            onSuspiciousActivity?.(`keyboard_shortcut_${shortcut.key}`)
            console.warn(`[v0] Suspicious keyboard shortcut detected: ${shortcut.name}`)
          }
          return false
        }
      }
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown)

    // Run initial devtools detection (runs once)
    // Note: This is a lighter detection that doesn't block user interaction
    setTimeout(() => {
      if (enabled) {
        detectDevtools()
      }
    }, 500)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onSuspiciousActivity])
}
