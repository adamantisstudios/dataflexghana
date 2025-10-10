"use client"
import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react"
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
  Mail,
  Wallet,
  X,
  ShoppingBag,
  PiggyBank,
  Shield,
  FileText,
  ArrowRight,
  CheckCircle,
  Users,
  Heart,
} from "lucide-react"
import { BackToTop } from "@/components/back-to-top"
import AgentReminderPopup from "@/components/agent-reminder-popup"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/lib/supabase"
import { RichTextRenderer } from "@/components/ui/rich-text-renderer"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ImageModal } from "@/components/ui/image-modal"
import Top5AgentsRanking from "@/components/agent/Top5AgentsRanking"
import { calculateCompleteEarnings } from "@/lib/earnings-calculator"
// import { VoucherCardsTab } from "@/components/agent/voucher/VoucherCardsTab" // Removed VoucherCardsTab import
import { AgentMenuCards } from "@/components/agent/AgentMenuCards"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FloatingAudioPlayer } from "@/components/floating-audio-player"
import { ProductSlider } from "@/components/agent/ProductSlider"
import AgentPropertiesShowcase from "@/components/agent/dashboard/AgentPropertiesShowcase"
import DashboardFloatingChat from "@/components/agent/dashboard/DashboardFloatingChat"

const ComplianceTab = lazy(() =>
  import("@/components/agent/compliance/ComplianceTab").then((m) => ({ default: m.ComplianceTab })),
)

const safeCommissionDisplay = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0
  }
  return Number(value)
}

