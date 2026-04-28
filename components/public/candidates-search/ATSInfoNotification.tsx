"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const ATS_NOTIFICATION_KEY = "ats_notification_shown"
const ATS_TRIGGERED_KEY = "ats_notification_triggered"

interface ATSInfoNotificationProps {
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export default function ATSInfoNotification({ searchInputRef }: ATSInfoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenerRef = useRef<((e: Event) => void) | null>(null)

  useEffect(() => {
    const lastShown = localStorage.getItem(ATS_NOTIFICATION_KEY)
    const today = new Date().toISOString().split("T")[0]
    const wasTriggeredToday = localStorage.getItem(ATS_TRIGGERED_KEY) === today

    if (lastShown !== today && !wasTriggeredToday) {
      setHasTriggered(false)
    } else {
      setHasTriggered(true)
    }
  }, [])

  useEffect(() => {
    if (!searchInputRef?.current || hasTriggered) return

    eventListenerRef.current = (e: Event) => {
      const input = e.target as HTMLInputElement

      // Only trigger if user actually typed something
      if (input.value.length > 0 && !hasTriggered) {
        console.log("[v0] Search input detected - triggering ATS notification")

        // Mark as triggered for today
        const today = new Date().toISOString().split("T")[0]
        localStorage.setItem(ATS_TRIGGERED_KEY, today)
        localStorage.setItem(ATS_NOTIFICATION_KEY, today)
        setHasTriggered(true)

        // Show notification
        setIsVisible(true)

        // Play audio with user interaction context (typing counts as interaction)
        if (audioRef.current) {
          // Reset audio to start
          audioRef.current.currentTime = 0
          const playPromise = audioRef.current.play()

          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error("[v0] Audio autoplay failed, attempting with retry:", error)
              // Retry with a small delay in case browser needed more time
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.play().catch((err) => {
                    console.error("[v0] Audio retry failed:", err)
                  })
                }
              }, 100)
            })
          }
        }

        // Schedule auto-hide after 15 seconds
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false)
        }, 15000)

        // Remove event listener after first trigger to prevent multiple notifications
        if (searchInputRef.current && eventListenerRef.current) {
          searchInputRef.current.removeEventListener("input", eventListenerRef.current)
        }
      }
    }

    const input = searchInputRef.current
    input.addEventListener("input", eventListenerRef.current)

    return () => {
      if (input && eventListenerRef.current) {
        input.removeEventListener("input", eventListenerRef.current)
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [searchInputRef, hasTriggered])

  const handleClose = () => {
    const today = new Date().toISOString().split("T")[0]
    localStorage.setItem(ATS_NOTIFICATION_KEY, today)
    setIsVisible(false)

    if (searchInputRef?.current && eventListenerRef.current) {
      searchInputRef.current.removeEventListener("input", eventListenerRef.current)
    }
  }

  if (!isVisible) return null

  return (
    <>
      <audio ref={audioRef} src="/images/notification.mp3" preload="auto" />
      <div className="fixed bottom-4 right-4 max-w-sm animate-in slide-in-from-bottom-4 z-50">
        <div className="bg-white rounded-lg border border-blue-200 shadow-lg p-4 flex gap-3">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">ATS Score Explained</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              The ATS Score (1-10) shows how relevant each candidate is to your search query. Higher scores indicate
              better matches. Use this to quickly identify the most suitable candidates.
            </p>
          </div>
          <Button size="sm" variant="ghost" className="flex-shrink-0 h-6 w-6 p-0" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
