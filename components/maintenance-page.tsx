"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Database,
  Zap,
  Smartphone,
  Monitor,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react"
import { formatTimeRemaining, type MaintenanceMode } from "@/lib/maintenance-mode"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SUPPORT_PHONE_E164 = "233246827049"
const SUPPORT_PHONE_DISPLAY = "+233 24 682 7049"
const SUPPORT_EMAIL = "sales.dataflex@gmail.com"

interface MaintenancePageProps {
  maintenanceData: MaintenanceMode
}

type TimeParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function emptyTime(): TimeParts {
  return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
}

export default function MaintenancePage({ maintenanceData }: MaintenancePageProps) {
  const [endTime, setEndTime] = useState<string | null>(
    maintenanceData.countdownEnabled ? maintenanceData.countdownEndTime ?? null : null,
  )
  const [countdownEnabled, setCountdownEnabled] = useState(Boolean(maintenanceData.countdownEnabled))
  const [estimatedCompletion, setEstimatedCompletion] = useState(
    maintenanceData.estimatedCompletion ?? null,
  )
  const [timeRemaining, setTimeRemaining] = useState<TimeParts>(() =>
    maintenanceData.countdownEnabled && maintenanceData.countdownEndTime
      ? formatTimeRemaining(maintenanceData.countdownEndTime)
      : emptyTime(),
  )
  const [contactOpen, setContactOpen] = useState(false)
  const [hasReloaded, setHasReloaded] = useState(false)
  const checkingRef = useRef(false)

  const tick = useCallback(() => {
    if (!countdownEnabled || !endTime) {
      setTimeRemaining(emptyTime())
      return
    }
    setTimeRemaining(formatTimeRemaining(endTime))
  }, [countdownEnabled, endTime])

  // Live second-by-second countdown — deps only on the timer source
  useEffect(() => {
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  // Poll maintenance status + refreshed admin countdown end time
  useEffect(() => {
    const checkStatus = async () => {
      if (checkingRef.current || hasReloaded) return
      checkingRef.current = true
      try {
        const response = await fetch(`/api/maintenance?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })
        if (!response.ok) return
        const data = await response.json()
        if (!data.success || !data.data) return

        if (!data.data.isEnabled) {
          setHasReloaded(true)
          if ("caches" in window) {
            caches.delete("maintenance-cache").catch(() => {})
          }
          setTimeout(() => {
            window.location.href = "/"
          }, 800)
          return
        }

        setCountdownEnabled(Boolean(data.data.countdownEnabled))
        setEstimatedCompletion(data.data.estimatedCompletion ?? null)
        if (data.data.countdownEnabled && data.data.countdownEndTime) {
          setEndTime(data.data.countdownEndTime)
        }
      } catch (error) {
        console.error("Error checking maintenance status:", error)
      } finally {
        checkingRef.current = false
      }
    }

    const initial = setTimeout(checkStatus, 3000)
    const interval = setInterval(checkStatus, 20000)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [hasReloaded])

  const showLiveCountdown = countdownEnabled && Boolean(endTime)
  const isLive = showLiveCountdown && timeRemaining.total > 0

  const units = [
    { label: "Days", value: timeRemaining.days },
    { label: "Hours", value: timeRemaining.hours },
    { label: "Minutes", value: timeRemaining.minutes },
    { label: "Seconds", value: timeRemaining.seconds },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-zinc-100 to-stone-200 relative overflow-hidden">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="max-w-6xl w-full">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
            {/* Dark hero — no photo, no white-on-white */}
            <div className="relative min-h-[14rem] sm:min-h-[18rem] md:min-h-[22rem] bg-gradient-to-br from-zinc-900 via-slate-800 to-zinc-900">
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, #94a3b8 0%, transparent 40%), radial-gradient(circle at 80% 60%, #64748b 0%, transparent 35%)",
                }}
              />
              <div className="absolute top-3 left-3 sm:top-6 sm:left-6 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/15">
                <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
              </div>
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/15">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
              </div>
              <div className="relative flex items-center justify-center px-4 py-10 sm:py-14 md:py-16">
                <div className="text-center max-w-4xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-white/20 shadow-xl">
                    <Wrench className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-amber-300" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-tight leading-tight text-white drop-shadow-lg">
                    {maintenanceData.title}
                  </h1>
                  <p className="text-sm sm:text-lg md:text-xl text-slate-200 font-medium mb-4">
                    DataFlex Ghana Platform
                  </p>
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-black/30 backdrop-blur-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/15">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                    <span className="text-sm sm:text-base font-semibold text-white">
                      Scheduled Maintenance in Progress
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16">
              <div className="flex justify-center mb-8 sm:mb-12">
                <div className="relative bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-100">
                  <Image
                    src="/images/logo-new.png"
                    alt="DataFlex Ghana Logo"
                    width={160}
                    height={50}
                    className="h-8 sm:h-10 md:h-12 w-auto"
                  />
                </div>
              </div>

              <div className="text-center mb-8 sm:mb-12">
                <div className="max-w-4xl mx-auto">
                  <p className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed mb-6 sm:mb-8 font-light px-2">
                    {maintenanceData.message}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 bg-amber-100 text-amber-900 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                      <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Desktop &amp; Mobile</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                      <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>All Platforms Affected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live countdown */}
              {showLiveCountdown && (
                <div className="mb-12 sm:mb-16">
                  <div className="text-center mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-600" />
                      <span>{isLive ? "Time Remaining" : "Estimated Completion"}</span>
                    </h3>
                    <p className="text-slate-500 text-sm sm:text-base">
                      {isLive
                        ? "Live countdown · updates every second"
                        : "Maintenance is taking a little longer than expected. Thank you for your patience."}
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {units.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-slate-200 bg-slate-900 text-center px-2 py-4 sm:px-4 sm:py-6 shadow-lg"
                        >
                          <div
                            className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white tabular-nums font-mono transition-opacity duration-200"
                            key={`${item.label}-${item.value}`}
                          >
                            {item.value.toString().padStart(2, "0")}
                          </div>
                          <div className="mt-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isLive && (estimatedCompletion || endTime) && (
                      <p className="mt-5 text-center text-sm sm:text-base text-slate-600">
                        Target:{" "}
                        <span className="font-semibold text-slate-800">
                          {new Date(estimatedCompletion || endTime!).toLocaleString("en-GB", {
                            dateStyle: "full",
                            timeStyle: "short",
                            timeZone: "Africa/Accra",
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!showLiveCountdown && estimatedCompletion && (
                <div className="mb-12 sm:mb-16 text-center">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-2 sm:gap-3">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-600" />
                    <span>Estimated Completion</span>
                  </h3>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800">
                    {new Date(estimatedCompletion).toLocaleString("en-GB", {
                      dateStyle: "full",
                      timeStyle: "short",
                      timeZone: "Africa/Accra",
                    })}
                  </p>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-amber-200/50 shadow-lg">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    <span>What We&apos;re Working On</span>
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      {
                        icon: Database,
                        title: "System Optimization",
                        desc: "Improving platform performance and speed",
                      },
                      { icon: Shield, title: "Security Updates", desc: "Enhancing platform security measures" },
                      {
                        icon: Database,
                        title: "Database Maintenance",
                        desc: "Optimizing data storage and retrieval",
                      },
                      {
                        icon: Zap,
                        title: "Feature Enhancements",
                        desc: "Adding new capabilities for better experience",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">{item.title}</p>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-emerald-200/50 shadow-lg">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    <span>Your Data &amp; Orders Are Safe</span>
                  </h3>
                  <div className="space-y-4 sm:space-y-6">
                    {[
                      {
                        icon: CheckCircle,
                        title: "Pending Orders",
                        desc: "All pending orders will be processed once maintenance is complete",
                      },
                      {
                        icon: Shield,
                        title: "Account Data",
                        desc: "Your account information and earnings are completely secure",
                      },
                      {
                        icon: Database,
                        title: "Transactions",
                        desc: "All financial transactions will resume automatically",
                      },
                    ].map((item) => (
                      <div key={item.title} className="text-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-sm">
                          <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
                        </div>
                        <p className="font-semibold text-slate-800 mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</p>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed px-2">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gradient-to-r from-slate-50 to-zinc-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 border border-slate-200/60 shadow-lg">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">
                    Need Urgent Assistance?
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base md:text-lg px-4">
                    Our support team is standing by to help you
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="flex items-center justify-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-slate-100 group text-left"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm sm:text-base">Call or WhatsApp</p>
                      <p className="text-emerald-700 font-medium text-sm sm:text-base truncate">
                        {SUPPORT_PHONE_DISPLAY}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Tap to choose</p>
                    </div>
                  </button>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="flex items-center justify-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-slate-100 group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-sky-700" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm sm:text-base">Email Us</p>
                      <p className="text-sky-700 font-medium text-xs sm:text-sm md:text-base truncate">
                        {SUPPORT_EMAIL}
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 text-slate-500 bg-slate-100/90 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="font-medium text-xs sm:text-sm md:text-base text-center">
                    This page will automatically refresh when maintenance is complete
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 text-slate-500">
            <p className="text-sm sm:text-base md:text-lg">
              &copy; {new Date().getFullYear()} DataFlex Ghana. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Contact us</DialogTitle>
            <DialogDescription>
              Choose how you want to reach {SUPPORT_PHONE_DISPLAY}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <a
              href={`https://wa.me/${SUPPORT_PHONE_E164}?text=${encodeURIComponent(
                "Hello DataFlex Ghana, I need assistance during maintenance.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-emerald-900 hover:bg-emerald-100 transition-colors"
              onClick={() => setContactOpen(false)}
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">WhatsApp</p>
                <p className="text-xs text-emerald-800/80">Send a message</p>
              </div>
            </a>
            <a
              href={`tel:+${SUPPORT_PHONE_E164}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 hover:bg-slate-100 transition-colors"
              onClick={() => setContactOpen(false)}
            >
              <Phone className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Call</p>
                <p className="text-xs text-slate-600">Phone dialer</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
