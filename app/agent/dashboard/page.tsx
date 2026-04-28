"use client"
import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  LogOut,
  Plus,
  MessageCircle,
  Banknote,
  ExternalLink,
  Smartphone,
  Settings,
  Search,
  TrendingUp,
  Package,
  Filter,
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
  Wallet,
  X,
  ShoppingBag,
  PiggyBank,
  Shield,
  ArrowRight,
  Users,
  CreditCard,
  AlertTriangle,
  Lightbulb,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle,
} from "lucide-react"
import DashboardLoginNotification from "@/components/agent/DashboardLoginNotification"
import AgentDashboardNotification from "@/components/agent/AgentDashboardNotification"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/lib/supabase"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { calculateCompleteEarnings } from "@/lib/earnings-calculator"
import { AgentMenuCards } from "@/components/agent/AgentMenuCards"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { FloatingAudioPlayer } from "@/components/floating-audio-player"
import { ProductSlider } from "@/components/agent/ProductSlider"
import AgentPropertiesShowcase from "@/components/agent/dashboard/AgentPropertiesShowcase"
import { ComplianceTab } from "@/components/agent/compliance/ComplianceTab"
import { ProfessionalWritingTab } from "@/components/agent/professional-writing/ProfessionalWritingTab"
import TeachingPlatformPage from "@/app/agent/teaching/page"
import { useAgentDashboardCache } from "@/hooks/use-agent-dashboard-cache"
import { loadAgentDashboardData, loadTabData } from "@/lib/agent-dashboard-loader"
import { DashboardSkeleton } from "@/components/agent/dashboard-skeleton"
import ReferralDashboard from "@/components/agent/referral-program/ReferralDashboard"
import Image from "next/image"
import { ImageModal } from "@/components/ui/image-modal"
import { InactivityNotificationManager } from "@/components/agent/dashboard/InactivityNotificationManager"
import WhatsAppChannelPopup from "@/components/WhatsAppChannelPopup"
import AgentOnlineCoursesDisplay from "@/components/agent/online-courses/AgentOnlineCoursesDisplay"
import AdminPortalAccess from "@/components/agent/AdminPortalAccess"

interface SimpleAgent {
  name: string
  activity: number
  rank: number
}

interface RankingData {
  agents: SimpleAgent[]
  timeframe: string
  total_count: number
  last_updated: string
  fallback?: boolean
}

const safeCommissionDisplay = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0
  }
  return Number(value)
}

const formatDateAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval >= 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval >= 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval >= 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval >= 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval >= 1) return Math.floor(interval) + " minutes ago"
  return Math.floor(seconds) + " seconds ago"
}

