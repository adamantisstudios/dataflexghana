"use client"

import { useEffect, useState, useRef } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function DevConsoleDetector() {
  const [showWarning, setShowWarning] = useState(false)
  const lastDetectionRef = useRef<number>(0)
  const DEBOUNCE_INTERVAL = 5000
  const consoleOpenRef = useRef(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return
    }

    const detectDevTools = () => {
      const threshold = 160
      let devToolsOpen = false

      // Method 1: Check console.log performance
      const start = performance.now()
      console.log("")
      const end = performance.now()

      if (end - start > threshold) {
        devToolsOpen = true
      }

      // Method 2: Check for debugger statement
      if (!devToolsOpen) {
        const checkDebugger = () => {
          const start = performance.now()
          debugger
          const end = performance.now()
          return end - start > threshold
        }
        if (checkDebugger()) {
          devToolsOpen = true
        }
      }

      // Method 3: Check window size changes (common when opening dev tools)
      if (
        !devToolsOpen &&
        (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200)
      ) {
        devToolsOpen = true
      }

      return devToolsOpen
    }

    // Check on load
    if (detectDevTools()) {
      consoleOpenRef.current = true
      setShowWarning(true)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.key === "Shift" && e.key === "K")
      ) {
        e.preventDefault()
        consoleOpenRef.current = true
        setShowWarning(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastDetectionRef.current > DEBOUNCE_INTERVAL) {
        lastDetectionRef.current = now
        if (detectDevTools()) {
          if (!consoleOpenRef.current) {
            consoleOpenRef.current = true
            setShowWarning(true)
          }
        } else {
          consoleOpenRef.current = false
        }
      }
    }, 1000)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearInterval(interval)
    }
  }, [])

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <AlertDialogTitle className="text-red-600">Security Warning</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="space-y-3">
          <div className="font-semibold text-gray-900">
            ⚠️ We are monitoring any unusual or illegal activities on this platform.
          </div>
          <div className="text-gray-700">
            You must be aware and avoid any illegal or forbidden exploit. We will track you down based on applicable
            laws and our terms and conditions.
          </div>
          <p className="text-sm text-gray-600">
            Unauthorized access attempts, data manipulation, or any form of exploitation will result in legal action and
            permanent account termination.
          </p>
        </AlertDialogDescription>
        <div className="flex gap-2 justify-end pt-4">
          <Button onClick={() => setShowWarning(false)} className="bg-red-600 hover:bg-red-700 text-white">
            I Understand
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