export default function AgentDashboard() {
  const [agent, setAgent] = useState(null)
  const { unreadCount, getUnreadCount, markAsRead } = useUnreadMessages(agent?.id || "", "agent")
  const menuSectionRef = useRef<HTMLDivElement>(null)
  const smartWalletRef = useRef<HTMLDivElement>(null)
  const walletTopupRef = useRef<HTMLDivElement>(null)
  const performanceRef = useRef<HTMLDivElement>(null)
  const statisticsRef = useRef<HTMLDivElement>(null)
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [referralWhatsApp, setReferralWhatsApp] = useState("")
  const [referralWhatsAppError, setReferralWhatsAppError] = useState("")
  const [showDomesticReferralDialog, setShowDomesticReferralDialog] = useState(false)
  const [domesticReferralWhatsApp, setDomesticReferralWhatsApp] = useState("")
  const [domesticReferralWhatsAppError, setDomesticReferralWhatsAppError] = useState("")
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
  const [wholesaleProductsCount, setWholesaleProductsCount] = useState(0)
  const [basicCounts, setBasicCounts] = useState({
    referralsCount: 0,
    dataOrdersCount: 0,
  })
  const [monthlyEarnings, setMonthlyEarnings] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [orders, setOrders] = useState([])
  const [referrals, setReferrals] = useState([])
  const [services, setServices] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [paidWithdrawals, setPaidWithdrawals] = useState([])
  const [dataBundles, setDataBundles] = useState([])
  const [dataOrders, setDataOrders] = useState([])
  const [wholesaleOrders, setWholesaleOrders] = useState([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [tabLoadingStates, setTabLoadingStates] = useState({
    services: false,
    "data-bundles": false,
    referrals: false,
    withdrawals: false,
    profile: false,
    jobs: false,
    "paid-commissions": false,
    properties: false,
    savings: false,
    compliance: false,
  })
  const [loadedTabs, setLoadedTabs] = useState({
    services: false,
    "data-bundles": false,
    referrals: false,
    withdrawals: false,
    profile: false,
    jobs: false,
    "paid-commissions": false,
    properties: false,
    savings: false,
    compliance: false,
  })
  const [showNotification, setShowNotification] = useState(true)
  const [showWalletStrategy, setShowWalletStrategy] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")
  const [unreadMessages, setUnreadMessages] = useState<{ [key: string]: number }>({})
  const [showStatistics, setShowStatistics] = useState(false)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("services") // Changed default active tab
  const [servicesSearchTerm, setServicesSearchTerm] = useState("")
  const [servicesFilter, setServicesFilter] = useState("All Services")
  const [filteredServices, setFilteredServices] = useState([])
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [referralsFilter, setReferralsFilter] = useState("All Referrals")
  const [filteredReferrals, setFilteredReferrals] = useState([])
  const [currentReferralsPage, setCurrentReferralsPage] = useState(1)
  const [dataBundlesFilter, setDataBundlesFilter] = useState("All Networks")
  const [currentWithdrawalsPage, setCurrentWithdrawalsPage] = useState(1)
  const [currentPaidWithdrawalsPage, setCurrentPaidWithdrawalsPage] = useState(1)
  const [jobSearchTerm, setJobSearchTerm] = useState("")
  const [jobsFilterAgent, setJobsFilterAgent] = useState("All Jobs")
  const [filteredJobsAgent, setFilteredJobsAgent] = useState([])
  const [currentJobsPage, setCurrentJobsPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const router = useRouter()
  const [showDashboardAudio, setShowDashboardAudio] = useState(true)
  const [showDashboardAudioPlayer, setShowDashboardAudioPlayer] = useState(false)

  const checkWalletStrategyDisplay = () => {
    const lastShown = localStorage.getItem("walletStrategyLastShown")
    const today = new Date().toDateString()
    if (!lastShown || lastShown !== today) {
      setShowWalletStrategy(true)
    }
  }

  const checkAudioPlayerDisplay = () => {
    const lastShown = localStorage.getItem("audioPlayerLastShown")
    const today = new Date().toDateString()
    if (!lastShown || lastShown !== today) {
      setShowDashboardAudioPlayer(true)
    } else {
      setShowDashboardAudioPlayer(false)
    }
  }

  useEffect(() => {
    checkWalletStrategyDisplay()
    checkAudioPlayerDisplay()
  }, [])

  const handleCloseWalletStrategy = () => {
    const today = new Date().toDateString()
    localStorage.setItem("walletStrategyLastShown", today)
    setShowWalletStrategy(false)
  }

  const handleCloseAudioPlayer = () => {
    const today = new Date().toDateString()
    localStorage.setItem("audioPlayerLastShown", today)
    setShowDashboardAudioPlayer(false)
  }

  const getCurrentAgent = () => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      return null
    }
    return JSON.parse(agentData)
  }

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const { calculateWalletBalance } = await import("@/lib/earnings-calculator")
        const walletBalance = await calculateWalletBalance(currentAgent.id)
        setWalletBalance(walletBalance)
        const { calculateMonthlyStatistics } = await import("@/lib/earnings-calculator")
        const monthlyStats = await calculateMonthlyStatistics(currentAgent.id)
        setEarningsData({
          totalEarnings: monthlyStats.totalCommissions,
          totalPaidEarnings: monthlyStats.totalPaidOut,
          pendingPayout: monthlyStats.pendingPayout,
          availableBalance: monthlyStats.availableCommissions,
          walletBalance: walletBalance,
          referralCommissions: 0,
          dataOrderCommissions: 0,
          wholesaleCommissions: 0,
        })
        const { data: referralsData, error: referralsError } = await supabase
          .from("referrals")
          .select(`*, services (title, commission_amount)`)
          .eq("agent_id", currentAgent.id)
          .order("created_at", { ascending: false })
          .limit(5)
        if (referralsError) {
          console.error("Error loading referrals:", referralsError)
        }
        const { data: dataOrdersData, error: dataOrdersError } = await supabase
          .from("data_orders")
          .select(`*, data_bundles!fk_data_orders_bundle_id (name, provider, size_gb)`)
          .eq("agent_id", currentAgent.id)
          .order("created_at", { ascending: false })
          .limit(5)
        if (dataOrdersError) {
          console.error("Error loading data orders:", dataOrdersError)
        }
        const { data: wholesaleOrdersData, error: wholesaleOrdersError } = await supabase
          .from("wholesale_orders")
          .select(`*, wholesale_products (name, price)`)
          .eq("agent_id", currentAgent.id)
          .order("created_at", { ascending: false })
          .limit(5)
        if (wholesaleOrdersError) {
          console.error("Error loading wholesale orders:", wholesaleOrdersError)
        }
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("agent_id", currentAgent.id)
          .order("requested_at", { ascending: false })
          .limit(5)
        if (withdrawalsError) {
          console.error("Error loading withdrawals:", withdrawalsError)
        }
        const { data: paidWithdrawalsData, error: paidWithdrawalsError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("agent_id", currentAgent.id)
          .eq("status", "paid")
          .order("paid_at", { ascending: false })
          .limit(10)
        if (paidWithdrawalsError) {
          console.error("Error loading paid withdrawals:", paidWithdrawalsError)
        }
        setReferrals(referralsData || [])
        setDataOrders(dataOrdersData || [])
        setWholesaleOrders(wholesaleOrdersData || [])
        setWithdrawals(withdrawalsData || [])
        setPaidWithdrawals(paidWithdrawalsData || [])
        console.log("✅ Dashboard data loaded with corrected statistics")
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        alert("Failed to load dashboard data. Please refresh the page and try again.")
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [router])

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

  const loadTabData = useCallback(
    async (tabName: string) => {
      if (loadedTabs[tabName] || !agent?.id) return
      setTabLoadingStates((prev) => ({ ...prev, [tabName]: true }))
      try {
        switch (tabName) {
          case "services":
            const { data: servicesData } = await supabase
              .from("services")
              .select("*")
              .eq("service_type", "referral")
              .order("created_at", { ascending: false })
            setServices(servicesData || [])
            break
          case "data-bundles":
            const [{ data: dataBundlesData }, { data: dataOrdersData }] = await Promise.all([
              supabase.from("data_bundles").select("*").eq("is_active", true).order("provider", { ascending: true }),
              supabase
                .from("data_orders")
                .select(`*, data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price)`)
                .eq("agent_id", agent.id)
                .order("created_at", { ascending: false }),
            ])
            setDataBundles(dataBundlesData || [])
            setDataOrders(dataOrdersData || [])
            break
          case "referrals":
            const { data: referralsData } = await supabase
              .from("referrals")
              .select(`*, services (title, commission_amount)`)
              .eq("agent_id", agent.id)
              .order("created_at", { ascending: false })
            setReferrals(referralsData || [])
            break
          case "withdrawals":
            const { data: withdrawalsData } = await supabase
              .from("withdrawals")
              .select("*")
              .eq("agent_id", agent.id)
              .order("requested_at", { ascending: false })
            setWithdrawals(withdrawalsData || [])
            break
          case "jobs":
            const { data: jobsData } = await supabase
              .from("jobs")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
            setJobs(jobsData || [])
            break
          case "compliance":
            break
          case "profile":
            break
          case "savings":
            break
          case "properties":
            break
          case "paid-commissions":
            const { data: paidWithdrawalsData } = await supabase
              .from("withdrawals")
              .select("*")
              .eq("agent_id", agent.id)
              .eq("status", "paid")
              .order("paid_at", { ascending: false })
              .limit(10)
            setPaidWithdrawals(paidWithdrawalsData || [])
            break
        }
        setLoadedTabs((prev) => ({ ...prev, [tabName]: true }))
      } catch (error) {
        console.error(`Error loading ${tabName} data:`, error)
      } finally {
        setTabLoadingStates((prev) => ({ ...prev, [tabName]: false }))
      }
    },
    [loadedTabs, agent?.id, agent?.id],
  )

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
    loadTabData(tabValue)
    setTimeout(() => {
      if (statisticsRef.current) {
        statisticsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 100)
  }

  useEffect(() => {
    if (!loadedTabs.services) return
    let filtered = services.filter(
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
    setFilteredServices(filtered)
    setCurrentServicesPage(1)
  }, [servicesSearchTerm, services, servicesFilter, loadedTabs.services])

  useEffect(() => {
    if (!loadedTabs.referrals) return
    let filtered = referrals
    if (referralsFilter !== "All Referrals") {
      filtered = referrals.filter((referral) => {
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
    setFilteredReferrals(filtered)
    setCurrentReferralsPage(1)
  }, [referrals, referralsFilter, loadedTabs.referrals])

  const ensureJobTitle = (job: Job): Job => {
    if (!job.title && job.industry) {
      return { ...job, title: job.industry }
    }
    return job
  }

  useEffect(() => {
    if (!loadedTabs.jobs) return
    let filtered = jobs.filter(
      (job) =>
        job.is_active &&
        (job.title?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.company?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
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
    setFilteredJobsAgent(filtered)
    setCurrentJobsPage(1)
  }, [jobSearchTerm, jobs, jobsFilterAgent, loadedTabs.jobs])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage)
  }

  const handlePageChange = (newPage: number, setCurrentPage: (page: number) => void) => {
    setCurrentPage(newPage)
    scrollToTop()
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null
    const getVisiblePages = () => {
      const isMobile = window.innerWidth < 768
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
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center text-xs sm:text-text-sm">
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
      return dataBundles.filter((bundle) => bundle.provider === provider)
    }
    return dataBundles.filter((bundle) => bundle.provider === provider && bundle.provider === dataBundlesFilter)
  }

  const openImageModal = (images: string[], index: number, alt: string) => {
    setModalImages(images.filter((img) => img && img.trim() !== ""))
    setModalImageIndex(index)
    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  const [agentId, setAgentId] = useState<string | null>(null)

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (agentData) {
      const parsedAgent = JSON.parse(agentData)
      setAgentId(parsedAgent.id)
    }
  }, [])

  const loadEarningsData = async () => {
    if (!agentId) return
    try {
      setLoading(true)
      const commissionSummary = await getAgentCommissionSummary(agentId)
      console.log("✅ Agent Dashboard using unified commission system:", {
        agentId,
        totalEarned: commissionSummary.totalEarned,
        availableForWithdrawal: commissionSummary.availableForWithdrawal,
        pendingWithdrawal: commissionSummary.pendingWithdrawal,
        totalWithdrawn: commissionSummary.totalWithdrawn,
      })
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

  useEffect(() => {
    const loadData = async () => {
      if (!agentId) return
      try {
        setLoading(true)
        const commissionSummary = await getAgentCommissionSummary(agentId)
        setEarningsData({
          totalEarnings: commissionSummary.totalEarned,
          availableBalance: commissionSummary.availableForWithdrawal,
          pendingPayout: commissionSummary.pendingWithdrawal,
          totalPaidEarnings: commissionSummary.totalWithdrawn,
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
        const { data: referralsData, error: referralsError } = await supabase
          .from("referrals")
          .select(`*, services (title, commission_amount)`)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(5)
        if (referralsError) {
          console.error("Error loading referrals:", referralsError)
        }
        const { data: dataOrdersData, error: dataOrdersError } = await supabase
          .from("data_orders")
          .select(`*, data_bundles!fk_data_orders_bundle_id (name, provider, size_gb)`)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(5)
        if (dataOrdersError) {
          console.error("Error loading data orders:", dataOrdersError)
        }
        const { data: wholesaleOrdersData, error: wholesaleOrdersError } = await supabase
          .from("wholesale_orders")
          .select(`*, wholesale_products (name, price)`)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(5)
        if (wholesaleOrdersError) {
          console.error("Error loading wholesale orders:", wholesaleOrdersError)
        }
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("agent_id", agentId)
          .order("requested_at", { ascending: false })
          .limit(5)
        if (withdrawalsError) {
          console.error("Error loading withdrawals:", withdrawalsError)
        }
        const { data: paidWithdrawalsData, error: paidWithdrawalsError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("agent_id", agentId)
          .eq("status", "paid")
          .order("paid_at", { ascending: false })
          .limit(10)
        if (paidWithdrawalsError) {
          console.error("Error loading paid withdrawals:", paidWithdrawalsError)
        }
        setReferrals(referralsData || [])
        setDataOrders(dataOrdersData || [])
        setWholesaleOrders(wholesaleOrdersData || [])
        setWithdrawals(withdrawalsData || [])
        setPaidWithdrawals(paidWithdrawalsData || [])
        setBasicCounts({
          referralsCount: commissionSummary.totalReferrals,
          dataOrdersCount: commissionSummary.totalDataOrders,
        })
        setWholesaleProductsCount(commissionSummary.totalWholesaleProducts)
        console.log("✅ Dashboard data loaded with corrected statistics")
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        alert("Failed to load dashboard data. Please refresh the page and try again.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [agentId])

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
✅ Access to multiple income streams
✅ Professional training and support

*Register here:* ${typeof window !== "undefined" ? window.location.origin : "https://dataflexghana.com"}/agent/register

⚠️ *IMPORTANT:* After completing your registration, please contact the admin on WhatsApp at +233242799990 and mention that *${agent?.full_name}* recommended you to register. This ensures you get proper onboarding support!

Don't miss this opportunity to start earning today! 💰

Best regards,
${agent?.full_name}
DataFlex Ghana Agent`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {showDashboardAudioPlayer && (
        <FloatingAudioPlayer
          audioSrc="/agent_dashboard_intro.mp3"
          title="Dashboard Guide"
          description="Learn to maximize your earnings"
          onClose={handleCloseAudioPlayer}
        />
      )}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Data Flex Agent Portal</h1>
                <p className="text-emerald-100 font-medium">Welcome back, {agent?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Link href="/agent/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-8">
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

        {/* CHANGE: Updated voucher card section to reflect educational products */}
        <div className="mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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

        {/* Business Registration & Compliance Section */}
        <div className="mb-8">
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Left Content */}
                <div className="space-y-4 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-orange-800">Business Registration & Compliance</h3>
                        <p className="text-orange-600 font-medium text-sm">Help friends to legalize their business</p>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">
                      Assist friends, relatives, colleagues and the general public to register their businesses online.
                      <span className="font-semibold text-orange-600"> Earn 80-130 Cedis per registration</span>
                    </p>

                    {/* Features - Compact for agent dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "100% Online form filling",
                        "No Paperworks or queues",
                        "Free Nationwide Delivery",
                        "100% Secured Process",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Caption Box */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span className="font-semibold text-orange-800 text-sm">100% online Business Registration</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        We remove the busy up and down, hassle and bustle of city life, queuing or paperworks
                      </p>
                    </div>
                  </div>

                  {/* Button */}
                  <Button
                    size="sm"
                    asChild
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg"
                  >
                    <Link href="https://bizcomplianceforms.netlify.app/" target="_blank" rel="noopener noreferrer">
                      Visit Registration Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Right Image - Compact for agent dashboard */}
                <div className="relative">
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img
                      src="/images/businessreg.jpg"
                      alt="Business registration documents"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900">Fully Legal</div>
                            <div className="text-xs text-gray-600">Government Approved</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 100% Free Job search support Section */}
        <div className="mb-8">
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Left Content */}
                <div className="space-y-4 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-800">100% Free Job search support</h3>
                        <p className="text-green-600 font-medium text-sm">
                          Work with Fast-Hired And Travels. Help friends find jobs at Zero Agency Fees
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">
                      Assist friends, relatives, colleagues to find jobs near them without agency Fees.
                      <span className="font-semibold text-green-600"> Completely free job placement support</span>
                    </p>

                    {/* Features - Compact for agent dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "No Form Filling fees",
                        "No Processing Fees",
                        "Free Job Search Support",
                        "Free Interview Guide",
                        "Free On-job support",
                        "No Salary Deductions",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Caption Box */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span className="font-semibold text-green-800 text-sm">
                          100% Free Job search support in Ghana
                        </span>
                      </div>
                      <p className="text-xs text-green-700">
                        We remove the stress of searching for credible direct jobs from companies, businesses and from
                        home owners in Ghana
                      </p>
                    </div>
                  </div>

                  {/* Button */}
                  <Button
                    size="sm"
                    asChild
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    <Link href="https://fasthiredterms.netlify.app/" target="_blank" rel="noopener noreferrer">
                      Visit Fast-Hired Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Right Image - Compact for agent dashboard */}
                <div className="relative">
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img
                      src="/images/hero.png"
                      alt="Job search and employment support"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900">100% Free</div>
                            <div className="text-xs text-gray-600">No Agency Fees</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {showWalletStrategy && (
          <div className="relative mb-6 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg border-l-4 border-l-blue-700">
            <button
              onClick={handleCloseWalletStrategy}
              className="absolute top-4 right-4 text-white hover:text-blue-100"
            >
              <X />
            </button>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Smart Wallet Strategy
              </h3>
              <div className="text-blue-100 space-y-2 text-sm leading-relaxed">
                <ul className="list-disc list-inside">
                  <li>
                    <strong>One-time network charge:</strong> When you load your wallet, you pay a one-time network
                    charge.
                  </li>
                  <li>
                    <strong>No transfer or payment fees:</strong> When you buy from your wallet, you pay no additional
                    fees.
                  </li>
                  <li>
                    <strong>Repeated charges for manual payments:</strong> Paying manually for each order incurs charges
                    of GH₵0.50 - GH₵2 per transaction.
                  </li>
                  <li>
                    <strong>Be smart:</strong> Cut repeated costs, speed up your orders, and save on every purchase.
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button asChild size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-medium">
                  <a href="https://agentwelcome.netlify.app/" target="_blank" rel="noopener noreferrer">
                    Learn How It Works
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 border border-purple-200">
            <div className="flex flex-col items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Wallet Top-Up</h3>
                  <p className="text-purple-100 text-sm">
                    Load your wallet once and save on transaction fees for all future orders
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg"
              >
                <Link href="/agent/wallet">
                  <Wallet className="h-5 w-5 mr-2" />
                  Top Up Wallet
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 border border-green-200">
            <div className="flex flex-col items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Invite Friends To Join</h3>
                  <p className="text-green-100 text-sm">
                    Share DataFlex Ghana with friends and receive GH¢15.00 Free Wallet Top-Up when they make their first
                    purchase
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowReferralDialog(true)}
                size="lg"
                className="w-full sm:w-auto bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Send Referral Message
              </Button>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <AgentPropertiesShowcase />
        </div>

        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 border border-blue-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Heart className="h-3 w-3 text-yellow-800" />
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Help A Friend Find Work</h3>
                  <p className="text-blue-100 text-sm lg:text-base max-w-md">
                    Help friends around you find domestic jobs in Ghana and abroad. Share opportunities and make a
                    difference in their lives!
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">No Fees</span>
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">Good Salary</span>
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">Protected Rights</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowDomesticReferralDialog(true)}
                size="lg"
                className="w-full lg:w-auto bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg animate-bounce"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Help A Friend Now
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ProductSlider />
        </div>
        <div className="mb-8">
          <Top5AgentsRanking />
        </div>
        <div className="mb-8">
          <div className="w-full flex justify-center lg:block">
            <div className="relative aspect-video bg-gradient-to-br from-emerald-50 to-emerald-100 border-y lg:border lg:rounded-lg border-emerald-200 w-full max-w-4xl lg:max-w-none">
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <div className="absolute top-4 right-4 bg-black/20 text-white px-3 py-1 rounded text-sm font-medium backdrop-blur-sm">
                  Agent ID: {agent?.id?.slice(-6) || "XXXXXX"}
                </div>
              </div>
              <video
                width="1920"
                height="1080"
                controls
                preload="metadata"
                className="w-full h-full object-cover lg:rounded-lg"
                poster="/adamantis_introvideo_poster.jpg"
                style={{ aspectRatio: "16/9" }}
              >
                <source src="/adamantis_introvideo.mp4" type="video/mp4" />
                <source src="/adamantis_introvideo.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-4">About Adamantis Studios</h3>
                  <p className="text-emerald-700 leading-relaxed">
                    Adamantis Studios is a holistic marketing and IT firm offering comprehensive services to help
                    businesses grow and thrive in today's competitive market. We combine traditional marketing
                    strategies with cutting-edge digital solutions to provide a complete package for our clients.
                  </p>
                  <p className="text-emerald-600 text-sm leading-relaxed">
                    With expertise in over 50 different services, we're equipped to handle all your marketing, design,
                    IT, and security needs under one roof.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg"
                >
                  <a
                    href="https://drive.google.com/file/d/1LZa0LGCOFiPutN6C8Blo4pt18srsOsgE/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Company Profile
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mb-8">
          {!showStatistics ? (
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6 text-center py-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">Dashboard Statistics</h3>
                    <p className="text-emerald-600 mb-4">
                      View detailed statistics about your performance, earnings, and activities
                    </p>
                  </div>
                  <Button
                    onClick={loadStatistics}
                    disabled={statisticsLoading}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                  >
                    {statisticsLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-emerald-800">Dashboard Statistics</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatistics(false)}
                  className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hide Statistics
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6">
                <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Total Commissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      GH₵ {safeCommissionDisplay(earningsData.availableBalance || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-emerald-100 mt-1">Available to withdraw</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      GH₵ {safeCommissionDisplay(earningsData.walletBalance || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-purple-100 mt-1">Spendable money</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsContent value="voucher-cards" className="space-y-4">
            {/* Removed voucher-cards TabsContent */}
          </TabsContent>

          <TabsContent value="wholesale" className="space-y-4">
            <AgentPropertiesShowcase />

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
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
                    <p className="text-sm text-emerald-600">Curated wholesale products across multiple categories</p>
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
                          <SelectValue />
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getPaginatedData(filteredServices, currentServicesPage).map((service) => (
                    <Card
                      key={service.id}
                      className="hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm hover:scale-105"
                    >
                      <CardHeader>
                        {service.image_url && (
                          <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden cursor-pointer">
                            <ImageWithFallback
                              src={service.image_url || "/placeholder.svg"}
                              alt={service.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                              onClick={() => openImageModal([service.image_url], 0, service.title)}
                              fallbackSrc="/placeholder.svg?height=192&width=400"
                            />
                          </div>
                        )}
                        <CardTitle className="text-lg text-emerald-800">{service.title}</CardTitle>
                        <CardDescription className="text-emerald-600">
                          <RichTextRenderer content={service.description} />
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-600">Commission:</span>
                            <span className="text-xl font-bold text-green-600">
                              GH₵ {safeCommissionDisplay(service.commission_amount).toFixed(2)}
                            </span>
                          </div>
                          {service.product_cost && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-emerald-600">Product Cost:</span>
                              <span className="text-sm font-semibold text-emerald-800">
                                GH₵ {safeCommissionDisplay(service.product_cost).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              asChild
                              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 flex-1"
                            >
                              <Link href={`/agent/refer/${service.id}`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Refer
                              </Link>
                            </Button>
                            {service.material?.material_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-emerald-300 text-emerald-600 bg-transparent"
                              >
                                <Link href={service.material.material_link} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <PaginationControls
                  currentPage={currentServicesPage}
                  totalPages={getTotalPages(filteredServices.length)}
                  onPageChange={(page) => handlePageChange(page, setCurrentServicesPage)}
                />
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
                  <h2 className="text-2xl font-bold text-emerald-800">Data Bundles</h2>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <Button
                      asChild
                      size="sm"
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Link href="/agent/data-order">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Order Data</span>
                        <span className="sm:hidden">Order Data</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Link href="/agent/data-orders">
                        <Smartphone className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">View All Orders</span>
                        <span className="sm:hidden">View All Orders</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                <Tabs defaultValue="MTN" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
                    {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                      const logoMap = {
                        MTN: "/images/mtn-logo.jpg",
                        AirtelTigo: "/images/airteltigo-logo.jpg",
                        Telecel: "/images/telecel-logo.jpg",
                      }
                      const bundleCount = getFilteredDataBundles(provider).length
                      return (
                        <TabsTrigger
                          key={provider}
                          value={provider}
                          className="text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-2 lg:p-3 flex items-center justify-center gap-2"
                        >
                          <img
                            src={logoMap[provider] || "/placeholder.svg"}
                            alt={`${provider} logo`}
                            className="w-5 h-5 rounded object-cover"
                          />
                          <div className="flex flex-col items-center">
                            <span className="hidden sm:inline">{provider}</span>
                            <span className="text-xs opacity-75">({bundleCount})</span>
                          </div>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                  {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                    const providerBundles = getFilteredDataBundles(provider).sort((a, b) => a.size_gb - b.size_gb)
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
                          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                            <CardContent className="pt-6 text-center">
                              <div className="text-gray-500 mb-4">
                                <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No data bundles available for {provider}</p>
                                <p className="text-sm">Check back later for new bundles</p>
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
                                        GH₵ {safeCommissionDisplay(bundle.price * bundle.commission_rate).toFixed(2)}
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
                </Tabs>
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
                        <SelectValue />
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
                            <p className="text-emerald-600">{referral.description}</p>
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
                    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
                      {withdrawals.length} withdrawals
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
                  {getPaginatedData(withdrawals, currentWithdrawalsPage).map((withdrawal) => (
                    <Card
                      key={withdrawal.id}
                      className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-emerald-800 text-xl">
                              GH₵ {safeCommissionDisplay(withdrawal.amount).toFixed(2)}
                            </h3>
                            <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-emerald-600">
                              <span className="font-medium">MoMo Number:</span> {withdrawal.momo_number}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Requested:</span> {formatTimestamp(withdrawal.requested_at)}
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
                  {getPaginatedData(withdrawals, currentWithdrawalsPage).length === 0 && (
                    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
                  totalPages={getTotalPages(withdrawals.length)}
                  onPageChange={(page) => handlePageChange(page, setCurrentWithdrawalsPage)}
                />
              </>
            )}
          </TabsContent>
          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-emerald-800">Profile Settings</h2>
            </div>
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
                  <h2 className="text-2xl font-bold text-emerald-800">Job Board</h2>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <Select value={jobsFilterAgent} onValueChange={setJobsFilterAgent}>
                      <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
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
                      {filteredJobsAgent.length} jobs
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  {getPaginatedData(filteredJobsAgent, currentJobsPage).map((job) => {
                    const jobWithTitle = ensureJobTitle(job)

                    return (
                      <Card
                        key={job.id}
                        className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                      >
                        <CardContent className="pt-6">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <h3 className="font-semibold text-emerald-800 text-lg">{jobWithTitle.title}</h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-600">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4" />
                                  <span>{job.company}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{job.industry}</span>
                                </div>
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <div
                                  className="text-sm text-emerald-700 prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: job.description
                                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                      .replace(/• (.*?)(?=\n|$)/g, "<li>$1</li>")
                                      .replace(
                                        /(<li>.*<\/li>)/gs,
                                        '<ul class="list-disc list-inside space-y-1">$1</ul>',
                                      )
                                      .replace(/\n/g, "<br>"),
                                  }}
                                />
                              </div>
                              <p className="text-emerald-500 text-xs">
                                <span className="font-medium">Posted:</span> {formatTimestamp(job.created_at)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-emerald-100">
                              {jobWithTitle.contact_email && (
                                <Button
                                  asChild
                                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                                >
                                  <a
                                    href={`mailto:${jobWithTitle.contact_email}?subject=Application for ${jobWithTitle.title}`}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Apply via Email
                                  </a>
                                </Button>
                              )}
                              {jobWithTitle.contact_phone && (
                                <Button
                                  asChild
                                  variant="outline"
                                  className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                                >
                                  <a href={`tel:${jobWithTitle.contact_phone}`}>
                                    <Smartphone className="h-4 w-4 mr-2" />
                                    Call Now
                                  </a>
                                </Button>
                              )}
                              {jobWithTitle.application_url && (
                                <Button
                                  asChild
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                                >
                                  <a href={jobWithTitle.application_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Apply Online
                                  </a>
                                </Button>
                              )}
                              {/* Fallback to legacy application_contact if no new fields */}
                              {!job.contact_email &&
                                !job.contact_phone &&
                                !job.application_url &&
                                job.application_contact && (
                                  <Button
                                    asChild
                                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                                  >
                                    {job.application_method === "email" ? (
                                      <a
                                        /* Updated to use correct field names */
                                        href={`mailto:${job.application_contact}?subject=Application for ${job.title}`}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Apply via Email
                                      </a>
                                    ) : (
                                      <a href={job.application_contact} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Apply Online
                                      </a>
                                    )}
                                  </Button>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {getPaginatedData(filteredJobsAgent, currentJobsPage).length === 0 && (
                    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                      <CardContent className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                          <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>
                            {jobsFilterAgent === "All Jobs"
                              ? "No jobs available at the moment."
                              : `No ${jobsFilterAgent.toLowerCase()} jobs found.`}
                          </p>
                          <p className="text-sm">Check back later for new opportunities!</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <PaginationControls
                  currentPage={currentJobsPage}
                  totalPages={getTotalPages(filteredJobsAgent.length)}
                  onPageChange={(page) => handlePageChange(page, setCurrentJobsPage)}
                />
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
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
              {getPaginatedData(paidWithdrawals, currentPaidWithdrawalsPage).map((paidWithdrawal) => (
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
                          <span className="font-medium">Requested:</span> {formatTimestamp(paidWithdrawal.requested_at)}
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
              {getPaginatedData(paidWithdrawals, currentPaidWithdrawalsPage).length === 0 && (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
              totalPages={getTotalPages(paidWithdrawals.length)}
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
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
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
        </Tabs>
      </div>
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
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={setModalImageIndex}
        alt={modalImageAlt}
      />
      <AgentReminderPopup />
      <BackToTop />
      {agent && <DashboardFloatingChat agent={agent} />}
    </div>
  )
}
