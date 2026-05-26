"use client"
import { getAdminAuthHeaders } from "@/lib/api-client"
import React, { lazy, Suspense, useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
  import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
  import {
  Users,
  Package,
  Database,
  Smartphone,
  MessageCircle,
  Banknote,
  Wallet,
  ShoppingBag,
  Settings,
  TrendingUp,
  Eye,
  EyeOff,
  Activity,
  BarChart3,
  Bell,
  Shield,
  CheckCircle2,
  PiggyBank,
  Wrench,
  UserPlus,
  Home,
  FileText,
  BookOpen,
  Music,
  Mail,
  Shirt,
  Sparkles,
  ShoppingBasket,
  Megaphone,
  Leaf,
  Play,
  Award,
  Phone,
  ListChecks,
  ScanFace,
  Radio,
} from "lucide-react"
import { logoutAdmin, clearAdminSession, getStoredAdmin } from "@/lib/auth"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { BackToTop } from "@/components/back-to-top"
import { UnreadNotification } from "@/components/unread-notification"
import { supabase } from "@/lib/supabase-client";
import { connectionManager } from "@/lib/connection-manager"
import { toast } from "sonner"
import Link from "next/link"
import { PendingOrdersFeed } from "@/components/admin/PendingOrdersFeed"
import { FollowUpsTodayCard } from "@/components/admin/FollowUpsTodayCard"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminConnectionStatus } from "@/components/admin/AdminConnectionStatus"

// Lazy load tab components
const AgentsTab = lazy(() => import("@/components/admin/tabs/AgentsTab"))
const AgentManagementTab = lazy(() => import("@/components/admin/tabs/AgentManagementTab"))
const ManualRegistrationTab = lazy(() => import("@/components/admin/tabs/ManualRegistrationTab"))
const ServicesTab = lazy(() => import("@/components/admin/tabs/ServicesTab"))
const DataTab = lazy(() => import("@/components/admin/tabs/DataTab"))
const OrdersTab = lazy(() => import("@/components/admin/tabs/OrdersTab"))
const ReferralsTab = lazy(() => import("@/components/admin/tabs/ReferralsTab"))
const PayoutsTab = lazy(() => import("@/components/admin/tabs/PayoutsTab"))
const WalletsTab = lazy(() => import("@/components/admin/tabs/WalletsTab"))
const WalletOverviewTab = lazy(() => import("@/components/admin/tabs/WalletOverviewTab"))
const WholesaleTab = lazy(() => import("@/components/admin/tabs/WholesaleTab"))
const SavingsTab = lazy(() => import("@/components/admin/tabs/SavingsTab"))
const PropertiesTab = lazy(() => import("@/components/admin/tabs/PropertiesTab"))
const DomesticWorkersTab = lazy(() => import("@/components/admin/tabs/DomesticWorkersTab"))
const DomesticWorkerClientRequestsTab = lazy(() => import("@/components/admin/tabs/DomesticWorkerClientRequestsTab"))
const BlogsTab = lazy(() => import("@/components/admin/tabs/BlogsTab"))
const ComplianceTab = lazy(() => import("@/components/admin/tabs/ComplianceTab"))
const TeacherHubTab = lazy(() => import("@/components/admin/tabs/TeacherHubTab"))
const AudioManagementTab = lazy(() => import("@/components/admin/tabs/AudioManagementTab"))
const LinkCacheManagementTab = lazy(() => import("@/components/admin/tabs/LinkCacheManagementTab"))
const WritingServicesAdminTab = lazy(() => import("@/components/admin/tabs/WritingServicesAdminTab"))
const InvitationManagementTab = lazy(() => import("@/components/admin/tabs/InvitationManagementTab"))
const AgentNotificationsTab = lazy(() => import("@/components/admin/tabs/AgentNotificationsTab"))
const StorefrontManagerTab = lazy(() => import("@/components/admin/tabs/StorefrontManagerTab"))
const BulkOrderManagementTab = lazy(() => import("@/components/admin/tabs/BulkOrderManagementTab"))
const OnlineCoursesTab = lazy(() => import("@/components/admin/tabs/OnlineCoursesTab"))
const DataBundleOrdersLogTab = lazy(() => import("@/components/admin/tabs/DataBundleOrdersLogTab"))
const SMSNotificationsTab = lazy(() => import("@/components/admin/tabs/SMSNotificationsTab"))
const FashionAvenueTab = lazy(() => import("@/components/admin/tabs/FashionAvenueTab"))
const FashionProjectRequestsTab = lazy(() => import("@/components/admin/tabs/FashionProjectRequestsTab"))
const FashionReferralsTab = lazy(() => import("@/components/admin/tabs/FashionReferralsTab"))
const SalonTab = lazy(() => import("@/components/admin/tabs/SalonTab"))
const MaintenancePanelTab = lazy(() => import("@/components/admin/tabs/MaintenancePanelTab"))
const GroceryRequestsTab = lazy(() => import("@/components/admin/tabs/GroceryRequestsTab"))
const AdvertisingAdminTab = lazy(() => import("@/components/admin/tabs/AdvertisingAdminTab"))
const FarmersFriendAdminTab = lazy(() => import("@/components/admin/tabs/FarmersFriendAdminTab"))
const InfluencersAdminTab = lazy(() => import("@/components/admin/tabs/InfluencersAdminTab"))
const AgentCallsAdminTab = lazy(() => import("@/components/admin/tabs/AgentCallsAdminTab"))
const ListingPackagesAdminTab = lazy(() => import("@/components/admin/tabs/ListingPackagesAdminTab"))
const PhotoVerificationAdminTab = lazy(() => import("@/components/admin/tabs/PhotoVerificationAdminTab"))
const VoiceRoomsAdminTab = lazy(() => import("@/components/admin/tabs/VoiceRoomsAdminTab"))
const TutorialsAdminTab = lazy(() => import("@/components/admin/tabs/TutorialsAdminTab"))
const SecurityLogsTab = lazy(() => import("@/components/admin/tabs/SecurityLogsTab"))
const AnalyticsDashboard = lazy(() => import("@/components/admin/AnalyticsDashboard"))

