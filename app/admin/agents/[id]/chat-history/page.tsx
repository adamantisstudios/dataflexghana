"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Agent, type Referral, type ProjectChat } from "@/lib/supabase"
import {
  ArrowLeft,
  MessageCircle,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  ExternalLink,
  ImageIcon,
  Search,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface ReferralWithChats extends Referral {
  services?: {
    title: string
    commission_amount: number
  }
  project_chats?: ProjectChat[]
  chat_count?: number
  last_message_at?: string
}

const ITEMS_PER_PAGE = 10

export default function AdminAgentChatHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [referrals, setReferrals] = useState<ReferralWithChats[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralWithChats[]>([])
  const [paginatedReferrals, setPaginatedReferrals] = useState<ReferralWithChats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (agentId) {
      loadAgentAndChatHistory()
    }
  }, [agentId])

  useEffect(() => {
    filterReferrals()
  }, [referrals, searchTerm, statusFilter])

  useEffect(() => {
    paginateReferrals()
  }, [filteredReferrals, currentPage])

  const loadAgentAndChatHistory = async () => {
    try {
      setLoading(true)
      
      // Load agent details
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single()

      if (agentError) throw agentError
      setAgent(agentData)

      // Load agent's referrals with chat data
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          *,
          services (title, commission_amount),
          project_chats (id, timestamp, sender_type, message_type, message_content)
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      if (referralsError) throw referralsError

      // Process referrals to add chat statistics
      const processedReferrals = (referralsData || []).map((referral) => {
        const chats = referral.project_chats || []
        const lastMessage = chats.length > 0 ? chats[chats.length - 1] : null
        
        return {
          ...referral,
          chat_count: chats.length,
          last_message_at: lastMessage?.timestamp || null,
        }
      })

      setReferrals(processedReferrals)
    } catch (error) {
      console.error("Error loading agent and chat history:", error)
      toast.error("Failed to load chat history")
      router.push("/admin/agents")
    } finally {
      setLoading(false)
    }
  }

  const filterReferrals = () => {
    let filtered = [...referrals]
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (referral) =>
          referral.client_name.toLowerCase().includes(searchTermLower) ||
          referral.client_phone.includes(searchTerm) ||
          referral.services?.title.toLowerCase().includes(searchTermLower) ||
          referral.description.toLowerCase().includes(searchTermLower),
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((referral) => referral.status === statusFilter)
    }
    setFilteredReferrals(filtered)
    setCurrentPage(1)
  }

  const paginateReferrals = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = filteredReferrals.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    setPaginatedReferrals(paginated)
    setTotalPages(Math.ceil(filteredReferrals.length / ITEMS_PER_PAGE))
  }

  const refreshData = async () => {
    await loadAgentAndChatHistory()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat history...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600 mb-6">The requested agent could not be found.</p>
          <Button asChild>
            <Link href="/admin/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="outline" size="sm" asChild className="w-fit bg-transparent">
              <Link href={`/admin/agents/${agentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agent Details
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chat History</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Project conversations for {agent.full_name} ({agent.phone_number})
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Projects</p>
                <p className="text-xl sm:text-2xl font-bold">{referrals.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Completed</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {referrals.filter((referral) => referral.status === "completed").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-amber-100 text-xs sm:text-sm font-medium">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {referrals.filter((referral) => referral.status === "in_progress").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Total Messages</p>
                <p className="text-lg sm:text-xl font-bold">
                  {referrals.reduce((sum, referral) => sum + (referral.chat_count || 0), 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="border-blue-200 bg-white shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Project Conversations ({filteredReferrals.length} total)
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Showing {paginatedReferrals.length} of {filteredReferrals.length} projects
                  {(statusFilter !== "all" || searchTerm) && (
                    <span className="ml-2 text-blue-600 font-medium">• Filtered results</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={refreshData}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Projects List */}
        <div className="space-y-4">
          {paginatedReferrals.length === 0 ? (
            <Card className="border-blue-200 bg-white shadow-lg">
              <CardContent className="text-center py-12">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">No Projects Found</h3>
                <p className="text-blue-600 mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "No projects match your current filters."
                    : "This agent hasn't worked on any projects yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedReferrals.map((referral) => {
                const createdTimestamp = formatTimestamp(referral.created_at)
                const lastMessageTimestamp = referral.last_message_at ? formatTimestamp(referral.last_message_at) : null
                
                return (
                  <Card
                    key={referral.id}
                    className="border-blue-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-blue-800 text-xl mb-1">
                                  {referral.services?.title || "Unknown Service"}
                                </h3>
                                <p className="text-blue-600 font-medium mb-2">
                                  Client: {referral.client_name} • {referral.client_phone}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>Created: {createdTimestamp.date} at {createdTimestamp.time}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">{referral.description}</p>
                          </div>
                          <div className="flex flex-col items-start lg:items-end gap-3">
                            <Badge
                              className={`${getStatusColor(referral.status)} text-sm px-3 py-1`}
                            >
                              {referral.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            {referral.services?.commission_amount && (
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                                GH₵ {referral.services.commission_amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Messages
                            </p>
                            <p className="text-sm text-blue-800 font-bold flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {referral.chat_count || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Last Activity
                            </p>
                            <p className="text-sm text-blue-800 font-bold">
                              {lastMessageTimestamp 
                                ? `${lastMessageTimestamp.date}`
                                : "No messages"
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Status
                            </p>
                            <p className="text-sm text-blue-800 font-bold capitalize">
                              {referral.status.replace("_", " ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Link href={`/admin/chat/${referral.id}`}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              View Chat
                              <ExternalLink className="h-3 w-3 ml-2" />
                            </Link>
                          </Button>
                          {(referral.chat_count || 0) > 0 && (
                            <Badge variant="secondary" className="px-3 py-1 text-xs">
                              {referral.chat_count} message{(referral.chat_count || 0) !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {totalPages > 1 && (
                <Card className="border-blue-200 bg-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-blue-600">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredReferrals.length)} of {filteredReferrals.length}{" "}
                        projects
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              onClick={() => goToPage(page)}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className={
                                currentPage === page
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "border-blue-200 text-blue-700 hover:bg-blue-50"
                              }
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
