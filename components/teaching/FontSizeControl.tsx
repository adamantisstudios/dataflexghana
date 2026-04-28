"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FontSizeControlProps {
  onFontSizeChange: (size: number) => void
  initialSize?: number
}

export function FontSizeControl({ onFontSizeChange, initialSize = 16 }: FontSizeControlProps) {
  const [fontSize, setFontSize] = useState(initialSize)
  const [isVisible, setIsVisible] = useState(true)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`)
    document.body.style.fontSize = `${fontSize}px`
  }, [fontSize])

  const resetIdleTimer = useCallback(() => {
    // Show the control when user is active
    setIsVisible(true)

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    // Set new timer to hide after 7 seconds of inactivity
    idleTimerRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 7000)
  }, [])

  useEffect(() => {
    // Listen for user activity
    window.addEventListener("mousemove", resetIdleTimer)
    window.addEventListener("mousedown", resetIdleTimer)
    window.addEventListener("keydown", resetIdleTimer)
    window.addEventListener("touchstart", resetIdleTimer)
    window.addEventListener("scroll", resetIdleTimer)

    // Initial timer
    resetIdleTimer()

    return () => {
      window.removeEventListener("mousemove", resetIdleTimer)
      window.removeEventListener("mousedown", resetIdleTimer)
      window.removeEventListener("keydown", resetIdleTimer)
      window.removeEventListener("touchstart", resetIdleTimer)
      window.removeEventListener("scroll", resetIdleTimer)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [resetIdleTimer])

  const handleIncrease = () => {
    const newSize = Math.min(fontSize + 2, 32)
    setFontSize(newSize)
    onFontSizeChange(newSize)
  }

  const handleDecrease = () => {
    const newSize = Math.max(fontSize - 2, 12)
    setFontSize(newSize)
    onFontSizeChange(newSize)
  }

  const handleReset = () => {
    setFontSize(initialSize)
    onFontSizeChange(initialSize)
  }

  return (
    <div
      className={`fixed bottom-3 right-3 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-40 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-6 p-0 bg-transparent"
        onClick={handleDecrease}
        title="Decrease font size"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="text-xs font-medium text-gray-700 w-6 text-center text-xs">{fontSize}px</span>
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-6 p-0 bg-transparent"
        onClick={handleIncrease}
        title="Increase font size"
      >
        <Plus className="h-3 w-3" />
      </Button>
      <div className="w-px h-4 bg-gray-200" />
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-1 text-xs bg-transparent"
        onClick={handleReset}
        title="Reset font size"
      >
        Reset
      </Button>
    </div>
  )
}
