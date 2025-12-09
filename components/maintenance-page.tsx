"use client"
import { useState, useEffect } from "react"
import { Clock, Wrench, CheckCircle, RefreshCw, Shield, Phone, Mail } from "lucide-react"
import { formatTimeRemaining, type MaintenanceMode } from "@/lib/maintenance-mode"

interface MaintenancePageProps {
  maintenanceData: MaintenanceMode
}

export default function MaintenancePage({ maintenanceData }: MaintenancePageProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [hasReloaded, setHasReloaded] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Separate effect for maintenance status checking
  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout

    const checkMaintenanceStatus = async () => {
      if (isCheckingStatus || hasReloaded) return

      try {
        setIsCheckingStatus(true)
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

          // If maintenance is disabled, reload the page
          if (data.success && !data.data.isEnabled) {
            console.log("Maintenance disabled, reloading page...")
            setHasReloaded(true)

            // Clear any cached data
            if ("caches" in window) {
              caches.delete("maintenance-cache").catch(() => {})
            }

            // Add a small delay to prevent rapid reloads
            setTimeout(() => {
              window.location.href = "/"
            }, 1000)
          }
        }
      } catch (error) {
        console.error("Error checking maintenance status:", error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    // Check maintenance status every 30 seconds
    statusCheckInterval = setInterval(checkMaintenanceStatus, 30000)

    // Initial check after 5 seconds
    const initialCheck = setTimeout(checkMaintenanceStatus, 5000)

    return () => {
      clearInterval(statusCheckInterval)
      clearTimeout(initialCheck)
    }
  }, [isCheckingStatus, hasReloaded])

  // Countdown effect
  useEffect(() => {
    if (!maintenanceData.countdownEnabled || !maintenanceData.countdownEndTime) {
      return
    }

    const updateCountdown = () => {
      const remaining = formatTimeRemaining(maintenanceData.countdownEndTime!)
      setTimeRemaining(remaining)

      // If countdown is finished, check maintenance status
      if (remaining.total <= 0 && !hasReloaded && !isCheckingStatus) {
        console.log("Countdown finished, checking maintenance status...")
        setIsCheckingStatus(true)

        // Check maintenance status after countdown ends
        fetch("/api/maintenance", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success && !data.data.isEnabled) {
              console.log("Maintenance disabled after countdown, reloading...")
              setHasReloaded(true)

              // Clear caches
              if ("caches" in window) {
                caches.delete("maintenance-cache").catch(() => {})
              }

              setTimeout(() => {
                window.location.href = "/"
              }, 2000)
            } else {
              console.log("Maintenance still enabled after countdown")
              setIsCheckingStatus(false)
            }
          })
          .catch((error) => {
            console.error("Error checking maintenance after countdown:", error)
            setIsCheckingStatus(false)
          })
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [maintenanceData.countdownEnabled, maintenanceData.countdownEndTime, hasReloaded, isCheckingStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2s"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4s"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 sm:px-6">
        <div className="max-w-5xl w-full">
          {/* Main Card */}
          <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Hero Header */}
            <div className="relative h-56 sm:h-64 md:h-72 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-pattern"></div>
              <div className="relative h-full flex items-center justify-center px-6">
                <div className="text-center text-white">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                      <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
                    {maintenanceData.title}
                  </h1>
                  <p className="text-white/90 font-medium text-sm sm:text-base">DataFlex Ghana is upgrading</p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 sm:px-8 md:px-12 py-12 sm:py-16">
              {/* Message */}
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                  {maintenanceData.message}
                </p>
              </div>

              {/* Countdown Timer */}
              {maintenanceData.countdownEnabled &&
                maintenanceData.countdownEndTime &&
                timeRemaining &&
                timeRemaining.total > 0 && (
                  <div className="mb-12 sm:mb-16">
                    <h3 className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-8 flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      Estimated Time Remaining
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Days", value: timeRemaining.days, bgColor: "from-red-500 to-pink-500" },
                        {
                          label: "Hours",
                          value: timeRemaining.hours,
                          bgColor: "from-orange-500 to-yellow-500",
                        },
                        {
                          label: "Minutes",
                          value: timeRemaining.minutes,
                          bgColor: "from-emerald-500 to-cyan-500",
                        },
                        {
                          label: "Seconds",
                          value: timeRemaining.seconds,
                          bgColor: "from-blue-500 to-indigo-500",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`bg-gradient-to-br ${item.bgColor} rounded-2xl p-4 sm:p-6 text-white text-center shadow-lg hover:shadow-xl transition-shadow`}
                        >
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono mb-1">
                            {String(item.value).padStart(2, "0")}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold uppercase tracking-wide opacity-90">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Info Grid */}
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-12">
                <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-6 sm:p-8 border border-emerald-200/50">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    What We're Doing
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Optimizing platform performance",
                      "Enhancing security features",
                      "Updating systems and databases",
                      "Improving user experience",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm sm:text-base">
                        <span className="mt-1 w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 sm:p-8 border border-blue-200/50">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Your Data is Safe
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "All orders and transactions are secure",
                      "Account data is protected",
                      "Everything will resume automatically",
                      "No data loss during maintenance",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm sm:text-base">
                        <span className="mt-1 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-10 text-white text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-6">Need Help?</h3>
                <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <a
                    href="tel:+233242799990"
                    className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-xl transition-colors border border-white/20"
                  >
                    <Phone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold uppercase tracking-wide opacity-75">Call Us</div>
                      <div className="font-semibold">+233-24-279-9990</div>
                    </div>
                  </a>
                  <a
                    href="mailto:support@dataflexghana.com"
                    className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-xl transition-colors border border-white/20"
                  >
                    <Mail className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold uppercase tracking-wide opacity-75">Email Us</div>
                      <div className="font-semibold">support@dataflexghana.com</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Auto Refresh Notice */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-full text-sm font-medium border border-gray-200">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  This page will auto-refresh when we're back online
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-8">© 2025 DataFlex Ghana. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