// Type definition for tab configuration
interface TabConfigItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<any> | null
}

// Custom hook for managing tab loading state
const useTabLoader = () => {
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["dashboard"]))
  const [activeTab, setActiveTab] = useState("dashboard")
  const loadTab = useCallback((tabName: string) => {
    setLoadedTabs((prev) => new Set([...prev, tabName]))
    setActiveTab(tabName)
  }, [])
  return { loadedTabs, activeTab, loadTab, setActiveTab }
}

// Loading skeleton component for tabs
const TabLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Tab configuration - unified system
const TAB_CONFIG: TabConfigItem[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, component: null },
  { id: "analytics", label: "Analytics", icon: TrendingUp, component: AnalyticsDashboard },
  { id: "security-log", label: "Security Log", icon: Shield, component: SecurityLogsTab },
  { id: "storefront-manager", label: "Storefront Management", icon: ShoppingBag, component: StorefrontManagerTab },
  { id: "agents", label: "Agents", icon: Users, component: AgentsTab },
  { id: "photo-verification", label: "Photo Verification", icon: ScanFace, component: PhotoVerificationAdminTab },
  { id: "voice-rooms", label: "Agent Conference", icon: Radio, component: VoiceRoomsAdminTab },
  { id: "agent-calls", label: "Agent Calls", icon: Phone, component: AgentCallsAdminTab },
  { id: "agent-management", label: "Agent Management", icon: Shield, component: AgentManagementTab },
  { id: "sms-notifications", label: "SMS Notifications", icon: MessageCircle, component: SMSNotificationsTab },
  { id: "manual-registration", label: "Manual Registration", icon: UserPlus, component: ManualRegistrationTab },
  { id: "teacher-hub", label: "Teacher Hub", icon: BookOpen, component: TeacherHubTab },
  { id: "audio-management", label: "Audio Management", icon: Music, component: AudioManagementTab },
  { id: "link-cache", label: "Link Cache", icon: FileText, component: LinkCacheManagementTab },
  { id: "automation", label: "Automation", icon: Activity, component: null },
  { id: "performance", label: "Performance", icon: TrendingUp, component: null },
  { id: "domestic-workers", label: "Domestic Workers", icon: Users, component: DomesticWorkersTab },
  { id: "domestic-worker-requests", label: "Client Requests", icon: Bell, component: DomesticWorkerClientRequestsTab },
  { id: "grocery-requests", label: "Grocery Requests", icon: ShoppingBasket, component: GroceryRequestsTab },
  { id: "advertising", label: "Advertising", icon: Megaphone, component: AdvertisingAdminTab },
  { id: "micro-influencers", label: "Micro-Influencers", icon: Award, component: InfluencersAdminTab },
  { id: "listing-packages", label: "Listing Packages", icon: ListChecks, component: ListingPackagesAdminTab },
  { id: "farmers-friend", label: "Farmers Friend", icon: Leaf, component: FarmersFriendAdminTab },
  { id: "wholesale", label: "Wholesale", icon: ShoppingBag, component: WholesaleTab },
  { id: "properties", label: "Properties", icon: Home, component: PropertiesTab },
  { id: "blogs", label: "Blogs", icon: FileText, component: BlogsTab },
  { id: "services", label: "Services", icon: Package, component: ServicesTab },
  { id: "data", label: "Data", icon: Database, component: DataTab },
  { id: "data-bundle-orders-log", label: "Data Bundle Orders Log", icon: Smartphone, component: DataBundleOrdersLogTab },
  { id: "wallet-overview", label: "Wallet Overview", icon: TrendingUp, component: WalletOverviewTab },
  { id: "orders", label: "Orders", icon: Smartphone, component: OrdersTab },
  { id: "bulk-orders", label: "Bulk Orders", icon: Package, component: BulkOrderManagementTab },
  { id: "referrals", label: "Referrals", icon: MessageCircle, component: ReferralsTab },
  { id: "payouts", label: "Payouts", icon: Banknote, component: PayoutsTab },
  { id: "wallets", label: "Wallets", icon: Wallet, component: WalletsTab },
  { id: "savings", label: "Savings", icon: PiggyBank, component: SavingsTab },
  { id: "compliance", label: "Compliance", icon: FileText, component: ComplianceTab },
  { id: "professional-writing", label: "Professional Writing", icon: FileText, component: WritingServicesAdminTab },
  { id: "maintenance", label: "Maintenance", icon: Wrench, component: null },
  { id: "settings", label: "Settings", icon: Settings, component: null },
  { id: "invitation-management", label: "Invitation Management", icon: Mail, component: InvitationManagementTab },
  { id: "agent-notifications", label: "Agent Notifications", icon: Bell, component: AgentNotificationsTab },
  { id: "tutorials", label: "Tutorials", icon: Play, component: TutorialsAdminTab },
  { id: "online-courses", label: "Online Courses", icon: BookOpen, component: OnlineCoursesTab },
  { id: "fashion-avenue", label: "Fashion Avenue", icon: Shirt, component: FashionAvenueTab },
  { id: "fashion-project-requests", label: "Fashion Requests", icon: MessageCircle, component: FashionProjectRequestsTab },
  { id: "fashion-referrals", label: "Fashion Referrals", icon: UserPlus, component: FashionReferralsTab },
  { id: "salon", label: "Salon & Beauty", icon: Sparkles, component: SalonTab },
]

