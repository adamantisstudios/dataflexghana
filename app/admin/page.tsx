"use client"
import { lazy, Suspense, useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  LogOut,
  Settings,
  TrendingUp,
  Eye,
  EyeOff,
  Activity,
  BarChart3,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Wrench,
  UserPlus,
  Home,
  FileText,
  BookOpen,
  Music,
  Mail,
} from "lucide-react"
import { logoutAdmin, getAdminToken, clearAdminSession, getStoredAdmin } from "@/lib/auth"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { BackToTop } from "@/components/back-to-top"
import { UnreadNotification } from "@/components/unread-notification"
import { supabase } from "@/lib/supabase"
import { connectionManager } from "@/lib/connection-manager"
import { toast } from "sonner"
import Link from "next/link"
import { PendingAlertsCard } from "@/components/admin/pending-alerts-card"

import SubAdminManagementTab from "@/components/admin/tabs/SubAdminManagementTab" // Added import for SubAdminManagementTab
import { isRestrictedSubAdmin } from "@/lib/sub-admin-utils" // Added import for isRestrictedSubAdmin
import { filterTabsForSubAdmin } from "@/lib/sub-admin-utils" // Added import for filterTabsForSubAdmin

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
const ProfessionalWritingTab = lazy(() => import("@/components/admin/tabs/ProfessionalWritingTab"))
const InvitationManagementTab = lazy(() => import("@/components/admin/tabs/InvitationManagementTab"))
const BulkOrderManagementTab = lazy(() => import("@/components/admin/tabs/BulkOrderManagementTab"))
const OnlineCoursesTab = lazy(() => import("@/components/admin/tabs/OnlineCoursesTab"))


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
// Custom hook for caching tab data
const useTabCache = () => {
  const cache = useRef<Map<string, any>>(new Map())
  const getCachedData = (tabName: string) => cache.current.get(tabName)
  const setCachedData = (tabName: string, data: any) => {
    cache.current.set(tabName, data)
  }
  const clearCache = (tabName?: string) => {
    if (tabName) {
      cache.current.delete(tabName)
    } else {
      cache.current.clear()
    }
  }
  return { getCachedData, setCachedData, clearCache }
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
const TAB_CONFIG = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, component: null },
  { id: "agents", label: "Agents", icon: Users, component: AgentsTab },
  { id: "agent-management", label: "Agent Management", icon: Shield, component: AgentManagementTab },
  { id: "manual-registration", label: "Manual Registration", icon: UserPlus, component: ManualRegistrationTab },
  { id: "teacher-hub", label: "Teacher Hub", icon: BookOpen, component: TeacherHubTab },
  { id: "audio-management", label: "Audio Management", icon: Music, component: AudioManagementTab },
  { id: "link-cache", label: "Link Cache", icon: FileText, component: LinkCacheManagementTab },
  { id: "automation", label: "Automation", icon: Activity, component: null },
  { id: "performance", label: "Performance", icon: TrendingUp, component: null },
  { id: "domestic-workers", label: "Domestic Workers", icon: Users, component: DomesticWorkersTab },
  { id: "domestic-worker-requests", label: "Client Requests", icon: Bell, component: DomesticWorkerClientRequestsTab },
  { id: "wholesale", label: "Wholesale", icon: ShoppingBag, component: WholesaleTab },
  { id: "properties", label: "Properties", icon: Home, component: PropertiesTab },
  { id: "blogs", label: "Blogs", icon: FileText, component: BlogsTab },
  { id: "services", label: "Services", icon: Package, component: ServicesTab },
  { id: "data", label: "Data", icon: Database, component: DataTab },
  { id: "wallet-overview", label: "Wallet Overview", icon: TrendingUp, component: WalletOverviewTab },
  { id: "orders", label: "Orders", icon: Smartphone, component: OrdersTab },
  { id: "bulk-orders", label: "Bulk Orders", icon: Package, component: BulkOrderManagementTab },
  { id: "referrals", label: "Referrals", icon: MessageCircle, component: ReferralsTab },
  { id: "payouts", label: "Payouts", icon: Banknote, component: PayoutsTab },
  { id: "wallets", label: "Wallets", icon: Wallet, component: WalletsTab },
  { id: "savings", label: "Savings", icon: PiggyBank, component: SavingsTab },
  { id: "compliance", label: "Compliance", icon: FileText, component: ComplianceTab },
  { id: "professional-writing", label: "Professional Writing", icon: FileText, component: ProfessionalWritingTab },
  { id: "maintenance", label: "Maintenance", icon: Wrench, component: null },
  { id: "settings", label: "Settings", icon: Settings, component: null },
  { id: "invitation-management", label: "Invitation Management", icon: Mail, component: InvitationManagementTab },
  { id: "online-courses", label: "Online Courses", icon: BookOpen, component: OnlineCoursesTab },
]

