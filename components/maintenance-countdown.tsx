"use client"

import { useEffect, useState } from "react"
import { formatTimeRemaining, type MaintenanceMode } from "@/lib/maintenance-mode"

interface MaintenanceCountdownProps {
  maintenanceData: MaintenanceMode
}

export default function MaintenanceCountdown({ maintenanceData }: MaintenanceCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof formatTimeRemaining> | null>(null)

  useEffect(() => {
    if (!maintenanceData.countdownEnabled || !maintenanceData.countdownEndTime) {
      return
    }

    const updateCountdown = () => {
      setTimeRemaining(formatTimeRemaining(maintenanceData.countdownEndTime!))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [maintenanceData.countdownEnabled, maintenanceData.countdownEndTime])

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && !data.data.isEnabled) {
            window.location.href = "/"
          }
        }
      } catch {
        /* ignore polling errors */
      }
    }

    const interval = setInterval(checkMaintenanceStatus, 30000)
    const initialCheck = setTimeout(checkMaintenanceStatus, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(initialCheck)
    }
  }, [])

  if (!maintenanceData.countdownEnabled || !maintenanceData.countdownEndTime) {
    return null
  }

  if (!timeRemaining || timeRemaining.total <= 0) {
    const fallbackDate =
      maintenanceData.estimatedCompletion || maintenanceData.countdownEndTime
    if (fallbackDate) {
      const label = new Date(fallbackDate).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Accra",
      })
      return (
        <div className="mt-8 rounded-lg border border-white/10 bg-white/10 px-5 py-4">
          <p className="text-sm uppercase tracking-wider text-slate-300">Estimated completion</p>
          <p className="mt-1 text-xl font-semibold text-white">{label}</p>
        </div>
      )
    }

    return (
      <div className="mt-8 rounded-lg border border-white/10 bg-white/10 px-5 py-4">
        <p className="text-sm uppercase tracking-wider text-slate-300">Estimated completion</p>
        <p className="mt-1 text-xl font-semibold text-white">Completing soon</p>
      </div>
    )
  }

  return (
    <div className="mt-8 w-full max-w-xl">
      <p className="mb-4 text-sm uppercase tracking-wider text-slate-300">Time remaining</p>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Days", value: timeRemaining.days },
          { label: "Hours", value: timeRemaining.hours },
          { label: "Minutes", value: timeRemaining.minutes },
          { label: "Seconds", value: timeRemaining.seconds },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-4"
          >
            <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {item.value.toString().padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-300">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