const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export default function AgentDashboard() {
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWhatsAppPopup(true)
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [])

  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [expandedReferrals, setExpandedReferrals] = useState<Set<string>>(new Set())
  const [serviceImageIndices, setServiceImageIndices] = useState<Record<string, number>>({})

  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")

  const nextServiceImage = (e: React.MouseEvent, serviceId: string, max: number) => {
    e.stopPropagation()
    setServiceImageIndices((prev) => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) + 1) % max,
    }))
  }

  const prevServiceImage = (e: React.MouseEvent, serviceId: string, max: number) => {
    e.stopPropagation()
    setServiceImageIndices((prev) => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) - 1 + max) % max,
    }))
  }

  const router = useRouter()
  const { getFromCache, setInCache } = useAgentDashboardCache()
  const [agent, setAgent] = useState(null)
  const { unreadCount, getUnreadCount, markAsRead } = useUnreadMessages(agent?.id || "", "agent")
  const [loading, setLoading] = useState(true)
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    totalPaidEarnings: 0,
    pendingPayout: 0,
    availableBalance: 0,
    walletBalance: 0,
    referralCommissions: 0,
    dataOrderCommissions: 0,
    wholesaleCommissions: 0,
  })
  const [tabData, setTabData] = useState({
    referrals: [],
    dataOrders: [],
    wholesaleOrders: [],
    withdrawals: [],
    paidWithdrawals: [],
    services: [],
    dataBundles: [],
    jobs: [],
    onlineCourses: [],
  })
  const [activeTab, setActiveTab] = useState("services")
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({})
  const [tabLoadingStates, setTabLoadingStates] = useState<Record<string, boolean>>({})
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [referralWhatsApp, setReferralWhatsApp] = useState("")
  const [referralWhatsAppError, setReferralWhatsAppError] = useState("")
  const [showDomesticReferralDialog, setShowDomesticReferralDialog] = useState(false)
  const [domesticReferralWhatsApp, setDomesticReferralWhatsApp] = useState("")
  const [domesticReferralWhatsAppError, setDomesticReferralWhatsAppError] = useState("")
  const [showNotification, setShowNotification] = useState(true)
  const [showWalletStrategy, setShowWalletStrategy] = useState(true)
  // Removed duplicate state declarations for showImageModal, modalImages, modalImageIndex, modalImageAlt
  const [showStatistics, setShowStatistics] = useState(false)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [showDashboardAudioPlayer, setShowDashboardAudioPlayer] = useState(false)
  const [showDashboardAudio, setShowDashboardAudio] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [showClearReferralsDialog, setShowClearReferralsDialog] = useState(false)
  const [clearReferralsType, setClearReferralsType] = useState<"day" | "month">("day")
  const [showBeyondDataModal, setShowBeyondDataModal] = useState(false)
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [currentReferralsPage, setCurrentReferralsPage] = useState(1)
  const [currentWithdrawalsPage, setCurrentWithdrawalsPage] = useState(1)
  const [currentPaidWithdrawalsPage, setCurrentPaidWithdrawalsPage] = useState(1)
  const [currentJobsPage, setCurrentJobsPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [servicesSearchTerm, setServicesSearchTerm] = useState("")
  const [servicesFilter, setServicesFilter] = useState("All Services")
  const [referralsFilter, setReferralsFilter] = useState("All Referrals")
  const [dataBundlesFilter, setDataBundlesFilter] = useState("All Networks")
  const [jobSearchTerm, setJobSearchTerm] = useState("")
  const [jobsFilterAgent, setJobsFilterAgent] = useState("All Jobs")
  const [showAgentDeactivationAlert, setShowAgentDeactivationAlert] = useState(false)
  const [showAgentPerformance, setShowAgentPerformance] = useState(false)
  const menuSectionRef = useRef<HTMLDivElement>(null)
  const smartWalletRef = useRef<HTMLDivElement>(null)
  const walletTopupRef = useRef<HTMLDivElement>(null)
  const performanceRef = useRef<HTMLDivElement>(null)
  const statisticsRef = useRef<HTMLDivElement>(null)
  const servicesGridRef = useRef<HTMLDivElement>(null)

  const toggleDescriptionExpanded = (serviceId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }))
  }

  const shouldTruncateDescription = (text: string) => {
    return text.length > 100
  }

  const getTruncatedDescription = (text: string) => {
    if (!shouldTruncateDescription(text)) return text
    return text.substring(0, 100) + "..."
  }

  const getDisplayDescription = (text: string, serviceId: string) => {
    if (!shouldTruncateDescription(text)) return text
    return expandedDescriptions[serviceId] ? text : getTruncatedDescription(text)
  }

  const filteredServices = useMemo(() => {
    if (!loadedTabs.services) return []
    let filtered = tabData.services.filter(
      (service) =>
        service.title?.toLowerCase().includes(servicesSearchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(servicesSearchTerm.toLowerCase()),
    )
    if (servicesFilter !== "All Services") {
      filtered = filtered.filter((service) => {
        const commission = service.commission_amount
        switch (servicesFilter) {
          case "GH₵0-1000":
            return commission >= 0 && commission <= 1000
          case "GH₵1001-5000":
            return commission >= 1001 && commission <= 5000
          case "GH₵5001+":
            return commission >= 5001
          default:
            return true
        }
      })
    }
    return filtered
  }, [servicesSearchTerm, tabData.services, servicesFilter, loadedTabs.services])

  const filteredReferrals = useMemo(() => {
    if (!loadedTabs.referrals) return []
    let filtered = tabData.referrals
    if (referralsFilter !== "All Referrals") {
      filtered = tabData.referrals.filter((referral) => {
        switch (referralsFilter) {
          case "Pending":
            return referral.status === "pending"
          case "Confirmed":
            return referral.status === "confirmed"
          case "In Progress":
            return referral.status === "in_progress"
          case "Completed":
            return referral.status === "completed"
          case "Rejected":
            return referral.status === "rejected"
          default:
            return true
        }
      })
    }
    return filtered
  }, [tabData.referrals, referralsFilter, loadedTabs.referrals])

  const filteredJobs = useMemo(() => {
    if (!loadedTabs.jobs) return []
    const processedJobs = tabData.jobs.map((job) => {
      if (!job.job_title && job.industry) {
        return { ...job, job_title: job.industry }
      }
      return job
    })
    let filtered = processedJobs.filter(
      (job) =>
        job.is_active &&
        (job.job_title?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.employer_name?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.location?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.industry?.toLowerCase().includes(jobSearchTerm.toLowerCase())),
    )
    if (jobsFilterAgent !== "All Jobs") {
      filtered = filtered.filter((job) => {
        switch (jobsFilterAgent) {
          case "Featured":
            return job.is_featured === true
          case "Technology":
          case "Finance":
          case "Healthcare":
          case "Education":
          case "Marketing":
          case "Sales":
          case "Customer Service":
            return job.industry === jobsFilterAgent
          default:
            return true
        }
      })
    }
    return filtered
  }, [jobSearchTerm, tabData.jobs, jobsFilterAgent, loadedTabs.jobs])

  const toggleReferralExpanded = (referralId: string) => {
    setExpandedReferrals((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(referralId)) {
        newSet.delete(referralId)
      } else {
        newSet.add(referralId)
      }
      return newSet
    })
  }

  const shouldTruncateReferralDescription = (text: string) => {
    return text.length > 150
  }

  const getTruncatedReferralDescription = (text: string) => {
    if (!shouldTruncateReferralDescription(text)) return text
    const lines = text.split("\n")
    const firstThreeLines = lines.slice(0, 3).join("\n")
    if (firstThreeLines.length > 150) {
      return firstThreeLines.substring(0, 150) + "..."
    }
    return firstThreeLines + (lines.length > 3 ? "..." : "")
  }

  const getDisplayReferralDescription = (text: string, referralId: string) => {
    if (!shouldTruncateReferralDescription(text)) return text
    return expandedReferrals.has(referralId) ? text : getTruncatedReferralDescription(text)
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    const checkDeactivationStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) return
        const { data: agent } = await supabase
          .from("agents")
          .select("auto_deactivated_at")
          .eq("user_id", session.user.id)
          .single()
        if (agent?.auto_deactivated_at) {
          const lastShownKey = `deactivation_alert_shown_${session.user.id}`
          const lastShownDate = localStorage.getItem(lastShownKey)
          const today = new Date().toDateString()
          if (lastShownDate !== today) {
            setShowAgentDeactivationAlert(true)
            localStorage.setItem(lastShownKey, today)
            timer = setTimeout(() => {
              setShowAgentDeactivationAlert(false)
            }, 8000)
          }
        }
      } catch (error) {
        console.error("Error checking agent status:", error)
      }
    }
    checkDeactivationStatus()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const agentData = localStorage.getItem("agent")
        if (!agentData) {
          router.push("/agent/login")
          return
        }
        const parsedAgent = JSON.parse(agentData)
        setAgent(parsedAgent)
        setAgentId(parsedAgent.id)
        const cachedData = getFromCache(`dashboard-${parsedAgent.id}`)
        if (cachedData) {
          setEarningsData(cachedData.earnings)
          setTabData((prev) => ({
            ...prev,
            referrals: cachedData.referrals,
            dataOrders: cachedData.dataOrders,
            wholesaleOrders: cachedData.wholesaleOrders,
            withdrawals: cachedData.withdrawals,
            paidWithdrawals: cachedData.paidWithdrawals,
          }))
          setLoadedTabs({
            referrals: true,
            dataOrders: true,
            wholesaleOrders: true,
            withdrawals: true,
            paidWithdrawals: true,
          })
          setLoading(false)
          return
        }
        const dashboardData = await loadAgentDashboardData(parsedAgent.id)
        const earnings = {
          totalEarnings: dashboardData.commissionSummary.totalEarned || 0,
          availableBalance: dashboardData.commissionSummary.availableForWithdrawal || 0,
          pendingPayout: dashboardData.commissionSummary.pendingWithdrawal || 0,
          totalPaidEarnings: dashboardData.commissionSummary.totalWithdrawn || 0,
          walletBalance: Number(dashboardData.agentData?.wallet_balance) || 0,
          referralCommissions: 0,
          dataOrderCommissions: 0,
          wholesaleCommissions: 0,
        }
        setEarningsData(earnings)
        setTabData((prev) => ({
          ...prev,
          referrals: dashboardData.referralsData,
          dataOrders: dashboardData.dataOrdersData,
          wholesaleOrders: dashboardData.wholesaleOrdersData,
          withdrawals: dashboardData.withdrawalsData,
          paidWithdrawals: dashboardData.paidWithdrawalsData,
        }))
        setInCache(`dashboard-${parsedAgent.id}`, {
          earnings,
          referrals: dashboardData.referralsData,
          dataOrders: dashboardData.dataOrdersData,
          wholesaleOrders: dashboardData.wholesaleOrdersData,
          withdrawals: dashboardData.withdrawalsData,
          paidWithdrawals: dashboardData.paidWithdrawalsData,
        })
        setLoadedTabs({
          referrals: true,
          dataOrders: true,
          wholesaleOrders: true,
          withdrawals: true,
          paidWithdrawals: true,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        alert("Failed to load dashboard data. Please refresh the page or try again later.")
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const handleTabChange = useCallback(
    async (tab: string) => {
      // Navigate directly to specific pages for certain tabs
      if (tab === "publish-properties") {
        router.push("/agent/publish-properties")
        return
      }
      if (tab === "publish-products") {
        router.push("/agent/publish-products")
        return
      }
      
      setActiveTab(tab)
      if (loadedTabs[tab] || !agent?.id) return
      setTabLoadingStates((prev) => ({ ...prev, [tab]: true }))
      try {
        const data = await loadTabData(tab, agent.id)
        if (data) {
          if (tab === "services") {
            setTabData((prev) => ({ ...prev, services: data.services }))
          } else if (tab === "data-bundles") {
            setTabData((prev) => ({
              ...prev,
              dataBundles: data.dataBundles,
              dataOrders: data.dataOrders,
            }))
          } else if (tab === "jobs") {
            const { supabaseJobs } = await import("@/lib/supabase-client-jobs")
            const { data: fetchedJobs, error } = await supabaseJobs
              .from("jobs")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
            if (error) {
              console.error("Error fetching jobs:", error)
              setTabData((prev) => ({ ...prev, jobs: [] }))
            } else {
              const jobsWithTitles = fetchedJobs.map((job: any) => {
                if (!job.job_title && job.industry) {
                  return { ...job, job_title: job.industry }
                }
                return job
              })
              setTabData((prev) => ({ ...prev, jobs: jobsWithTitles }))
            }
          }
          if (tab === "online-courses") {
            const { data: courses, error } = await supabase
              .from("online_courses")
              .select("*")
              .eq("is_published", true)
              .order("created_at", { ascending: false })

            if (error) {
              console.error("Error fetching online courses:", error)
              setTabData((prev) => ({ ...prev, onlineCourses: [] }))
            } else {
              setTabData((prev) => ({ ...prev, onlineCourses: courses || [] }))
            }
          }
          if (tab === "referrals") setTabData((prev) => ({ ...prev, referrals: data }))
          if (tab === "withdrawals") setTabData((prev) => ({ ...prev, withdrawals: data }))
          if (tab === "paid-commissions") setTabData((prev) => ({ ...prev, paidWithdrawals: data }))
          if (tab === "wholesale") setTabData((prev) => ({ ...prev, wholesaleOrders: data }))
        }
        setLoadedTabs((prev) => ({ ...prev, [tab]: true }))
      } catch (error) {
        console.error(`Error loading ${tab} data:`, error)
      } finally {
        setTabLoadingStates((prev) => ({ ...prev, [tab]: false }))
      }
    },
    [agent?.id, loadedTabs],
  )

  const checkWalletStrategyDisplay = () => {
    const lastShown = localStorage.getItem("walletStrategyLastShown")
    const today = new Date().toDateString()
    if (!lastShown || lastShown !== today) {
      setShowWalletStrategy(true)
    }
  }

  const handleCloseWalletStrategy = () => {
    const today = new Date().toDateString()
    localStorage.setItem("walletStrategyLastShown", today)
    setShowWalletStrategy(false)
  }

  const handleCloseAudioPlayer = () => {
    setShowDashboardAudioPlayer(false)
    localStorage.setItem("dashboardAudioPlayerClosed", "true")
  }

  const getCurrentAgent = () => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      return null
    }
    return JSON.parse(agentData)
  }

  const loadStatistics = async () => {
    if (!agent?.id || showStatistics) return
    setStatisticsLoading(true)
    try {
      setShowStatistics(true)
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setStatisticsLoading(false)
    }
  }

  const calculateEarnings = async (agentId: string, agentData: any) => {
    try {
      const earnings = await calculateCompleteEarnings(agentId)
      setEarningsData({
        totalEarnings: earnings.totalEarnings,
        totalPaidEarnings: earnings.totalPaidOut,
        pendingPayout: earnings.pendingPayout,
        availableBalance: earnings.availableBalance,
        walletBalance: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
      })
    } catch (error) {
      console.error("Error calculating earnings:", error)
      setEarningsData({
        totalEarnings: 0,
        totalPaidEarnings: 0,
        pendingPayout: 0,
        availableBalance: 0,
        walletBalance: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
      })
    }
  }

  const scrollToElement = (elementRef: React.RefObject<HTMLDivElement>) => {
    if (elementRef.current) {
      const offsetTop = elementRef.current.offsetTop - 100
      window.scrollTo({ top: offsetTop, behavior: "smooth" })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePageChange = (
    newPage: number,
    setCurrentPage: (page: number) => void,
    sectionRef?: React.RefObject<HTMLDivElement>,
  ) => {
    setCurrentPage(newPage)
    if (sectionRef) {
      scrollToElement(sectionRef)
    } else {
      scrollToTop()
    }
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage)
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    sectionRef,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    sectionRef?: React.RefObject<HTMLDivElement>
  }) => {
    if (totalPages <= 1) return null
    const getVisiblePages = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768
      const maxVisible = isMobile ? 3 : 5
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
      const end = Math.min(totalPages, start + maxVisible - 1)
      const adjustedStart = Math.max(1, end - maxVisible + 1)
      return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i)
    }
    const visiblePages = getVisiblePages()
    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {visiblePages[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(1)}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {visiblePages[0] > 2 && (
                  <PaginationItem>
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center text-xs sm:text-sm">
                      ...
                    </span>
                  </PaginationItem>
                )}
              </>
            )}
            {visiblePages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <PaginationItem>
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center text-xs sm:text-sm">
                      ...
                    </span>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(totalPages)}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={`${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("agent")
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "confirmed":
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rejected":
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getFilteredDataBundles = (provider: string) => {
    if (dataBundlesFilter === "All Networks") {
      return tabData.dataBundles.filter((bundle) => bundle.provider === provider)
    }
    return tabData.dataBundles.filter((bundle) => bundle.provider === provider && bundle.provider === dataBundlesFilter)
  }

  const openImageModal = (images: string[], index: number, alt: string) => {
    setModalImages(images.filter((img) => img && img.trim() !== ""))
    setModalImageIndex(index)
    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  const handleModalIndexChange = (newIndex: number) => {
    setModalImageIndex(newIndex)
  }

  const loadEarningsData = async () => {
    if (!agentId) return
    try {
      setLoading(true)
      const commissionSummary = await getAgentCommissionSummary(agentId)
      setEarningsData({
        totalEarnings: commissionSummary.totalEarned || 0,
        availableBalance: commissionSummary.availableForWithdrawal || 0,
        pendingPayout: commissionSummary.pendingWithdrawal || 0,
        totalPaidEarnings: commissionSummary.totalWithdrawn || 0,
        walletBalance: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
      })
      const { data: agentData } = await supabase.from("agents").select("wallet_balance").eq("id", agentId).single()
      if (agentData) {
        setEarningsData((prev) => ({
          ...prev,
          walletBalance: Number(agentData.wallet_balance) || 0,
        }))
      }
    } catch (error) {
      console.error("Error loading earnings data:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateWhatsAppNumber = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "")
    if (cleanNumber.length === 10 && cleanNumber.startsWith("0")) {
      return `233${cleanNumber.substring(1)}`
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith("233")) {
      return cleanNumber
    } else if (cleanNumber.length === 9) {
      return `233${cleanNumber}`
    }
    return null
  }

  const handleReferralSubmit = () => {
    if (!referralWhatsApp.trim()) {
      setReferralWhatsAppError("Please enter a WhatsApp number")
      return
    }
    const validatedNumber = validateWhatsAppNumber(referralWhatsApp)
    if (!validatedNumber) {
      setReferralWhatsAppError("Please enter a valid Ghana WhatsApp number (e.g., 0241234567 or 233241234567)")
      return
    }
    const message = `🚀 *Join DataFlex Ghana as an Agent Today!* 🚀
Hello! I'm ${agent?.full_name}, and I want to invite you to join an amazing opportunity to earn extra income as a DataFlex Ghana Agent! 💰
✨ *What You'll Get:*
✅ Earn commissions on every sale
✅ Flexible working hours
✅ No upfront investment required
��� Access to multiple income streams
✅ Professional training and support
*Register here:* ${typeof window !== "undefined" ? window.location.origin : "https://dataflexghana.com"}/agent/register
⚠️ *IMPORTANT:* After completing your registration, please contact the admin on WhatsApp at +233242799990 and mention that *${agent?.full_name}* recommended you to register. This ensures you get proper onboarding support!
Don't miss this opportunity to start earning today! 💰
Best regards,
${agent?.full_name}
Data Flex Ghana Agent`
    const whatsappUrl = `https://wa.me/${validatedNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    setShowReferralDialog(false)
    setReferralWhatsApp("")
    setReferralWhatsAppError("")
  }

  const handleWhatsAppChange = (value: string) => {
    setReferralWhatsApp(value)
    setReferralWhatsAppError("")
  }

  const handleDomesticReferralSubmit = () => {
    if (!domesticReferralWhatsApp.trim()) {
      setDomesticReferralWhatsAppError("Please enter a WhatsApp number")
      return
    }
    const validatedNumber = validateWhatsAppNumber(domesticReferralWhatsApp)
    if (!validatedNumber) {
      setDomesticReferralWhatsAppError("Please enter a valid Ghana WhatsApp number (e.g., 0241234567 or 233241234567)")
      return
    }
    const message = `🏠 *Find Your Dream Domestic Job Today!* 🏠
Hello! I'm ${agent?.full_name}, and I want to help you find amazing domestic work opportunities in Ghana and abroad! 🌍
✨ *Why Choose DataFlex Ghana for Domestic Work?*
✅ NO Registration Fees - Join for FREE! 💰
✅ NO Processing Fees - Keep what you earn! 💵
✅ NO Salary Deductions - 100% of your pay is yours! 🎯
✅ Your Labor Rights are Protected 🛡️
✅ Good Monthly Salary Guaranteed 💸
✅ Clients Agree to Treat You Well 🤝
✅ Time to Rest and Take Breaks ⏰
*Register Now:* ${typeof window !== "undefined" ? window.location.origin : "https://dataflexghana.com"}/domestic-workers
Don't miss this opportunity to secure a better future! Join thousands of domestic workers who have found great jobs through our platform.
Best regards,
${agent?.full_name}
DataFlex Ghana Agent 🇬🇭`
    const whatsappUrl = `https://wa.me/${validatedNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    setShowDomesticReferralDialog(false)
    setDomesticReferralWhatsApp("")
    setDomesticReferralWhatsAppError("")
  }

  const handleDomesticWhatsAppChange = (value: string) => {
    setDomesticReferralWhatsApp(value)
    setDomesticReferralWhatsAppError("")
  }

  const clearOldReferrals = async () => {
    if (
      !confirm(
        `Are you sure you want to clear referral records from ${clearReferralsType === "day" ? "today" : "this month"}? This action cannot be undone.`,
      )
    ) {
      return
    }
    try {
      const now = new Date()
      let cutoffDate: Date
      if (clearReferralsType === "day") {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      const response = await fetch("/api/agent/clear-old-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify({
          agent_id: agent?.id,
          cutoff_date: cutoffDate.toISOString(),
          record_type: "referrals",
          time_range: clearReferralsType,
        }),
      })
      const result = await response.json()
      if (result.success) {
        alert(`Cleared ${result.count} referral records`)
        setShowClearReferralsDialog(false)
        if (agent?.id) {
          setTabLoadingStates((prev) => ({ ...prev, referrals: true }))
          const data = await loadTabData("referrals", agent.id)
          if (data) {
            setTabData((prev) => ({ ...prev, referrals: data }))
          }
          setTabLoadingStates((prev) => ({ ...prev, referrals: false }))
        }
      } else {
        alert(result.error || "Failed to clear records")
      }
    } catch (error) {
      console.error("Error clearing records:", error)
      alert("Failed to clear records")
    }
  }

  const ensureJobTitle = (job: Job): Job => {
    if (!job.job_title && job.industry) {
      return { ...job, job_title: job.industry }
    }
    return job
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <InactivityNotificationManager agentId={agent?.id} />
      <DashboardLoginNotification />
      <AgentDashboardNotification />
      {showDashboardAudioPlayer && (
        <FloatingAudioPlayer
          audioSrc="/agent_dashboard_intro.mp3"
          title="Dashboard Guide"
          description="Learn to maximize your earnings"
          onClose={handleCloseAudioPlayer}
        />
      )}
      {showWhatsAppPopup && <WhatsAppChannelPopup onClose={() => setShowWhatsAppPopup(false)} />}
      <Dialog open={showAgentDeactivationAlert} onOpenChange={setShowAgentDeactivationAlert}>
        <DialogContent className="sm:max-w-md bg-amber-50 border-2 border-amber-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Account Status Update
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-amber-800">
              Your account has been deactivated due to inactivity. Place an order or buy a data bundle to reactivate
              your account.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      {/* START: HERO SECTION WITH ADMIN PORTAL ACCESS - MOBILE OPTIMIZED */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg border-b border-slate-700">
        <div className="w-full max-w-full px-3 sm:px-4 py-3">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
            {/* Logo and User Info */}
            <div className="flex items-center gap-3 w-full xs:w-auto">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center p-1.5 shrink-0 border border-white/20">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1 xs:flex-none">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-white drop-shadow-sm truncate">
                  Data Flex Agent
                </h1>
                <p className="text-slate-200 text-xs font-medium truncate">
                  Welcome back, <span className="font-semibold text-white">{agent?.full_name}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons - Stacked on mobile, inline on larger screens */}
            <div className="flex items-center justify-between xs:justify-end gap-2 w-full xs:w-auto">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white hover:bg-slate-100 text-slate-900 border-white shadow-sm hover:shadow h-8 sm:h-9 px-3 sm:px-4 flex-1 xs:flex-none font-medium"
              >
                <Link href="/agent/settings" className="flex items-center justify-center">
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Settings</span>
                </Link>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-sm hover:shadow h-8 sm:h-9 px-3 sm:px-4 flex-1 xs:flex-none font-medium"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* END: HERO SECTION WITH ADMIN PORTAL ACCESS */}
      <div className="w-full max-w-full px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Suspense fallback={<div className="h-24 w-full animate-pulse bg-indigo-100 rounded-xl" />}>

        </Suspense>

        {showNotification && (
          <div className="relative mb-6 p-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-lg border-l-4 border-l-emerald-700">
            <button
              onClick={() => setShowNotification(false)}
              className="absolute top-4 right-4 text-white hover:text-emerald-100"
            >
              <X />
            </button>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Promote Services
              </h3>
              <div className="text-white space-y-2 text-sm leading-relaxed">
                <ul className="list-disc list-inside">
                  <li>Promote services and refer projects for bigger commissions and cashout bonuses.</li>
                  <li>Promote to friends, family, and people who need these services.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <AgentMenuCards activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="w-full max-w-full px-4 sm:px-6 py-6 sm:py-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 sm:p-10 shadow-2xl">
            {/* soft glow overlay */}
            <div className="absolute inset-0 bg-white/10 pointer-events-none rounded-3xl" />

            {/* Header */}
            <div className="relative flex items-center gap-4 mb-5 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>

              <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">Manual Data Order</h3>
            </div>

            {/* Description */}
            <p className="relative text-white text-sm sm:text-lg font-medium leading-relaxed mb-6 sm:mb-8">
              Sunday Packages | No Commission | Fast Delivery | From 6:00am - 9:00pm
            </p>

            {/* Call to Action */}
            <Button
              asChild
              size="lg"
              className="relative w-full bg-white text-orange-600 hover:bg-orange-50 font-bold text-base sm:text-lg transition-colors duration-300"
            >
              <Link href="/no-registration" className="flex items-center justify-center gap-2">
                Order Now
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            </Button>
          </div>
          {/* START: MORE THAN JUST DATA CARD */}
          <div className="mb-8">
            <Card className="w-full max-w-fullborder-amber-100 bg-amber-50/50 shadow-sm hover:shadow-md transition-shadow w-full">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-amber-100 flex-shrink-0">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-amber-800 text-base sm:text-lg">More Than Just Data</h3>
                      <p className="text-xs sm:text-sm text-amber-700 mt-2 leading-relaxed">
                        Data reselling is just the start. Discover how to earn{" "}
                        <strong>GH₵50 to GH₵1,000+ per transaction</strong> with our trusted services and business
                        opportunities.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowBeyondDataModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors w-full bg-transparent text-xs sm:text-sm font-medium"
                  >
                    Learn How to Earn More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* END: MORE THAN JUST DATA CARD */}
          {/* START: APPLE SERVICE CENTER CARD */}
          <div className="mb-8">
            <Card className="w-full max-w-full border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
                  {/* Image Section */}
                  <div className="relative h-64 md:h-full md:min-h-80 overflow-hidden">
                    <img
                      src="/repairmantwo.jpg"
                      alt="Apple Device Repair Service"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => openImageModal(["/repairmantwo.jpg"], 0, "Apple Service Center")}
                    />
                  </div>
                  {/* Content Section */}
                  <div className="p-6 lg:p-8 space-y-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-amber-200 rounded-full mb-3">
                        <p className="text-amber-700 text-xs font-semibold">🔧 Professional Apple Repair</p>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                        Quick, Professional <span className="text-amber-600">Apple Repairs</span>
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        No need to visit our office! We offer convenient pickup, expert repair, and safe delivery
                        service.
                      </p>
                    </div>
                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">Free Pickup Service</h4>
                          <p className="text-xs text-slate-600">We collect your device at no extra cost</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">Expert Technicians</h4>
                          <p className="text-xs text-slate-600">Certified professionals with quality parts</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">Fast Turnaround</h4>
                          <p className="text-xs text-slate-600">Most repairs within 24-48 hours</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">Safe Delivery</h4>
                          <p className="text-xs text-slate-600">Repaired device delivered to your doorstep</p>
                        </div>
                      </div>
                    </div>
                    {/* CTA Button */}
                    <div className="pt-4">
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold"
                      >
                        <Link href="/appleservicecenter">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Visit Main Page
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* END: APPLE SERVICE CENTER CARD */}
          {/* START: FASHIONABLY HIRED CARD */}
          <div className="mb-8">
            <Card className="w-full max-w-full border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
                  {/* Image Section */}
                  <div className="relative h-64 md:h-full md:min-h-80 overflow-hidden">
                    <img
                      src="/assets/slide2.jpg"
                      alt="Custom Fashion Design Service"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() =>
                        openImageModal(
                          ["/assets/slide2.jpg"],
                          0,
                          "Fashionably Hired"
                        )
                      }
                    />
                  </div>

                  {/* Content Section */}
                  <div className="p-6 lg:p-8 space-y-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-navy-200 rounded-full mb-3">
                        <p className="text-navy-800 text-xs font-semibold">👗 Bespoke Fashion Design</p>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        Stylish, <span className="text-navy-600">Custom Fashion</span> for Every Occasion
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Elevate your wardrobe with our remote fashion design services. From corporate wear to bridal
                        couture, we stitch dreams into reality—no in-person visit required!
                      </p>
                    </div>
                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-navy-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Remote Design Consultations</h4>
                          <p className="text-xs text-gray-600">Design your outfit from anywhere via WhatsApp</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-navy-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Flexible Payment Plans</h4>
                          <p className="text-xs text-gray-600">50% upfront, 50% on completion</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-navy-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Fast & Precise Delivery</h4>
                          <p className="text-xs text-gray-600">Your custom outfit delivered to your doorstep</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-navy-100 rounded-lg flex-shrink-0">
                          <Check className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Earn Commission</h4>
                          <p className="text-xs text-gray-600">Refer clients and earn 3GB data per successful order</p>
                        </div>
                      </div>
                    </div>
                    {/* CTA Button */}
                    <div className="pt-4">
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-navy-600 to-blue-800 hover:from-navy-700 hover:to-blue-900 text-white font-semibold"
                      >
                        <Link href="https://fashionablyhired.netlify.app/">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Visit Main Page
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* END: FASHIONABLY HIRED CARD */}
          <div className="mb-8">
            <Card className="w-full max-w-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl border-[3px] border-emerald-800 hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] rounded-2xl">
              <CardContent className="p-5 sm:p-7">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4 border border-white/20 shadow-inner backdrop-blur-sm">
                    <div className="p-3 rounded-full bg-white/30 shadow-lg flex-shrink-0">
                      <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-wide drop-shadow-md">
                        Need Support?
                      </h3>
                      <p className="text-sm text-green-50 mt-2 leading-relaxed">
                        For help or inquiries, call
                        <strong className="font-bold text-white ml-1 text-base">0242799990</strong> — we’re here for
                        you.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/95 border-2 border-emerald-300 rounded-xl p-5 space-y-4 shadow-xl hover:shadow-emerald-300/50 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-full shadow-md">
                        <svg className="h-6 w-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-emerald-900 text-base sm:text-lg">Join Our Teacher Channel</h4>
                        <p className="text-sm text-emerald-700 leading-relaxed mt-1">
                          Join the official channel
                          <strong className="font-bold text-emerald-900 ml-1">"Make ¢700.00 A Day"</strong>
                          to learn how to earn more and become a high-performing Dataflex Ghana agent. Get guidance,
                          strategies, and mentorship from top agents.
                        </p>
                        <p className="text-xs text-emerald-600 italic font-medium mt-2">
                          This is the ONLY official community. We do NOT operate any WhatsApp group.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mb-8">
            <Card className="w-full max-w-full border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-800">Educational Products & Services</h3>
                      <p className="text-blue-600">Results Checker Cards, School Forms & Subscriptions</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full md:w-auto"
                  >
                    <Link href="/voucher">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Shop Educational Products
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 w-full max-w-full">
            <div className="lg:col-span-2 space-y-6">
              {showWalletStrategy && (
                <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg border-l-4 border-l-blue-700 relative">
                  <button
                    onClick={handleCloseWalletStrategy}
                    className="absolute top-3 right-3 text-white hover:text-blue-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="space-y-2 pr-7">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Smart Wallet Strategy
                    </h3>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-100 text-xs">
                      <li>
                        <strong>One-time charge:</strong> When you load wallet
                      </li>
                      <li>
                        <strong>No fees:</strong> When you buy from wallet
                      </li>
                      <li>
                        <strong>Save more:</strong> Than manual payments
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg p-5 border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Top Up Wallet</h3>
                    <p className="text-purple-100 text-xs">Add funds for faster purchases</p>
                  </div>
                </div>
                <Button asChild size="sm" className="w-full bg-white text-purple-600 hover:bg-purple-50 font-medium">
                  <Link href="/agent/wallet?tab=topup">
                    <Plus className="h-4 w-4 mr-2" />
                    Top Up Wallet
                  </Link>
                </Button>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-5 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Invite Friends</h3>
                    <p className="text-green-100 text-xs">Earn ₵7 when they join</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowReferralDialog(true)}
                  size="sm"
                  className="w-full bg-white text-green-600 hover:bg-green-50 font-medium"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Referral Message
                </Button>
              </div>
              <div>
                <AgentPropertiesShowcase />
              </div>
              <div className="block md:hidden">
                <ProductSlider />
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mb-8">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full max-w-full space-y-4 sm:space-y-6"
            >
              <TabsList className="grid grid-flow-col overflow-x-auto no-scrollbar h-auto py-2 px-3 rounded-xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
                <TabsTrigger value="services" className="text-xs sm:text-sm font-medium">
                  Services
                </TabsTrigger>
              </TabsList>

              <TabsContent value="referral-program" className="space-y-4">
                {agent?.id && (
                  <ReferralDashboard agentId={agent.id} agentName={agent.agent_name || agent.full_name || "Agent"} />
                )}
              </TabsContent>
              <TabsContent value="wholesale" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-emerald-800">Wholesale Shopping</h2>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
                  >
                    <Link href="/agent/wholesale">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Start Shopping
                    </Link>
                  </Button>
                </div>
                <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center py-12">
                    <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">Wholesale Products</h3>
                    <p className="text-emerald-600 mb-6">
                      Browse and purchase wholesale products with competitive pricing and earn commissions on every
                      purchase.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <Package className="h-8 w-8 mx-auto mb-1 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Quality Products</h4>
                        <p className="text-sm text-emerald-600">
                          Curated wholesale products across multiple categories
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Competitive Pricing</h4>
                        <p className="text-sm text-emerald-600">Get the best wholesale prices with bulk discounts</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Earn Commissions</h4>
                        <p className="text-sm text-emerald-600">Earn money on every wholesale purchase you make</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Link href="/agent/wholesale">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Wholesale Products
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="publish-products" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-blue-800">Publish Products</h2>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                  >
                    <Link href="/agent/publish-products">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Products
                    </Link>
                  </Button>
                </div>
                <Card className="w-full max-w-full border-blue-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center py-12">
                    <Upload className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">Upload Wholesale Products</h3>
                    <p className="text-blue-600 mb-6">
                      Share your products with the wholesale platform. Submit products for admin review and approval to make them available to other agents.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <Upload className="h-8 w-8 mx-auto mb-1 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Easy Submission</h4>
                        <p className="text-sm text-blue-600">
                          Submit products with images and details
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Quick Review</h4>
                        <p className="text-sm text-blue-600">Admin reviews and approves your products</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Increase Visibility</h4>
                        <p className="text-sm text-blue-600">Get your products seen by other agents</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Link href="/agent/publish-products">
                        <Upload className="h-4 w-4 mr-2" />
                        Start Uploading
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="services" className="space-y-4">
                {tabLoadingStates.services ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                    <span className="ml-3 text-emerald-700">Loading services...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-emerald-800">Available Services</h2>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex gap-2">
                          <Select value={servicesFilter} onValueChange={setServicesFilter}>
                            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                              <Filter className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="All Services" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All Services">All Services</SelectItem>
                              <SelectItem value="GH₵0-1000">GH₵0-1000</SelectItem>
                              <SelectItem value="GH₵1001-5000">GH₵1001-5000</SelectItem>
                              <SelectItem value="GH₵5001+">GH₵5001+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                          <Input
                            placeholder="Search services..."
                            value={servicesSearchTerm}
                            onChange={(e) => setServicesSearchTerm(e.target.value)}
                            className="pl-10 w-full sm:w-64 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Services Grid - Minimal Design */}
<div ref={servicesGridRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {getPaginatedData(filteredServices, currentServicesPage).map((service) => {
    const images =
      service.image_urls && service.image_urls.length > 0
        ? service.image_urls
        : service.image_url
        ? [service.image_url]
        : [];
    const currentIdx = serviceImageIndices[service.id] || 0;

    return (
      <Card
        key={service.id}
        className="flex flex-col overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md"
      >
        {/* Image Section */}
        <div className="relative w-full h-56 overflow-hidden group">
          {images.length > 0 ? (
            <>
              <ImageWithFallback
                src={images[currentIdx] || "/placeholder.svg"}
                alt={service.title}
                className="w-full h-full object-cover cursor-pointer transition-opacity duration-500"
                onClick={() => openImageModal(images, currentIdx, service.title)}
                fallbackSrc="/placeholder.svg?height=224&width=400"
              />
              {images.length > 1 && (
                <>
                  {/* Image Counter */}
                  <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[10px] font-medium text-white rounded backdrop-blur-sm bg-black/60">
                    {currentIdx + 1} / {images.length}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => prevServiceImage(e, service.id, images.length)}
                      className="p-1.5 transition-all bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90 text-white" />
                    </button>
                    <button
                      onClick={(e) => nextServiceImage(e, service.id, images.length)}
                      className="p-1.5 transition-all bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90 text-white" />
                    </button>
                  </div>

                  {/* Image Indicators */}
                  <div className="absolute bottom-3 left-1/2 flex gap-1 -translate-x-1/2">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all ${
                          i === currentIdx ? "bg-white w-4" : "bg-white/40 w-1"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="p-4 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-4">
          {/* Service Title */}
          <h3 className="mb-3 text-lg font-semibold text-gray-800 line-clamp-2">
            {service.title}
          </h3>

          {/* Pricing Section */}
          <div className="mb-4 space-y-3">
            <div className="p-3 rounded-lg bg-emerald-50">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-emerald-700">Your Commission</span>
                <span className="text-lg font-bold text-emerald-800">
                  GH₵ {safeCommissionDisplay(service.commission_amount).toFixed(2)}
                </span>
              </div>
            </div>
            {service.product_cost && (
              <div className="p-3 border rounded-lg border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Service Cost</span>
                  <span className="text-base font-semibold text-gray-800">
                    GH₵ {safeCommissionDisplay(service.product_cost).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex-1 mb-4">
            <div
              className={`text-sm leading-relaxed text-gray-600 ${
                !expandedDescriptions[service.id] ? "line-clamp-2" : ""
              }`}
            >
              {getDisplayDescription(service.description || "", service.id)}
            </div>
            {shouldTruncateDescription(service.description || "") && (
              <button
                onClick={() => toggleDescriptionExpanded(service.id)}
                className="flex mt-2 text-sm font-medium text-emerald-600 gap-1 hover:text-emerald-800"
              >
                {expandedDescriptions[service.id] ? (
                  <>
                    Show Less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Read More <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Button asChild size="sm" className="flex-1 text-white bg-emerald-600 font-medium hover:bg-emerald-700">
              <Link href={`/agent/refer/${service.id}`}>
                <Plus className="w-4 h-4 mr-2" /> Refer
              </Link>
            </Button>

            {service.material?.material_link && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <Link href={service.material.material_link} target="_blank">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  })}
</div>

                    {/* Pagination Controls */}
                    <div className="flex justify-center mt-8">
                      <PaginationControls
                        currentPage={currentServicesPage}
                        totalPages={getTotalPages(filteredServices.length)}
                        onPageChange={(page) => {
                          setCurrentServicesPage(page)
                          servicesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }}
                      />
                    </div>
                  </>
                )}
              </TabsContent>
              <TabsContent value="data-bundles" className="space-y-4">
                {tabLoadingStates["data-bundles"] ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                    <span className="ml-3 text-emerald-700">Loading data bundles...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl font-bold text-emerald-800">Data Bundles & Services</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="w-full overflow-x-auto">
                        <Tabs defaultValue="MTN" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-2 rounded-xl h-auto">
                            {["MTN", "AirtelTigo", "Telecel", "MTN AFA", "Bulk Order"].map((provider) => {
                              const logoMap = {
                                MTN: "/images/mtn.jpg",
                                AirtelTigo: "/images/airteltigo.jpg",
                                Telecel: "/images/telecel.jpg",
                                "MTN AFA": "/images/mtnafa.jpg",
                                "Bulk Order": "/images/bulkorder.jpg",
                              }
                              let bundleCount = 0
                              if (["MTN", "AirtelTigo", "Telecel"].includes(provider)) {
                                bundleCount = getFilteredDataBundles(provider).length
                              }
                              return (
                                <TabsTrigger
                                  key={provider}
                                  value={provider}
                                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 flex flex-col sm:flex-row items-center justify-center gap-1 whitespace-normal min-h-16 sm:min-h-12"
                                >
                                  <img
                                    src={logoMap[provider] || "/placeholder.svg"}
                                    alt={`${provider} logo`}
                                    className="w-6 h-6 sm:w-5 sm:h-5 rounded object-cover"
                                  />
                                  <div className="flex flex-col items-center text-center">
                                    <span className="text-xs sm:text-sm leading-tight">
                                      {provider === "MTN AFA"
                                        ? "MTN AFA"
                                        : provider === "Bulk Order"
                                          ? "Bulk Order"
                                          : provider}
                                    </span>
                                    {bundleCount > 0 && <span className="text-xs opacity-75">({bundleCount})</span>}
                                  </div>
                                </TabsTrigger>
                              )
                            })}
                          </TabsList>
                          {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                            const providerBundles = getFilteredDataBundles(provider).sort(
                              (a, b) => a.size_gb - b.size_gb,
                            )
                            return (
                              <TabsContent key={provider} value={provider} className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-xl font-semibold text-emerald-700 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200">
                                      <img
                                        src={
                                          provider === "MTN"
                                            ? "/images/mtn.jpg"
                                            : provider === "AirtelTigo"
                                              ? "/images/airteltigo.jpg"
                                              : "/images/telecel.jpg"
                                        }
                                        alt={`${provider} logo`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span>{provider} Data Bundles</span>
                                  </h3>
                                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                                    {providerBundles.length} bundles
                                  </Badge>
                                </div>
                                {providerBundles.length === 0 ? (
                                  <Card className="w-full max-w-full border-red-100 bg-white/90 backdrop-blur-sm">
                                    <CardContent className="pt-6 text-center">
                                      <div className="text-gray-500 mb-4">
                                        <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50 text-red-400" />
                                        <p className="font-bold text-red-600">This data bundle is out of stock</p>
                                        <p className="text-sm mb-4">
                                          Please buy the other type of data bundle available for purchase.
                                        </p>
                                        <Button
                                          asChild
                                          variant="outline"
                                          className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-transparent"
                                        >
                                          <Link href="/no-registration">Buy Alternative Bundle</Link>
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {providerBundles.map((bundle) => (
                                      <Card
                                        key={bundle.id}
                                        className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
                                      >
                                        <CardHeader>
                                          {bundle.image_url && (
                                            <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden cursor-pointer">
                                              <ImageWithFallback
                                                src={bundle.image_url || "/placeholder.svg"}
                                                alt={bundle.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                onClick={() => openImageModal([bundle.image_url], 0, bundle.name)}
                                                fallbackSrc="/placeholder.svg"
                                              />
                                            </div>
                                          )}
                                          <CardTitle className="text-lg text-emerald-800">{bundle.name}</CardTitle>
                                          <CardDescription className="text-emerald-600 flex items-center gap-2">
                                            <img
                                              src={
                                                bundle.provider === "MTN"
                                                  ? "/images/mtn.jpg"
                                                  : bundle.provider === "AirtelTigo"
                                                    ? "/images/airteltigo.jpg"
                                                    : "/images/telecel.jpg"
                                              }
                                              alt={`${bundle.provider} logo`}
                                              className="w-5 h-5 rounded object-cover"
                                            />
                                            {bundle.size_gb}GB - {bundle.provider}
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm text-emerald-600">Price:</span>
                                              <span className="text-lg font-bold text-emerald-800">
                                                GH₵ {safeCommissionDisplay(bundle.price).toFixed(2)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm text-emerald-600">Commission:</span>
                                              <span className="text-lg font-bold text-green-600">
                                                GH₵{" "}
                                                {safeCommissionDisplay(bundle.price * bundle.commission_rate).toFixed(
                                                  2,
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm text-emerald-600">Validity:</span>
                                              <span className="text-sm font-semibold text-emerald-800">
                                                {bundle.validity_months} Months
                                              </span>
                                            </div>
                                          </div>
                                          <Button
                                            asChild
                                            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                                          >
                                            <Link href={`/agent/data-order?bundle=${bundle.id}`}>
                                              <Plus className="h-4 w-4 mr-1" />
                                              Order Now
                                            </Link>
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </TabsContent>
                            )
                          })}
                          <TabsContent value="MTN AFA" className="space-y-4">
                            <div className="text-center space-y-4">
                              <h3 className="text-lg sm:text-xl font-semibold text-emerald-700">
                                MTN AFA Registration
                              </h3>
                              <p className="text-emerald-600 text-sm">
                                Register for MTN AFA services to expand your business
                              </p>
                              <Button
                                asChild
                                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                              >
                                <Link href="/agent/mtn-afa-registration">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Start Registration
                                </Link>
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent value="Bulk Order" className="space-y-4">
                            <div className="text-center space-y-4">
                              <h3 className="text-lg sm:text-xl font-semibold text-emerald-700">Bulk Data Orders</h3>
                              <p className="text-emerald-600 text-sm">Upload multiple orders efficiently</p>
                              <Button
                                asChild
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-500"
                              >
                                <Link href="/agent/bulk-data-order">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Bulk Order
                                </Link>
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              <TabsContent value="referrals" className="space-y-4">
                {tabLoadingStates.referrals ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                    <span className="ml-3 text-emerald-700">Loading referrals...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-emerald-800">My Referrals</h2>
                      <div className="flex items-center gap-4">
                        <Select value={referralsFilter} onValueChange={setReferralsFilter}>
                          <SelectTrigger className="w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Referrals" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Referrals">All Referrals</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => setShowClearReferralsDialog(true)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Clear Old Records
                        </Button>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {filteredReferrals.length} referrals
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {getPaginatedData(filteredReferrals, currentReferralsPage).map((referral) => (
                        <Card
                          key={referral.id}
                          className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                        >
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-emerald-800 text-lg">{referral.services?.title}</h3>
                                <Badge className={getStatusColor(referral.status)}>
                                  {referral.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-emerald-600">
                                  <span className="font-medium">Client:</span> {referral.client_name} •{" "}
                                  {referral.client_phone}
                                </p>
                                <p className="text-emerald-600">
                                  {getDisplayReferralDescription(referral.description || "", referral.id)}
                                  {shouldTruncateReferralDescription(referral.description || "") && (
                                    <button
                                      onClick={() => toggleReferralExpanded(referral.id)}
                                      className="text-emerald-500 hover:underline ml-1 text-sm font-medium"
                                    >
                                      {expandedReferrals.has(referral.id) ? "Read Less" : "Read More"}
                                    </button>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  {referral.allow_direct_contact === false ? (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                      🚫 No Direct Client Contact
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                      ✅ Direct Client Contact OK
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                                <div>
                                  <p className="text-lg font-bold text-green-600">
                                    GH₵ {safeCommissionDisplay(referral.services?.commission_amount).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-emerald-500">Commission</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-emerald-600">
                                    {referral.status === "completed" && referral.commission_paid
                                      ? "✅ Paid"
                                      : referral.status === "completed"
                                        ? "💰 Ready to withdraw"
                                        : "⏳ In progress"}
                                  </p>
                                  <p className="text-xs text-emerald-500">{formatTimestamp(referral.created_at)}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-3 border-t border-emerald-100">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 relative bg-transparent"
                                >
                                  <Link href={`/agent/chat/${referral.id}`} onClick={() => markAsRead(referral.id)}>
                                    <div className="relative flex items-center">
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      Chat with Admin
                                      {getUnreadCount(referral.id) > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse font-bold">
                                          {getUnreadCount(referral.id) > 9 ? "9+" : getUnreadCount(referral.id)}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {getPaginatedData(filteredReferrals, currentReferralsPage).length === 0 && (
                        <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                          <CardContent className="text-center py-8">
                            <div className="text-gray-500 mb-4">
                              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>
                                {referralsFilter === "All Referrals"
                                  ? "No referrals yet. Start referring services to earn commissions!"
                                  : `No ${referralsFilter.toLowerCase()} referrals found.`}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <PaginationControls
                      currentPage={currentReferralsPage}
                      totalPages={getTotalPages(filteredReferrals.length)}
                      onPageChange={(page) => handlePageChange(page, setCurrentReferralsPage)}
                    />
                  </>
                )}
              </TabsContent>
              <TabsContent value="withdrawals" className="space-y-4">
                {tabLoadingStates.withdrawals ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                    <span className="ml-3 text-emerald-700">Loading withdrawals...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-emerald-800">Withdrawal History</h2>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {tabData.withdrawals.length} withdrawals
                        </Badge>
                        <Button
                          asChild
                          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                        >
                          <Link href="/agent/withdraw">
                            <Plus className="h-4 w-4 mr-2" />
                            Request Withdrawal
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {getPaginatedData(tabData.withdrawals, currentWithdrawalsPage).map((withdrawal) => (
                        <Card
                          key={withdrawal.id}
                          className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                        >
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-emerald-800 text-lg">
                                  GH₵ {safeCommissionDisplay(withdrawal.amount).toFixed(2)}
                                </h3>
                                <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-emerald-600">
                                  <span className="font-medium">MoMo Number:</span> {withdrawal.momo_number}
                                </p>
                                <p className="text-emerald-600">
                                  <span className="font-medium">Requested:</span>{" "}
                                  {formatTimestamp(withdrawal.requested_at)}
                                </p>
                                {withdrawal.paid_at && (
                                  <p className="text-emerald-600">
                                    <span className="font-medium">Paid:</span> {formatTimestamp(withdrawal.paid_at)}
                                  </p>
                                )}
                                {withdrawal.commission_items && withdrawal.commission_items.length > 0 && (
                                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                    <p className="text-xs font-medium text-emerald-700 mb-1">Commission Sources:</p>
                                    <div className="text-xs text-emerald-600">
                                      {withdrawal.commission_items.map((item, index) => (
                                        <span key={index}>
                                          {item.type === "referral"
                                            ? "Referral"
                                            : item.type === "data_order"
                                              ? "Data Order"
                                              : "Wholesale Order"}
                                          {index < withdrawal.commission_items.length - 1 ? ", " : ""}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {getPaginatedData(tabData.withdrawals, currentWithdrawalsPage).length === 0 && (
                        <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                          <CardContent className="text-center py-8">
                            <div className="text-gray-500 mb-4">
                              <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No withdrawal requests yet.</p>
                              <p className="text-sm">Complete referrals to earn commissions and request withdrawals.</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <PaginationControls
                      currentPage={currentWithdrawalsPage}
                      totalPages={getTotalPages(tabData.withdrawals.length)}
                      onPageChange={(page) => handlePageChange(page, setCurrentWithdrawalsPage)}
                    />
                  </>
                )}
              </TabsContent>
              <TabsContent value="profile" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-emerald-800">Profile Settings</h2>
                </div>
                <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-emerald-700">Full Name</Label>
                          <Input value={agent?.full_name || ""} disabled className="bg-gray-50" />
                        </div>
                        <div>
                          <Label className="text-emerald-700">Phone Number</Label>
                          <Input value={agent?.phone_number || ""} disabled className="bg-gray-50" />
                        </div>
                        <div>
                          <Label className="text-emerald-700">MoMo Number</Label>
                          <Input value={agent?.momo_number || ""} disabled className="bg-gray-50" />
                        </div>
                        <div>
                          <Label className="text-emerald-700">Region</Label>
                          <Input value={agent?.region || ""} disabled className="bg-gray-50" />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-emerald-100">
                        <p className="text-sm text-emerald-600 mb-2">
                          To update your profile information, please contact support.
                        </p>
                        <Button
                          asChild
                          variant="outline"
                          className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                        >
                          <Link href="/agent/settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="jobs" className="space-y-4">
                {tabLoadingStates.jobs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                    <span className="ml-3 text-emerald-700">Loading jobs...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-emerald-800">Job Opportunities</h2>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <Select value={jobsFilterAgent} onValueChange={setJobsFilterAgent}>
                          <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Jobs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Jobs">All Jobs</SelectItem>
                            <SelectItem value="Featured">Featured</SelectItem>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Customer Service">Customer Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                          <Input
                            placeholder="Search jobs..."
                            value={jobSearchTerm}
                            onChange={(e) => setJobSearchTerm(e.target.value)}
                            className="pl-10 w-full sm:w-64 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                          />
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {filteredJobs.length} jobs
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      {filteredJobs.slice(0, 5).map((job) => (
                        <div
                          key={job.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
                            <div className="flex gap-3 md:gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <Image
                                  src={job.employer_logo_url || "/placeholder.svg"}
                                  alt={job.employer_name}
                                  width={64}
                                  height={64}
                                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover bg-gray-100"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                {job.is_featured && (
                                  <div className="mb-2">
                                    <Badge className="bg-amber-100 text-amber-800 text-xs">⭐ Featured</Badge>
                                  </div>
                                )}
                                <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1">
                                  {job.job_title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">{job.employer_name}</p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="line-clamp-1">{job.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1 font-semibold text-green-700">
                                    <span className="text-xs text-gray-500">Salary:</span>
                                    {job.salary_type === "negotiable" ? (
                                      <span>Negotiable</span>
                                    ) : job.salary_type === "fixed_range" ? (
                                      <span>
                                        {job.salary_min} - {job.salary_max}
                                      </span>
                                    ) : job.salary_type === "exact_amount" ? (
                                      <span>{job.salary_exact}</span>
                                    ) : job.salary_custom ? (
                                      <span>{job.salary_custom}</span>
                                    ) : (
                                      <span>
                                        {job.salary_min} - {job.salary_max}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">{formatDateAgo(job.created_at)}</div>
                                </div>
                              </div>
                            </div>
                            <div className="w-full md:w-auto flex-shrink-0">
                              <Link
                                href={`/job-details/${generateSlug(job.job_title)}`}
                                className="block w-full md:w-auto"
                              >
                                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                                  View Details
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredJobs.length === 0 && (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No jobs found matching your search</p>
                      </div>
                    )}
                    <div className="text-center pt-4">
                      <Link href="/jobboard">
                        <Button
                          variant="outline"
                          className="bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          View All Jobs ({filteredJobs.length})
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </TabsContent>
              <TabsContent value="savings" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-emerald-800">Savings Management</h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      asChild
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Link href="/agent/savings">
                        <PiggyBank className="h-4 w-4 mr-2" />
                        View Savings Dashboard
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                    >
                      <Link href="/agent/savings/commit">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Saving
                      </Link>
                    </Button>
                  </div>
                </div>
                <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center py-12">
                    <PiggyBank className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">Smart Savings Plans</h3>
                    <p className="text-emerald-600 mb-6">
                      Grow your money with our competitive savings plans. Earn interest on your deposits and build your
                      financial future.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">High Returns</h4>
                        <p className="text-sm text-emerald-600">Earn up to 15.5% annual interest on your savings</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Secure & Safe</h4>
                        <p className="text-sm text-emerald-600">Your money is protected with bank-level security</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <Wallet className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Flexible Plans</h4>
                        <p className="text-sm text-emerald-600">Choose from 3-24 month savings plans</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                      >
                        <Link href="/agent/savings">
                          <PiggyBank className="h-4 w-4 mr-2" />
                          Explore Savings Plans
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                      >
                        <Link href="/agent/savings/withdraw">
                          <Banknote className="h-4 w-4 mr-2" />
                          Request Withdrawal
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="paid-commissions" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-emerald-800">Paid Commissions</h2>
                </div>
                <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center py-12">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-emerald-800 mb-2">Paid Commissions</h3>
                        <p className="text-emerald-600 mb-4">View your paid commissions history</p>
                      </div>
                      <Button
                        onClick={loadStatistics}
                        disabled={statisticsLoading}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                      >
                        {statisticsLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mr-2"></div>
                            Loading Statistics...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Load Statistics
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  {getPaginatedData(tabData.paidWithdrawals, currentPaidWithdrawalsPage).map((paidWithdrawal) => (
                    <Card
                      key={paidWithdrawal.id}
                      className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-emerald-800 text-lg">
                              GH₵ {safeCommissionDisplay(paidWithdrawal.amount).toFixed(2)}
                            </h3>
                            <Badge className={getStatusColor(paidWithdrawal.status)}>{paidWithdrawal.status}</Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-emerald-600">
                              <span className="font-medium">MoMo Number:</span> {paidWithdrawal.momo_number}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Requested:</span>{" "}
                              {formatTimestamp(paidWithdrawal.requested_at)}
                            </p>
                            {paidWithdrawal.paid_at && (
                              <p className="text-emerald-600">
                                <span className="font-medium">Paid:</span> {formatTimestamp(paidWithdrawal.paid_at)}
                              </p>
                            )}
                            {paidWithdrawal.commission_items && paidWithdrawal.commission_items.length > 0 && (
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <p className="text-xs font-medium text-emerald-700 mb-1">Commission Sources:</p>
                                <div className="text-xs text-emerald-600">
                                  {paidWithdrawal.commission_items.map((item, index) => (
                                    <span key={index}>
                                      {item.type === "referral"
                                        ? "Referral"
                                        : item.type === "data_order"
                                          ? "Data Order"
                                          : "Wholesale Order"}
                                      {index < paidWithdrawal.commission_items.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {getPaginatedData(tabData.paidWithdrawals, currentPaidWithdrawalsPage).length === 0 && (
                    <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                      <CardContent className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                          <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No paid withdrawals yet.</p>
                          <p className="text-sm">Check back later for new paid withdrawals.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <PaginationControls
                  currentPage={currentPaidWithdrawalsPage}
                  totalPages={getTotalPages(tabData.paidWithdrawals.length)}
                  onPageChange={(page) => handlePageChange(page, setCurrentPaidWithdrawalsPage)}
                />
              </TabsContent>
              <TabsContent value="properties" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-emerald-800">Property Promotion</h2>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
                  >
                    <Link href="/agent/properties">
                      <Building2 className="h-4 w-4 mr-2" />
                      Browse Properties
                    </Link>
                  </Button>
                </div>
                <Card className="w-full max-w-full border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">Property Promotion Platform</h3>
                    <p className="text-emerald-600 mb-6">
                      Browse and promote real estate properties to earn commissions. Connect with potential buyers and
                      sellers through our platform.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Quality Properties</h4>
                        <p className="text-sm text-emerald-600">
                          Verified properties across multiple categories and price ranges
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Dual Currency</h4>
                        <p className="text-sm text-emerald-600">Properties listed in both Ghana Cedi and US Dollars</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-800">Earn Commissions</h4>
                        <p className="text-sm text-emerald-600">
                          Connect buyers with properties and earn referral commissions
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Link href="/agent/properties">
                        <Building2 className="h-4 w-4 mr-2" />
                        Start Promoting Properties
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="compliance" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-emerald-800">Compliance & Registration</h2>
                </div>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                      <span className="ml-3 text-emerald-700">Loading compliance module...</span>
                    </div>
                  }
                >
                  {agent && agent.id ? (
                    <ComplianceTab agentId={agent.id} />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                      <span className="ml-3 text-emerald-700">Loading agent data...</span>
                    </div>
                  )}
                </Suspense>
              </TabsContent>
              <TabsContent value="professional-writing" className="space-y-4">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-pink-600 border-t-transparent"></div>
                      <span className="ml-3 text-pink-700">Loading professional writing services...</span>
                    </div>
                  }
                >
                  {agent && agent.id ? (
                    <ProfessionalWritingTab agentId={agent.id} />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-pink-600 border-t-transparent"></div>
                      <span className="ml-3 text-pink-700">Loading agent data...</span>
                    </div>
                  )}
                </Suspense>
              </TabsContent>
              <TabsContent value="online-courses" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-blue-800">Available Online Courses</h2>
                </div>
                <AgentOnlineCoursesDisplay
                  courses={tabData.onlineCourses || []}
                  loading={tabLoadingStates["online-courses"]}
                />
              </TabsContent>
              <TabsContent value="Channels" className="space-y-4">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                      <span className="ml-3 text-blue-700">Loading teaching platform...</span>
                    </div>
                  }
                >
                  <TeachingPlatformPage />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Dialog open={showClearReferralsDialog} onOpenChange={setShowClearReferralsDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md max-w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Clear Referral Records
            </DialogTitle>
            <DialogDescription className="text-red-700">
              Remove old referral records to keep your dashboard clean
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">Time Range</label>
              <Select value={clearReferralsType} onValueChange={(value: any) => setClearReferralsType(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm font-medium text-red-900 mb-1">Warning:</p>
              <p className="text-xs text-red-700">
                This will permanently delete referral records older than the selected date. This action cannot be
                undone.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowClearReferralsDialog(false)} className="text-xs md:text-sm">
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-xs md:text-sm" onClick={clearOldReferrals}>
              Clear Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDomesticReferralDialog} onOpenChange={setShowDomesticReferralDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-blue-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Help A Friend Find Work
            </DialogTitle>
            <DialogDescription className="text-blue-600">
              Enter your friend's WhatsApp number to send them domestic job opportunities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="domestic-whatsapp" className="block text-sm font-medium text-blue-700 mb-2">
                Friend's WhatsApp Number
              </label>
              <Input
                id="domestic-whatsapp"
                type="tel"
                placeholder="e.g., 0241234567 or 233241234567"
                value={domesticReferralWhatsApp}
                onChange={(e) => handleDomesticWhatsAppChange(e.target.value)}
                className={`border-blue-200 focus:border-blue-500 ${
                  domesticReferralWhatsAppError ? "border-red-300 focus:border-red-500" : ""
                }`}
              />
              {domesticReferralWhatsAppError && (
                <p className="text-red-600 text-sm mt-1">{domesticReferralWhatsAppError}</p>
              )}
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Preview:</strong> This will send information about domestic job opportunities with no fees, good
                salary, and protected rights.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDomesticReferralDialog(false)
                  setDomesticReferralWhatsApp("")
                  setDomesticReferralWhatsAppError("")
                }}
                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDomesticReferralSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Send Referral Message
            </DialogTitle>
            <DialogDescription className="text-emerald-600">
              Enter a WhatsApp number to send a personalized referral message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-emerald-700 mb-2">
                WhatsApp Number
              </label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="e.g., 0241234567 or 233241234567"
                value={referralWhatsApp}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                className={`border-emerald-200 focus:border-emerald-500 ${
                  referralWhatsAppError ? "border-red-300 focus:border-red-500" : ""
                }`}
              />
              {referralWhatsAppError && <p className="text-red-600 text-sm mt-1">{referralWhatsAppError}</p>}
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-sm text-emerald-700">
                <strong>Preview:</strong> This will send a personalized invitation message with your name and the
                registration link.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReferralDialog(false)
                  setReferralWhatsApp("")
                  setReferralWhatsAppError("")
                }}
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReferralSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showBeyondDataModal} onOpenChange={setShowBeyondDataModal}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-w-full bg-white rounded-lg shadow-xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-6 py-5 text-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold">Build a Business, Not Just Sales</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  Turn your hustle into a real income with DataFlex Ghana.
                </p>
              </div>
              <button
                onClick={() => setShowBeyondDataModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="bg-amber-50 rounded-lg p-5 border-l-4 border-amber-300">
              <p className="text-lg font-semibold text-gray-800 mb-3">
                💡 <strong>Want More Than Just Pocket Money?</strong>
              </p>
              <p className="text-gray-700 leading-relaxed text-base">
                Selling data bundles is a good start, but it shouldn't be your only source of income. Imagine earning{" "}
                <strong>GH₵50 to GH₵1,000+ per transaction</strong>. No more small change. With DataFlex Ghana, you can
                turn your phone into a real business tool.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                The Truth About Data Reselling
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                Selling data bundles alone won't take you far. Here's why:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Endless Complaints</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Customers often blame you for issues—even when the data is delivered.
                      <span className="block mt-2 text-xs italic">*"I didn't get my data!"* —Sound familiar?</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Small Earnings, Big Effort</p>
                    <p className="text-sm text-gray-600 mt-1">
                      After fees and costs, you're left with very little.
                      <span className="block mt-2 text-xs italic">Can GH₵10 pay your bills? Your dreams?</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">No Growth</p>
                    <p className="text-sm text-gray-600 mt-1">
                      You're stuck in the same cycle—selling, explaining, and repeating.
                      <span className="block mt-2 text-xs italic">Is this really the business you want?</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Check className="h-6 w-6 text-green-600" />
                How DataFlex Ghana Helps You
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                We don't just sell data. We help you <strong>build a real business</strong>—one that pays you what you
                deserve.
              </p>
              <p className="text-gray-700 leading-relaxed text-base font-medium">
                With DataFlex Ghana, you can earn <strong>GH₵50 to GH₵1,000+ per transaction</strong>. No more stress.
                No more small change. Just real income.
              </p>
              <p className="text-gray-700 leading-relaxed text-base">
                We offer <strong>50+ trusted services</strong> that people need every day:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                <div className="bg-green-50 rounded-lg p-5 border border-green-100">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5" /> Digital Services
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Birth Certificate Applications
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      TIN & Business Registration
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Professional Document Writing
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Resume & CV Services
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5" /> Financial Services
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      Investment Opportunities
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      Bulk Data for Businesses
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      Commission-Based Referrals
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      Real Estate Listings
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-6 border-l-4 border-amber-300 space-y-5">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-amber-600" />
                Your Next Step
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                You can keep selling data and earning small amounts.
              </p>
              <p className="text-gray-700 leading-relaxed text-base font-medium">
                Or you can embrace the full potential of DataFlex Ghana and start building a business that pays you
                well.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-5">
                <Button
                  onClick={() => setShowBeyondDataModal(false)}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-3 text-base flex-1 font-medium"
                >
                  Let's Build It Together
                </Button>
                <Button
                  onClick={() => setShowBeyondDataModal(false)}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 py-3 text-base flex-1"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <Button
              onClick={() => setShowBeyondDataModal(false)}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 text-base"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={handleModalIndexChange}
        alt={modalImageAlt}
      />
    </div>
  )
}