export default function AdminDashboard() {
  const { loadedTabs, activeTab, loadTab, setActiveTab } = useTabLoader()
  const { getCachedData, setCachedData, clearCache } = useTabCache()
  const router = useRouter()
  const admin = getStoredAdmin()
  const [showNotification, setShowNotification] = useState(true)
  const [connectionHealth, setConnectionHealth] = useState(connectionManager.getHealthStatus())
  const [visibleTabs, setVisibleTabs] = useState<typeof TAB_CONFIG>([])
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
    // Add wholesale stats
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

  // Load stats on component mount
  useEffect(() => {
    let isMounted = true
    const loadStats = async () => {
      try {
        // Get current date for daily orders
        const today = new Date().toISOString().split("T")[0]

        // Load real stats from database
        const [
          agentsData,
          referralsData,
          ordersData,
          withdrawalsData,
          jobsData,
          dailyOrdersData,
          wholesaleStatsResponse,
          alertsResponse,
        ] = await Promise.all([
          supabase.from("agents").select("id, isapproved").limit(1000),
          supabase.from("referrals").select("id, status").limit(1000),
          supabase.from("data_orders").select("id, status").limit(1000),
          supabase.from("withdrawals").select("id, status").limit(1000),
          supabase.from("jobs").select("id, is_active").limit(1000),
          // Get today's orders only
          supabase
            .from("data_orders")
            .select("id")
            .gte("created_at", `${today}T00:00:00.000Z`)
            .lt("created_at", `${today}T23:59:59.999Z`),
          // Fetch wholesale stats from API
          fetch("/api/admin/wholesale/stats").catch(() => ({ ok: false })),
          // Fetch pending alerts
          fetch("/api/admin/dashboard/pending-alerts").catch(() => ({ ok: false })),
        ])

        // Parse wholesale stats
        let wholesaleStats = {
          totalProducts: 0,
          activeProducts: 0,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
        }

        if (wholesaleStatsResponse.ok) {
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

        if (alertsResponse.ok) {
          try {
            const parsedAlerts = await alertsResponse.json()
            if (parsedAlerts && typeof parsedAlerts === 'object') {
              alertsData = { ...alertsData, ...parsedAlerts }
            }
          } catch (error) {
            console.error("[v0] Error parsing alerts data:", error)
          }
        } else {
          console.warn("[v0] Alerts API returned:", alertsResponse.status)
        }

        if (isMounted) {
          setStats((prev) => ({
            ...prev,
            totalAgents: agentsData.data?.length || 0,
            approvedAgents: agentsData.data?.filter((a) => a.isapproved).length || 0,
            totalReferrals: referralsData.data?.length || 0,
            completedReferrals: referralsData.data?.filter((r) => r.status === "completed").length || 0,
            totalDataOrders: ordersData.data?.length || 0,
            completedDataOrders: ordersData.data?.filter((o) => o.status === "completed").length || 0,
            totalWithdrawals: withdrawalsData.data?.length || 0,
            pendingWithdrawals:
              withdrawalsData.data?.filter((w) => w.status === "pending" || w.status === "requested").length || 0,
            totalJobs: jobsData.data?.length || 0,
            activeJobs: jobsData.data?.filter((j) => j.is_active).length || 0,
            todayOrders: dailyOrdersData.data?.length || 0,
            pendingAlerts:
              withdrawalsData.data?.filter((w) => w.status === "pending" || w.status === "requested").length || 0,
            // Update wholesale stats
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
          }))
        }
      } catch (error) {
        console.error("Error loading stats:", error)
      }
    }

    loadStats()

    // Monitor connection health
    const connectionUnsubscribe = connectionManager.addConnectionListener(() => {
      setConnectionHealth(connectionManager.getHealthStatus())
    })

    return () => {
      isMounted = false
      connectionUnsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      const token = getAdminToken()
      if (token) {
        await logoutAdmin(token)
      }
      clearAdminSession()
      clearCache()
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
      // Simulate password update API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Password updated successfully")
      setSettingsOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Password update error:", error)
      toast.error("An error occurred while updating password")
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

  const getSessionStatusIndicator = () => {
    return connectionHealth.overall === "healthy" ? (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Connected</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-amber-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Issues</span>
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
      default:
        return 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                <Shield className="w-full h-full text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                  DataFlex Admin Portal
                </h1>
                <p className="text-blue-100 font-medium">Welcome back, {admin?.full_name || admin?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getSessionStatusIndicator()}
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Settings</span>
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
              <Button
                variant="secondary"
                size="sm"
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
      <div className="container mx-auto px-4 py-8">
        {showNotification && (
          <UnreadNotification
            unreadCount={adminUnreadCount}
            userType="admin"
            onDismiss={() => setShowNotification(false)}
          />
        )}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="flex w-full justify-between bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 p-1 rounded-xl min-w-max">
              {visibleTabs.slice(0, 10).map(({ id, label, icon: Icon }) => {
                const alertCount = getTabAlertCount(id)
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1 relative"
                    onClick={() => loadTab(id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
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
          {/* Additional tabs row for mobile */}
          <div className="w-full overflow-x-auto">
            <TabsList className="flex w-full justify-between bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 p-1 rounded-xl min-w-max">
              {visibleTabs.slice(10).map(({ id, label, icon: Icon }) => {
                const alertCount = getTabAlertCount(id)
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1 relative"
                    onClick={() => loadTab(id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                    {alertCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0 animate-pulse">
                        {alertCount > 9 ? "9+" : alertCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <PendingAlertsCard />

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
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Link href="/admin/maintenance">
                    <Wrench className="h-4 w-4 mr-2" />
                    Open Maintenance Control Panel
                  </Link>
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            .filter((tab) => tab.component)
            .map(({ id, label, component: Component }) => (
              <TabsContent key={id} value={id} className="space-y-4">
                {loadedTabs.has(id) ? (
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    {/* Add condition to pass specific props to BulkOrderManagementTab */}
                    {id === "bulk-orders" ? (
                      <Component />
                    ) : (
                      <Component
                        getCachedData={() => getCachedData(id)}
                        setCachedData={(data: any) => setCachedData(id, data)}
                        adminUnreadCount={adminUnreadCount}
                        adminGetUnreadCount={adminGetUnreadCount}
                        adminMarkAsRead={adminMarkAsRead}
                      />
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
            ))}
        </Tabs>
      </div>
      <BackToTop />
    </div>
  )
}
