"use client"
import { useState, useEffect } from "react"
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
} from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emerald-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 md:w-80 md:h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 md:w-80 md:h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="max-w-6xl w-full">
          {/* Main Content Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            {/* Header Section with Hero Image */}
            <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-r from-yellow-400 via-green-500 to-emerald-600">
              <div className="absolute inset-0 bg-black/60"></div>
              <Image
                src="/images/hero-main-new.jpg"
                alt="DataFlex Ghana"
                fill
                className="object-cover mix-blend-overlay"
                priority
              />
              {/* Floating Elements */}
              <div className="absolute top-3 left-3 sm:top-6 sm:left-6 w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center animate-bounce">
                <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center animate-pulse">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-4xl px-3 sm:px-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-2 border-white/40 shadow-2xl">
                    <Wrench className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-white animate-pulse" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-4 drop-shadow-2xl tracking-tight leading-tight text-white">
                    {maintenanceData.title}
                  </h1>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-medium mb-2 sm:mb-4 drop-shadow-lg">
                    DataFlex Ghana Platform
                  </p>
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-white/30">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse" />
                    <span className="text-sm sm:text-lg font-semibold text-white drop-shadow-md">
                      Scheduled Maintenance in Progress
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Content Section */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16">
              {/* Logo Section */}
              <div className="flex justify-center mb-8 sm:mb-12">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-white p-3 sm:p-4 rounded-2xl shadow-xl">
                    <Image
                      src="/images/logo-new.png"
                      alt="DataFlex Ghana Logo"
                      width={160}
                      height={50}
                      className="h-8 sm:h-10 md:h-12 w-auto"
                    />
                  </div>
                </div>
              </div>
              {/* Main Message */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="max-w-4xl mx-auto">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 leading-relaxed mb-6 sm:mb-8 font-light px-2">
                    {maintenanceData.message}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                      <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="whitespace-nowrap">Desktop & Mobile</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                      <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="whitespace-nowrap">All Platforms Affected</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Enhanced Countdown Timer */}
              {maintenanceData.countdownEnabled &&
                maintenanceData.countdownEndTime &&
                timeRemaining &&
                timeRemaining.total > 0 && (
                  <div className="mb-12 sm:mb-16">
                    <div className="text-center mb-6 sm:mb-8">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                        <span>Estimated Time Remaining</span>
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">
                        We're working hard to get everything back online
                      </p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {[
                          { label: "Days", value: timeRemaining.days, color: "from-red-500 to-pink-600" },
                          { label: "Hours", value: timeRemaining.hours, color: "from-yellow-500 to-orange-600" },
                          { label: "Minutes", value: timeRemaining.minutes, color: "from-green-500 to-emerald-600" },
                          { label: "Seconds", value: timeRemaining.seconds, color: "from-blue-500 to-indigo-600" },
                        ].map((item, index) => (
                          <div key={index} className="group">
                            <div
                              className={`bg-gradient-to-br ${item.color} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white text-center shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl`}
                            >
                              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 font-mono">
                                {item.value.toString().padStart(2, "0")}
                              </div>
                              <div className="text-xs sm:text-sm md:text-base font-semibold opacity-90 uppercase tracking-wider">
                                {item.label}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              {/* Enhanced Status Updates */}
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-yellow-200/50 shadow-xl">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                    <span>What We're Working On</span>
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      {
                        icon: Database,
                        title: "System Optimization",
                        desc: "Improving platform performance and speed",
                      },
                      { icon: Shield, title: "Security Updates", desc: "Enhancing platform security measures" },
                      { icon: Database, title: "Database Maintenance", desc: "Optimizing data storage and retrieval" },
                      {
                        icon: Zap,
                        title: "Feature Enhancements",
                        desc: "Adding new capabilities for better experience",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 sm:gap-4 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
                          <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{item.title}</p>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-green-200/50 shadow-xl">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 flex-wrap">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <span>Your Data & Orders Are Safe</span>
                  </h3>
                  <div className="space-y-4 sm:space-y-6">
                    {[
                      {
                        icon: CheckCircle,
                        title: "Pending Orders",
                        desc: "All pending orders will be processed once maintenance is complete",
                        color: "blue",
                      },
                      {
                        icon: Shield,
                        title: "Account Data",
                        desc: "Your account information and earnings are completely secure",
                        color: "green",
                      },
                      {
                        icon: Database,
                        title: "Transactions",
                        desc: "All financial transactions will resume automatically",
                        color: "purple",
                      },
                    ].map((item, index) => (
                      <div key={index} className="text-center group">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-${item.color}-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-${item.color}-200 transition-colors shadow-lg`}
                        >
                          <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-${item.color}-600`} />
                        </div>
                        <p className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</p>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed px-2">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Enhanced Contact Information */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 border border-gray-200/50 shadow-xl">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                    Need Urgent Assistance?
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">
                    Our support team is standing by to help you
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                  <a
                    href="tel:+233242799990"
                    className="flex items-center justify-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Call Us</p>
                      <p className="text-green-600 font-medium text-sm sm:text-base truncate">+233-24-279-9990</p>
                    </div>
                  </a>
                  <a
                    href="mailto:support@dataflexghana.com"
                    className="flex items-center justify-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Email Us</p>
                      <p className="text-blue-600 font-medium text-xs sm:text-sm md:text-base truncate">
                        support@dataflexghana.com
                      </p>
                    </div>
                  </a>
                </div>
              </div>
              {/* Auto-refresh Notice */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 text-gray-500 bg-gray-100/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-lg">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="font-medium text-xs sm:text-sm md:text-base text-center">
                    This page will automatically refresh when maintenance is complete
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8 text-gray-500">
            <p className="text-sm sm:text-base md:text-lg">&copy; 2025 DataFlex Ghana. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