export default function AdminDashboard() {
  const { loadedTabs, activeTab, loadTab } = useTabLoader()

  const admin = getStoredAdmin()
  const [showNotification, setShowNotification] = useState(true)
  const [connectionHealth, setConnectionHealth] = useState(connectionManager.getHealthStatus())
  const [visibleTabs, setVisibleTabs] = useState<TabConfigItem[]>([])
  const [isTabsLoaded, setIsTabsLoaded] = useState(false)
  const [stats, setStats] = useState({
    totalAgents: 1247,
    approvedAgents: 892,
    totalReferrals: 3456,
    completedReferrals: 2891,
    totalDataOrders: 1823,
    completedDataOrders: 1654,
    totalWithdrawals: 567,
    pendingWithdrawals: 23,
    totalJobs: 234,
    activeJobs: 156,
    revenue: 45200,
    todayOrders: 892,
    pendingAlerts: 3,
    wholesaleProducts: 0,
    activeWholesaleProducts: 0,
    wholesaleOrders: 0,
    completedWholesaleOrders: 0,
    pendingWholesaleOrders: 0,
    wholesaleRevenue: 0,
    newAgents: 0,
    pendingDataOrders: 0,
    pendingBulkOrders: 0,
    pendingAFA: 0,
    pendingCompliance: 0,
    pendingProperties: 0,
    pendingReferrals: 0,
    pendingPayouts: 0,
    pendingDomesticWorkerRequests: 0,
    pendingWalletTopups: 0,
    pendingProfessionalWriting: 0,
    pendingInvitations: 0,
    pendingDomesticWorkers: 0,
    totalPendingAlerts: 0,
    pendingOnlineCourses: 0,
    pendingStorefrontOrders: 0,
    newGroceryRequests: 0,
  })
  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const {
    unreadCount: adminUnreadCount,
    getUnreadCount: adminGetUnreadCount,
    markAsRead: adminMarkAsRead,
  } = useUnreadMessages(admin?.id || "", "admin")

  // Initialize tabs on component mount
  useEffect(() => {
    setVisibleTabs(TAB_CONFIG)
    setIsTabsLoaded(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab && TAB_CONFIG.some((t) => t.id === tab)) {
      loadTab(tab)
    }
  }, [loadTab])

  // Load stats on component mount
  useEffect(() => {
    let isMounted = true
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]

        const [
          agentsData,
          referralsData,
          ordersData,
          withdrawalsData,
          jobsData,
          dailyOrdersData,
          wholesaleStatsResponse,
          alertsResponse,
          storefrontOrdersResponse,
        ] = await Promise.all([
          supabase.from("agents").select("id, isapproved", { count: "exact" }),
          supabase.from("referrals").select("id, status", { count: "exact" }),
          supabase.from("data_orders").select("id, status", { count: "exact" }),
          supabase.from("withdrawals").select("id, status", { count: "exact" }),
          fetch("/api/jobs/stats").then((r) => (r.ok ? r.json() : { total: 0, active: 0 })),
          supabase
            .from("data_orders")
            .select("id")
            .gte("created_at", `${today}T00:00:00.000Z`)
            .lt("created_at", `${today}T23:59:59.999Z`),
          fetch("/api/admin/wholesale/stats", { headers: getAdminAuthHeaders() }).catch(() => ({ ok: false })),
          fetch("/api/admin/dashboard/pending-alerts", { headers: getAdminAuthHeaders() }).catch(() => ({ ok: false })),
          fetch("/api/admin/storefront-orders?page=1&limit=1", { headers: getAdminAuthHeaders() }).catch(() => ({ ok: false })),
        ])

        let wholesaleStats = {
          totalProducts: 0,
          activeProducts: 0,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
        }

        if (wholesaleStatsResponse.ok && wholesaleStatsResponse instanceof Response) {
          try {
            wholesaleStats = await wholesaleStatsResponse.json()
          } catch (error) {
            console.error("Error parsing wholesale stats:", error)
          }
        }

        let alertsData = {
          newAgents: 0,
          pendingDataOrders: 0,
          pendingBulkOrders: 0,
          pendingAFA: 0,
          pendingCompliance: 0,
          pendingProperties: 0,
          pendingReferrals: 0,
          pendingPayouts: 0,
          pendingDomesticWorkerRequests: 0,
          pendingWalletTopups: 0,
          pendingProfessionalWriting: 0,
          pendingInvitations: 0,
          pendingDomesticWorkers: 0,
          totalAlerts: 0,
          pendingOnlineCourses: 0,
        }

        if (alertsResponse.ok && alertsResponse instanceof Response) {
          try {
            const parsedAlerts = await alertsResponse.json()
            if (parsedAlerts && typeof parsedAlerts === 'object') {
              alertsData = { ...alertsData, ...parsedAlerts }
            }
          } catch (error) {
            console.error("[v0] Error parsing alerts data:", error)
          }
        }

        let pendingStorefrontOrders = 0
        if (storefrontOrdersResponse.ok && storefrontOrdersResponse instanceof Response) {
          try {
            const storefrontData = await storefrontOrdersResponse.json()
            pendingStorefrontOrders = Number(storefrontData.pendingCount ?? 0)
          } catch (error) {
            console.error("Error parsing storefront orders stats:", error)
          }
        }

        if (isMounted) {
          setStats((prev) => ({
            ...prev,
            totalAgents: agentsData.count || 0,
            approvedAgents: agentsData.data?.filter((a) => a.isapproved).length || 0,
            totalReferrals: referralsData.count || 0,
            completedReferrals: referralsData.data?.filter((r) => r.status === "completed").length || 0,
            totalDataOrders: ordersData.count || 0,
            completedDataOrders: ordersData.data?.filter((o) => o.status === "completed").length || 0,
            totalWithdrawals: withdrawalsData.count || 0,
            pendingWithdrawals: withdrawalsData.data?.filter((w) => w.status === "pending" || w.status === "requested").length || 0,
            totalJobs: jobsData.total || 0,
            activeJobs: jobsData.active || 0,
            todayOrders: dailyOrdersData.data?.length || 0,
            pendingAlerts: withdrawalsData.data?.filter((w) => w.status === "pending" || w.status === "requested").length || 0,
            wholesaleProducts: wholesaleStats.totalProducts || 0,
            activeWholesaleProducts: wholesaleStats.activeProducts || 0,
            wholesaleOrders: wholesaleStats.totalOrders || 0,
            completedWholesaleOrders: wholesaleStats.completedOrders || 0,
            pendingWholesaleOrders: wholesaleStats.pendingOrders || 0,
            wholesaleRevenue: wholesaleStats.totalRevenue || 0,
            newAgents: alertsData.newAgents || 0,
            pendingDataOrders: alertsData.pendingDataOrders || 0,
            pendingBulkOrders: alertsData.pendingBulkOrders || 0,
            pendingAFA: alertsData.pendingAFA || 0,
            pendingCompliance: alertsData.pendingCompliance || 0,
            pendingProperties: alertsData.pendingProperties || 0,
            pendingReferrals: alertsData.pendingReferrals || 0,
            pendingPayouts: alertsData.pendingPayouts || 0,
            pendingDomesticWorkerRequests: alertsData.pendingDomesticWorkerRequests || 0,
            pendingWalletTopups: alertsData.pendingWalletTopups || 0,
            pendingProfessionalWriting: alertsData.pendingProfessionalWriting || 0,
            pendingInvitations: alertsData.pendingInvitations || 0,
            pendingDomesticWorkers: alertsData.pendingDomesticWorkers || 0,
            totalPendingAlerts: alertsData.totalAlerts || 0,
            pendingOnlineCourses: alertsData.pendingOnlineCourses || 0,
            pendingStorefrontOrders,
          }))
        }
      } catch (error) {
        console.error("Error loading stats:", error)
      }
    }

    loadStats()
    const loadGroceryCount = async () => {
      try {
        const res = await fetch("/api/admin/grocery/requests/count", {
          headers: getAdminAuthHeaders(),
          cache: "no-store",
        })
        const data = await res.json()
        if (res.ok && data.success && isMounted) {
          setStats((prev) => ({ ...prev, newGroceryRequests: Number(data.count) || 0 }))
        }
      } catch {
        /* ignore */
      }
    }

    loadGroceryCount()
    const storefrontPoll = setInterval(() => {
      loadStats()
      loadGroceryCount()
    }, 30000)

    const connectionUnsubscribe = connectionManager.addConnectionListener(() => {
      setConnectionHealth(connectionManager.getHealthStatus())
    })

    return () => {
      isMounted = false
      clearInterval(storefrontPoll)
      connectionUnsubscribe()
    }
  }, [])

  useEffect(() => {
    const onStorefrontPending = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail
      if (typeof detail === "number") {
        setStats((prev) => ({ ...prev, pendingStorefrontOrders: detail }))
      }
    }
    const onGroceryUpdated = () => {
      fetch("/api/admin/grocery/requests/count", { headers: getAdminAuthHeaders(), cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setStats((prev) => ({ ...prev, newGroceryRequests: Number(data.count) || 0 }))
          }
        })
        .catch(() => {})
    }
    window.addEventListener("admin-storefront-pending", onStorefrontPending)
    window.addEventListener("grocery-requests-updated", onGroceryUpdated)
    return () => {
      window.removeEventListener("admin-storefront-pending", onStorefrontPending)
      window.removeEventListener("grocery-requests-updated", onGroceryUpdated)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logoutAdmin()
      clearAdminSession()
      await supabase.auth.signOut()
      window.location.href = "/admin/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/admin/login"
    }
  }

  const handleTabChange = (tabId: string) => {
    loadTab(tabId)
  }

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return
    }
    if (!admin) {
      toast.error("Admin user not found")
      return
    }
    setUpdatingPassword(true)
    try {
      // Call the API to update the admin password
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          admin_id: admin.id,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || "Failed to update password")
      }

      const data = await response.json()
      
      // Update localStorage with the new admin data
      localStorage.setItem("admin", JSON.stringify(data.admin))
      setAdmin(data.admin)

      toast.success("Password updated successfully")
      setSettingsOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Password update error:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while updating password"
      toast.error(errorMessage)
    } finally {
      setUpdatingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  if (!isTabsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-blue-600 font-medium">Loading your portal...</p>
        </div>
      </div>
    )
  }

  const getTabAlertCount = (tabId: string): number => {
    switch (tabId) {
      case "agents":
        return stats.newAgents
      case "orders":
        return stats.pendingDataOrders
      case "bulk-orders":
        return stats.pendingBulkOrders + stats.pendingAFA
      case "compliance":
        return stats.pendingCompliance
      case "properties":
        return stats.pendingProperties
      case "referrals":
        return stats.pendingReferrals
      case "payouts":
        return stats.pendingPayouts
      case "domestic-worker-requests":
        return stats.pendingDomesticWorkerRequests
      case "wallets":
        return stats.pendingWalletTopups
      case "professional-writing":
        return stats.pendingProfessionalWriting
      case "invitation-management":
        return stats.pendingInvitations
      case "domestic-workers":
        return stats.pendingDomesticWorkers
      case "online-courses":
        return stats.pendingOnlineCourses
      case "storefront-manager":
        return stats.pendingStorefrontOrders
      case "grocery-requests":
        return stats.newGroceryRequests
      default:
        return 0
    }
  }

  const headerIconBtnClass =
    "h-9 w-9 shrink-0 border border-white/25 bg-white/15 p-0 text-white shadow-none hover:bg-white/25 hover:text-white sm:h-9 sm:w-auto sm:px-2.5"

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <AdminHeader
        displayName={admin?.full_name}
        adminEmail={admin?.email}
        connectionIndicator={
          <AdminConnectionStatus
            variant="session"
            status={connectionHealth.overall === "healthy" ? "healthy" : "issues"}
          />
        }
        onLogout={handleLogout}
        trailingActions={
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={headerIconBtnClass}
                title="Settings"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="sr-only sm:not-sr-only sm:ml-1.5 sm:inline">Settings</span>
              </Button>
            </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Admin Settings</DialogTitle>
                    <DialogDescription>Update your admin account settings and password.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="current-password" className="text-right">
                        Current Password
                      </Label>
                      <div className="col-span-3 relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        New Password
                      </Label>
                      <div className="col-span-3 relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirm-password" className="text-right">
                        Confirm Password
                      </Label>
                      <div className="col-span-3 relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSettingsOpen(false)
                        resetPasswordForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handlePasswordUpdate} disabled={updatingPassword}>
                      {updatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        }
      />
      <div className="container mx-auto max-w-full px-3 py-6 sm:px-4 sm:py-8">
        {showNotification && (
          <UnreadNotification
            unreadCount={adminUnreadCount}
            userType="admin"
            onDismiss={() => setShowNotification(false)}
          />
        )}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="space-y-2">
          {(() => {
            const tabRowSplit = Math.ceil(visibleTabs.length / 2)
            const adminTabRows = [
              visibleTabs.slice(0, tabRowSplit),
              visibleTabs.slice(tabRowSplit),
            ]
            return adminTabRows.map((rowTabs, rowIndex) => (
              <div key={rowIndex} className="w-full overflow-x-auto scroll-smooth">
                <TabsList className="inline-flex w-max min-w-full flex-nowrap gap-1 bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 p-1 rounded-xl">
                  {rowTabs.map(({ id, label, icon: Icon }) => {
                    const alertCount = getTabAlertCount(id)
                    return (
                      <TabsTrigger
                        key={id}
                        value={id}
                        className="flex items-center justify-center px-3 py-2 min-w-[100px] flex-shrink-0 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap relative"
                        onClick={() => loadTab(id)}
                      >
                        <Icon className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">{label}</span>
                        {(alertCount > 0 || (id === "referrals" && adminUnreadCount > 0)) && (
                          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0 animate-pulse">
                            {Math.max(alertCount, adminUnreadCount) > 9 ? "9+" : Math.max(alertCount, adminUnreadCount)}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
            ))
          })()}
          </div>
          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <PendingOrdersFeed onNavigateTab={loadTab} />
            <FollowUpsTodayCard />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalAgents.toLocaleString()}</div>
                  <p className="text-xs text-blue-100 mt-1">{stats.approvedAgents.toLocaleString()} approved</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Daily Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.todayOrders.toLocaleString()}</div>
                  <p className="text-xs text-green-100 mt-1">Today's data orders</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Withdrawals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalWithdrawals.toLocaleString()}</div>
                  <p className="text-xs text-purple-100 mt-1">{stats.pendingWithdrawals.toLocaleString()} pending</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.pendingAlerts}</div>
                  <p className="text-xs text-orange-100 mt-1">Pending withdrawals</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-emerald-200">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">Total</p>
                        <p className="text-2xl font-bold text-emerald-800">{stats.totalReferrals.toLocaleString()}</p>
                      </div>
                      <Package className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="pt-2 border-t border-emerald-100 flex justify-between text-xs">
                      <span className="text-emerald-600">Completed: {stats.completedReferrals.toLocaleString()}</span>
                      <span className="text-yellow-600">
                        Pending: {stats.totalReferrals - stats.completedReferrals}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalReferrals.toLocaleString()}</div>
                  <p className="text-blue-500 text-sm">{stats.completedReferrals.toLocaleString()} completed</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  >
                    <Link href="/admin/agents">
                      <Users className="h-4 w-4 mr-1" />
                      Manage Agents
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Link href="/admin/agent-performance">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Performance
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">Connection</span>
                    {getSessionStatusIndicator()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">Database</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">Services</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Running</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Automation Tab Content */}
          <TabsContent value="automation" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-800">Automation Dashboard</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              <p className="text-blue-600 mb-4">Monitor and configure automated processes.</p>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Link href="/admin/agents/admin-agents-switch-button">
                  <Activity className="h-4 w-4 mr-2" />
                  View Automation
                </Link>
              </Button>
            </div>
          </TabsContent>
          {/* Performance Tab Content */}
          <TabsContent value="performance" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-800">Performance Analytics</h2>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  Updated
                </Badge>
              </div>
              <p className="text-blue-600 mb-4">View detailed performance metrics and analytics.</p>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Link href="/admin/agent-performance">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Performance
                </Link>
              </Button>
            </div>
          </TabsContent>
          {/* Settings Tab Content */}
          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">System Settings</h2>
              <p className="text-blue-600 mb-4">Configure system settings and preferences.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">Admin Account</span>
                  <span className="text-blue-600 text-sm">{admin?.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">Session Status</span>
                  {getSessionStatusIndicator()}
                </div>
                <Button
                  onClick={() => setSettingsOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Change Password
                </Button>
              </div>
            </div>
          </TabsContent>
          {/* Maintenance Tab Content */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-800">Maintenance Mode Management</h2>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  System Control
                </Badge>
              </div>
              <p className="text-blue-600 mb-4">
                Control site-wide maintenance mode and manage user access during system updates.
              </p>
              <div className="space-y-4">
                {loadedTabs.has("maintenance") && (
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <MaintenancePanelTab />
                  </Suspense>
                )}
                <p className="text-sm text-center pt-2">
                  <Link href="/admin/maintenance" className="text-blue-600 underline">
                    Full-screen maintenance page
                  </Link>
                </p>
                <div className="hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Quick Actions</h3>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Enable/Disable maintenance mode</li>
                      <li>• Set custom maintenance messages</li>
                      <li>• Configure allowed IP addresses</li>
                      <li>• Schedule maintenance windows</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h3 className="font-semibold text-amber-800 mb-2">System Status</h3>
                    <div className="text-sm text-amber-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Maintenance Mode:</span>
                        <span className="font-medium">Disabled</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="font-medium">Never</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Sessions:</span>
                        <span className="font-medium">All Users</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          {/* Dynamic Tab Content for Components */}
          {visibleTabs
            .filter((tab) => tab.component !== null)
            .map(({ id, label, component: Component }) => {
              return (
                <TabsContent key={id} value={id} className="space-y-4">
                  {loadedTabs.has(id) ? (
                    <Suspense fallback={<TabLoadingSkeleton />}>
                      {id === "bulk-orders" ||
                      id === "agent-calls" ||
                      id === "listing-packages" ||
                      id === "photo-verification" ||
                      id === "voice-rooms" ? (
                        React.createElement(Component as React.ComponentType<any>)
                      ) : (
                        React.createElement(Component as React.ComponentType<any>, {
                          adminUnreadCount,
                          adminGetUnreadCount,
                          adminMarkAsRead,
                        })
                      )}
                    </Suspense>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">
                          <Package className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-gray-600 font-medium">Click this tab to load {label.toLowerCase()} data</p>
                        <p className="text-gray-500 text-sm mt-1">Data will be loaded on demand for better performance</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )
            })}
        </Tabs>
      </div>
      <BackToTop />
    </div>
  )
}
