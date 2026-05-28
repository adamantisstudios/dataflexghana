"use client"
import { useState, useEffect, useRef } from "react"
import { BookOpen, CheckCircle2, Trash2, Plus, Eye, UserPlus, Edit2, ImageIcon, MoreVertical, X, RefreshCw, GraduationCap, CreditCard, Video } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client";
import { getAdminAuthHeaders } from "@/lib/api-client"
import { parseJsonResponse } from "@/lib/agent-auth-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
  import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Types
type TeachingChannel = {
  id: string
  name: string
  description: string
  category: string
  created_by: string
  is_active: boolean
  is_public: boolean
  max_members: number
  image_url?: string
  created_at: string
  member_count?: number
}
type TeacherApproval = {
  id: string
  agent_id: string
  status: "pending" | "approved" | "rejected"
  qualifications: string
  experience_years: number
  bio: string
  expertise_areas: string[]
  approved_by?: string
  approval_notes?: string
  approved_at?: string
  created_at: string
  agent_name?: string
  agent_contact?: string
}
type Agent = {
  id: string
  full_name: string
  phone_number: string
  can_teach?: boolean
}
type ChannelMember = {
  id: string
  agent_id: string
  agent_name: string
  phone_number?: string
  role: "admin" | "teacher" | "member"
  status: "active" | "suspended" | "left"
  joined_at: string
}
type TeacherHubTabProps = {
  getCachedData: () => any
  setCachedData: (data: any) => void
}

export default function TeacherHubTab({ getCachedData, setCachedData }: TeacherHubTabProps) {
  // State
  const [activeSubTab, setActiveSubTab] = useState<
    "channels" | "join-requests" | "teachers" | "verifications" | "embed-videos"
  >("channels")
  const [channels, setChannels] = useState<TeachingChannel[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [paidChannelIds, setPaidChannelIds] = useState<Set<string>>(new Set())
  const [expiryRunning, setExpiryRunning] = useState(false)
  const [embedVideos, setEmbedVideos] = useState<any[]>([])
  const [embedChannelId, setEmbedChannelId] = useState("")
  const [embedForm, setEmbedForm] = useState({ title: "", embedCode: "" })
  const [embedLoading, setEmbedLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showChannelDialog, setShowChannelDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [showChannelDetailsDialog, setShowChannelDetailsDialog] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<TeachingChannel | null>(null)
  const [selectedChannelMembers, setSelectedChannelMembers] = useState<ChannelMember[]>([])
  const [selectedAgentForAdd, setSelectedAgentForAdd] = useState("")
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<"member" | "teacher" | "admin">("member")
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [channelForm, setChannelForm] = useState({
    name: "",
    description: "",
    category: "General",
    is_public: false,
    max_members: 50,
    image_url: "",
  })
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [editingChannelName, setEditingChannelName] = useState("")
  const [editingChannelForm, setEditingChannelForm] = useState({
    description: "",
    category: "",
    is_public: false,
    max_members: 50,
    image_url: "",
  })
  const [showEditChannelDialog, setShowEditChannelDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const itemsPerPage = 10
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Load Data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [channelsRes, agentsRes, joinRequestsRes, verificationsRes] = await Promise.all([
        supabase.from("teaching_channels").select("*").order("created_at", { ascending: false }),
        supabase
          .from("agents")
          .select("id, full_name, phone_number, can_teach")
          .eq("isapproved", true),
        supabase
          .from("channel_join_requests_with_agents")
          .select(
            "id, channel_id, agent_id, request_message, status, requested_at, full_name, phone_number, teaching_channels(name)",
          )
          .eq("status", "pending")
          .order("requested_at", { ascending: false }),
        fetch("/api/admin/subscriptions/pending-verifications", {
          headers: getAdminAuthHeaders(),
          cache: "no-store",
        }),
      ])
      const { data: memberCounts } = await supabase.from("channel_members").select("channel_id")
      const countMap = new Map()
      memberCounts?.forEach((m) => countMap.set(m.channel_id, (countMap.get(m.channel_id) || 0) + 1))
      const channelsWithCounts = (channelsRes.data || []).map((channel) => ({
        ...channel,
        member_count: countMap.get(channel.id) || 0,
      }))

      setChannels(channelsWithCounts)
      setAgents(agentsRes.data || [])
      setJoinRequests(joinRequestsRes.data || [])

      if (verificationsRes.ok) {
        const verificationsData = await verificationsRes.json()
        setPendingVerifications(verificationsData.verifications || [])
        setPaidChannelIds(new Set(verificationsData.paidChannelIds || []))
      } else {
        setPendingVerifications([])
      }
    } catch (error) {
      toast.error("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Image Upload
  const handleImageUpload = async (file: File, isEditing = false) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        headers: {
          "x-agent-id": "admin",
          "x-agent-phone": "admin",
        },
      })
      if (!response.ok) throw new Error("Failed to upload image.")
      const data = await response.json()
      if (isEditing) {
        setEditingChannelForm({ ...editingChannelForm, image_url: data.url })
      } else {
        setChannelForm({ ...channelForm, image_url: data.url })
      }
      toast.success("Image uploaded successfully!")
    } catch (error) {
      toast.error("Failed to upload image.")
    } finally {
      setUploading(false)
    }
  }

  // Create Channel
  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) {
      toast.error("Channel name is required.")
      return
    }
    try {
      await supabase.from("teaching_channels").insert([
        {
          name: channelForm.name,
          description: channelForm.description,
          category: channelForm.category,
          is_public: channelForm.is_public,
          max_members: channelForm.max_members,
          image_url: channelForm.image_url || null,
          created_by: "admin",
          is_active: true,
        },
      ])
      toast.success("Channel created successfully!")
      setShowChannelDialog(false)
      setChannelForm({
        name: "",
        description: "",
        category: "General",
        is_public: false,
        max_members: 50,
        image_url: "",
      })
      loadData()
    } catch (error) {
      toast.error("Failed to create channel.")
    }
  }

  // Load Channel Members
  const loadChannelMembers = async (channelId: string) => {
    try {
      const { data: members } = await supabase
        .from("channel_members_with_agents")
        .select("id, agent_id, role, status, joined_at, full_name, phone_number")
        .eq("channel_id", channelId)
        .eq("status", "active")
      const mappedMembers = (members || []).map((m: any) => ({
        id: m.id,
        agent_id: m.agent_id,
        agent_name: m.full_name || m.agent_id,
        phone_number: m.phone_number || undefined,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
      }))
      setSelectedChannelMembers(mappedMembers)
    } catch (error) {
      toast.error("Failed to load channel members.")
    }
  }

  // Add Member to Channel
  const handleAddMemberToChannel = async () => {
    if (!selectedChannel || !selectedAgentForAdd) {
      toast.error("Please select an agent.")
      return
    }
    try {
      const { error: insertError } = await supabase.from("channel_members").insert([
        {
          channel_id: selectedChannel.id,
          agent_id: selectedAgentForAdd,
          role: selectedRoleForAdd,
          status: "active",
        },
      ])
      if (insertError) throw insertError
      toast.success(`Member added as ${selectedRoleForAdd}!`)
      setShowAddMemberDialog(false)
      setSelectedAgentForAdd("")
      setSelectedRoleForAdd("member")
      loadData()
      if (selectedChannel) loadChannelMembers(selectedChannel.id)
    } catch (error) {
      toast.error("Failed to add member.")
    }
  }

  // Change Member Role
  const handleChangeMemberRole = async (memberId: string, newRole: "admin" | "teacher" | "member") => {
    try {
      await supabase.from("channel_members").update({ role: newRole }).eq("id", memberId)
      toast.success(`Member role updated to ${newRole}!`)
      if (selectedChannel) loadChannelMembers(selectedChannel.id)
    } catch (error) {
      toast.error("Failed to change member role.")
    }
  }

  // Delete Member from Channel
  const handleDeleteMemberFromChannel = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this channel?`)) return
    try {
      await supabase.from("channel_members").delete().eq("id", memberId)
      toast.success("Member removed!")
      if (selectedChannel) loadChannelMembers(selectedChannel.id)
    } catch (error) {
      toast.error("Failed to remove member.")
    }
  }

  // Edit Channel Name
  const handleEditChannelName = async (channelId: string) => {
    if (!editingChannelName.trim()) {
      toast.error("Channel name cannot be empty.")
      return
    }
    try {
      await supabase.from("teaching_channels").update({ name: editingChannelName }).eq("id", channelId)
      toast.success("Channel name updated!")
      setEditingChannelId(null)
      setEditingChannelName("")
      loadData()
    } catch (error) {
      toast.error("Failed to update channel name.")
    }
  }

  // Update Channel Details
  const handleUpdateChannelDetails = async (channelId: string) => {
    if (!editingChannelForm.description.trim()) {
      toast.error("Description cannot be empty.")
      return
    }
    try {
      await supabase
        .from("teaching_channels")
        .update({
          description: editingChannelForm.description,
          category: editingChannelForm.category,
          is_public: editingChannelForm.is_public,
          max_members: editingChannelForm.max_members,
          image_url: editingChannelForm.image_url || null,
        })
        .eq("id", channelId)
      toast.success("Channel updated!")
      setShowEditChannelDialog(false)
      setEditingChannelId(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update channel.")
    }
  }

  // Approve/Reject Teacher - REMOVED
  // Delete Channel
  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Delete this channel?")) return
    try {
      await supabase.from("teaching_channels").delete().eq("id", channelId)
      toast.success("Channel deleted!")
      loadData()
    } catch (error) {
      toast.error("Failed to delete channel.")
    }
  }

  // Approve/Reject Join Request
  const handleApproveJoinRequest = async (requestId: string, agentId: string, channelId: string) => {
    if (paidChannelIds.has(channelId)) {
      toast.error("Paid channel — verify payment in Pending Verifications first.")
      setActiveSubTab("verifications")
      return
    }
    try {
      const response = await fetch("/api/channel-join-requests/approve", {
        method: "POST",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Approval failed")
      toast.success("Join request approved!")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve request.")
    }
  }

  const handleVerifyJoinPayment = async (item: {
    id: string
    channel_id: string
    agent_id: string
    amount?: number
  }) => {
    try {
      const response = await fetch("/api/subscriptions/verify-and-approve", {
        method: "POST",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          joinRequestId: item.id,
          channelId: item.channel_id,
          agentId: item.agent_id,
          amountVerified: item.amount ?? 0,
          notes: "Initial join payment verified",
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Verification failed")
      toast.success("Payment verified — member added with 30-day subscription!")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify payment")
    }
  }

  const handleVerifyRenewal = async (item: { id: string; channel_id: string; agent_id: string; amount?: number }) => {
    try {
      const response = await fetch("/api/subscriptions/verify-payment", {
        method: "POST",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: item.channel_id,
          agentId: item.agent_id,
          amountVerified: item.amount ?? 0,
          notes: `Renewal request ${item.id}`,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Verification failed")
      await supabase.from("subscription_renewal_requests").update({ payment_status: "verified" }).eq("id", item.id)
      toast.success("Payment verified and subscription renewed!")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify payment")
    }
  }

  const toggleAgentCanTeach = async (agentId: string, canTeach: boolean) => {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/teach-permission`, {
        method: "PUT",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ can_teach: canTeach }),
      })
      if (!response.ok) throw new Error("Update failed")
      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, can_teach: canTeach } : a)))
      toast.success(canTeach ? "Teacher approval granted" : "Teacher approval revoked")
    } catch {
      toast.error("Failed to update teacher permission")
    }
  }

  const loadEmbedVideos = async (channelId: string) => {
    if (!channelId) {
      setEmbedVideos([])
      return
    }
    try {
      setEmbedLoading(true)
      const res = await fetch(`/api/admin/channel-embed-videos?channelId=${encodeURIComponent(channelId)}`, {
        headers: getAdminAuthHeaders(),
      })
      const parsed = await parseJsonResponse<{ videos?: unknown[]; error?: string }>(res)
      const data = parsed.data
      if (res.ok) setEmbedVideos(data.videos || [])
      else toast.error(data.error || "Failed to load embed videos")
    } catch {
      toast.error("Failed to load embed videos")
    } finally {
      setEmbedLoading(false)
    }
  }

  const handleCreateEmbedVideo = async () => {
    if (!embedChannelId || !embedForm.title.trim() || !embedForm.embedCode.trim()) {
      toast.error("Channel, title, and embed code are required")
      return
    }
    try {
      const res = await fetch("/api/admin/channel-embed-videos", {
        method: "POST",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: embedChannelId,
          title: embedForm.title,
          embedCode: embedForm.embedCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create embed video")
      toast.success("Embed video added to channel")
      setEmbedForm({ title: "", embedCode: "" })
      loadEmbedVideos(embedChannelId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create embed video")
    }
  }

  const handleDeleteEmbedVideo = async (id: string) => {
    if (!confirm("Delete this embed video?")) return
    try {
      const res = await fetch(`/api/admin/channel-embed-videos/${id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Embed video deleted")
      loadEmbedVideos(embedChannelId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  const handleRunExpiryCheck = async () => {
    try {
      setExpiryRunning(true)
      const response = await fetch("/api/subscriptions/check-expiration", {
        method: "POST",
        headers: getAdminAuthHeaders(),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Expiry check failed")
      toast.success(`Expiry check complete: ${data.expired || 0} expired, ${data.reminders || 0} reminders sent`)
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Expiry check failed")
    } finally {
      setExpiryRunning(false)
    }
  }
  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      await supabase
        .from("channel_join_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
      toast.success("Join request rejected.")
      loadData()
    } catch (error) {
      toast.error("Failed to reject request.")
    }
  }

  // Filter Data
  const getFilteredData = () => {
    if (activeSubTab === "teachers") {
      const searchLower = searchTerm.toLowerCase()
      return agents.filter(
        (a) =>
          a.full_name.toLowerCase().includes(searchLower) ||
          a.phone_number?.toLowerCase().includes(searchLower),
      )
    }
    if (activeSubTab === "embed-videos") {
      return embedVideos
    }
    if (activeSubTab === "verifications") {
      const searchLower = searchTerm.toLowerCase()
      return pendingVerifications.filter(
        (item: any) =>
          item.agent_id?.toLowerCase().includes(searchLower) ||
          item.agent_name?.toLowerCase().includes(searchLower) ||
          item.channel_name?.toLowerCase().includes(searchLower),
      )
    }
    const data = activeSubTab === "channels" ? channels : joinRequests
    const searchLower = searchTerm.toLowerCase()
    return data.filter((item: any) => {
      if (activeSubTab === "channels") {
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
        )
      } else {
        return (
          item.full_name?.toLowerCase().includes(searchLower) ||
          item.phone_number?.toLowerCase().includes(searchLower) ||
          item.teaching_channels?.name?.toLowerCase().includes(searchLower)
        )
      }
    })
  }

  // Pagination
  const filteredData = getFilteredData()
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Render
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50 text-gray-900">
      {/* Top Navigation */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Teacher Hub</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search..."
            className="h-11 min-w-[180px] flex-1 border-gray-200 text-gray-900 sm:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunExpiryCheck}
            disabled={expiryRunning}
            className="h-11 whitespace-nowrap border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${expiryRunning ? "animate-spin" : ""}`} />
            Run Expiry Check
          </Button>
          {activeSubTab === "channels" && (
            <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
              <DialogTrigger asChild>
                <Button size="icon" className="h-11 w-11 bg-green-500 text-white hover:bg-green-600">
                  <Plus className="h-5 w-5 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl border border-gray-100">
                <DialogHeader>
                  <DialogTitle>Create New Channel</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24 rounded-full bg-gray-100 overflow-hidden">
                      {channelForm.image_url ? (
                        <img
                          src={channelForm.image_url || "/placeholder.svg"}
                          alt="Channel"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-11 border-gray-200 text-gray-900"
                    >
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Channel Name</Label>
                    <Input
                      id="name"
                      value={channelForm.name}
                      onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                      placeholder="e.g., Advanced Math"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={channelForm.description}
                      onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                      placeholder="Channel description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={channelForm.category}
                      onValueChange={(val) => setChannelForm({ ...channelForm, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Skills">Skills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max-members">Max Members</Label>
                    <Input
                      id="max-members"
                      type="number"
                      min="1"
                      step="1"
                      value={channelForm.max_members}
                      onChange={(e) => {
                        const value = e.target.value
                        // Remove any leading zeros and parse as number
                        const numValue = value ? Math.max(1, Number.parseInt(value, 10)) : 1
                        setChannelForm({ ...channelForm, max_members: numValue })
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-public"
                      checked={channelForm.is_public}
                      onChange={(e) => setChannelForm({ ...channelForm, is_public: e.target.checked })}
                    />
                    <Label htmlFor="is-public">Public Channel</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateChannel} className="h-11 bg-green-500 text-white hover:bg-green-600">
                    Create Channel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 bg-white">
        {[
          { id: "channels" as const, icon: BookOpen, label: "Channels" },
          { id: "join-requests" as const, icon: UserPlus, label: "Join Requests" },
          { id: "teachers" as const, icon: GraduationCap, label: "Teachers" },
          { id: "verifications" as const, icon: CreditCard, label: "Pending Verifications" },
          { id: "embed-videos" as const, icon: Video, label: "Embed Videos" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setActiveSubTab(id)
              setCurrentPage(1)
            }}
            className={`h-12 min-w-[110px] shrink-0 border-b-2 px-3 text-center text-sm ${activeSubTab === id ? "border-green-500 text-green-600" : "border-transparent text-gray-500"}`}
          >
            <Icon className="h-5 w-5 mx-auto" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {/* Channels View */}
        {activeSubTab === "channels" && (
          <div className="space-y-3">
            {paginatedData.length === 0 ? (
              <Card className="rounded-2xl border border-gray-100 py-12 text-center shadow-sm">
                <CardContent>
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No channels found</p>
                </CardContent>
              </Card>
            ) : (
              paginatedData.map((channel: TeachingChannel) => (
                <Card key={channel.id} className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-3 p-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                          <img
                            src={channel.image_url || "/placeholder.svg"}
                            alt={channel.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {channel.is_active && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 break-words">{channel.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{channel.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {channel.category}
                          </Badge>
                          <Badge variant={channel.is_public ? "default" : "secondary"} className="text-xs">
                            {channel.is_public ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </div>
                      <Dialog>
                          <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-11 w-11 text-gray-900">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xs rounded-2xl border border-gray-100">
                          <DialogHeader>
                            <DialogTitle>Channel Actions</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedChannel(channel)
                                setShowChannelDetailsDialog(true)
                                loadChannelMembers(channel.id)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedChannel(channel)
                                setEditingChannelName(channel.name) // Initialize editingChannelName
                                setShowEditChannelDialog(true)
                                setEditingChannelForm({
                                  description: channel.description,
                                  category: channel.category,
                                  is_public: channel.is_public,
                                  max_members: channel.max_members,
                                  image_url: channel.image_url || "",
                                })
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Channel
                            </Button>
                            <Button size="sm" variant="destructive" className="text-white" onClick={() => handleDeleteChannel(channel.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Channel
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Join Requests View */}
        {activeSubTab === "join-requests" && (
          <div className="space-y-3">
            {paginatedData.length === 0 ? (
              <Card className="rounded-2xl border border-gray-100 py-12 text-center shadow-sm">
                <CardContent>
                  <UserPlus className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No pending join requests</p>
                </CardContent>
              </Card>
            ) : (
              paginatedData.map((request: any) => (
                <Card key={request.id} className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 break-words">{request.full_name}</h3>
                        <p className="text-xs text-gray-500">📞 {request.phone_number || "No contact"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested to join:{" "}
                          <span className="font-medium break-words">{request.teaching_channels?.name}</span>
                        </p>
                        {request.request_message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 break-words">
                            "{request.request_message}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      {paidChannelIds.has(request.channel_id) ? (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex-1">
                          Paid channel — verify payment in <strong>Pending Verifications</strong> after the agent pays.
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          className="h-11 flex-1 bg-green-500 text-white hover:bg-green-600"
                          onClick={() => handleApproveJoinRequest(request.id, request.agent_id, request.channel_id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className={`${paidChannelIds.has(request.channel_id) ? "shrink-0" : "flex-1"} h-11 text-white`}
                        onClick={() => handleRejectJoinRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeSubTab === "teachers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginatedData.length === 0 ? (
              <Card className="text-center py-12 col-span-full">
                <CardContent>
                  <GraduationCap className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No approved agents found</p>
                </CardContent>
              </Card>
            ) : (
              (paginatedData as Agent[]).map((agent) => (
                <Card key={agent.id} className="rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{agent.full_name}</p>
                      <p className="text-xs text-gray-500">{agent.phone_number}</p>
                      <Badge className={`mt-2 ${agent.can_teach ? "bg-[#0E8F3D]/10 text-[#0E8F3D]" : "bg-gray-100 text-gray-600"}`}>
                        {agent.can_teach ? "Approved Teacher" : "Not Approved"}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-gray-500">Can teach</span>
                      <Switch checked={Boolean(agent.can_teach)} onCheckedChange={(v) => toggleAgentCanTeach(agent.id, v)} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeSubTab === "embed-videos" && (
          <div className="space-y-4">
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="grid gap-2">
                  <Label>Channel</Label>
                  <Select
                    value={embedChannelId}
                    onValueChange={(val) => {
                      setEmbedChannelId(val)
                      loadEmbedVideos(val)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {ch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={embedForm.title}
                    onChange={(e) => setEmbedForm({ ...embedForm, title: e.target.value })}
                    placeholder="Video title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Vimeo / YouTube embed code</Label>
                  <Textarea
                    rows={4}
                    value={embedForm.embedCode}
                    onChange={(e) => setEmbedForm({ ...embedForm, embedCode: e.target.value })}
                    placeholder='<iframe src="https://player.vimeo.com/video/..." ...></iframe>'
                    className="font-mono text-xs"
                  />
                </div>
                <Button
                  className="h-11 w-full bg-green-500 text-white hover:bg-green-600"
                  onClick={handleCreateEmbedVideo}
                  disabled={!embedChannelId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Embed Video
                </Button>
              </CardContent>
            </Card>

            {embedLoading ? (
              <p className="text-center text-gray-500 py-8">Loading embed videos...</p>
            ) : embedVideos.length === 0 ? (
              <Card className="rounded-2xl border border-gray-100 py-12 text-center shadow-sm">
                <CardContent>
                  <Video className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No embed videos for this channel</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {embedVideos.map((video: any) => (
                  <Card key={video.id} className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <p className="font-medium">{video.title}</p>
                      <Badge variant="outline" className="capitalize">{video.platform}</Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(video.created_at).toLocaleString()}
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-11 w-full text-white"
                        onClick={() => handleDeleteEmbedVideo(video.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === "verifications" && (
          <div className="space-y-3">
            {paginatedData.length === 0 ? (
              <Card className="rounded-2xl border border-gray-100 py-12 text-center shadow-sm">
                <CardContent>
                  <CreditCard className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No pending payment verifications</p>
                </CardContent>
              </Card>
            ) : (
              paginatedData.map((item: any) => (
                <Card key={`${item.type}-${item.id}`} className="rounded-2xl border border-gray-100 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.channel_name || "Channel"}</p>
                        {item.type === "join" ? (
                          <>
                            <p className="text-sm text-gray-700">{item.agent_name}</p>
                            <p className="text-xs text-gray-500">{item.agent_phone}</p>
                            {item.request_message && (
                              <p className="text-xs text-gray-600 mt-2 italic">&quot;{item.request_message}&quot;</p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Agent ID: {item.agent_id?.slice(0, 8)}…</p>
                        )}
                        <p className="text-sm text-[#0E8F3D] font-semibold mt-1">
                          GH₵ {Number(item.amount || 0).toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {item.type === "join" ? "Join payment" : "Renewal"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-11 flex-1 bg-green-500 text-white hover:bg-green-600"
                        onClick={() =>
                          item.type === "join"
                            ? handleVerifyJoinPayment(item)
                            : handleVerifyRenewal(item)
                        }
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Verify Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Channel Details Dialog */}
      <Dialog open={showChannelDetailsDialog} onOpenChange={setShowChannelDetailsDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-gray-100">
          <DialogHeader>
            <DialogTitle>{selectedChannel?.name}</DialogTitle>
          </DialogHeader>
          {selectedChannel?.image_url && (
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-200">
                <img
                  src={selectedChannel.image_url || "/placeholder.svg"}
                  alt={selectedChannel.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="grid gap-4 py-2">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-800 break-words">{selectedChannel?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium break-words">{selectedChannel?.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Members</p>
                <p className="font-medium break-words">
                  {selectedChannelMembers.length} / {selectedChannel?.max_members}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Channel Members</h4>
              {selectedChannelMembers.length === 0 ? (
                <p className="text-sm text-gray-500">No members yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedChannelMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium break-words">{member.agent_name}</p>
                        <p className="text-xs text-gray-500">
                          {member.phone_number ? `📞 ${member.phone_number}` : "No contact"} • Joined{" "}
                          {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleChangeMemberRole(member.id, val as any)}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteMemberFromChannel(member.id, member.agent_name)}
                          className="h-10 w-10 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedChannel(null)
                setShowChannelDetailsDialog(false)
              }}
            >
              Close
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-11 bg-green-500 text-white hover:bg-green-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl border border-gray-100">
                <DialogHeader>
                  <DialogTitle>Add Member to {selectedChannel?.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="agent-search">Search Agent</Label>
                    <Input
                      id="agent-search"
                      placeholder="Search by name or phone..."
                      value={agentSearchTerm}
                      onChange={(e) => setAgentSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="agent-select">Select Agent</Label>
                    <Select value={selectedAgentForAdd} onValueChange={setSelectedAgentForAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agents
                          .filter(
                            (agent) =>
                              agent.full_name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
                              agent.phone_number?.toLowerCase().includes(agentSearchTerm.toLowerCase()),
                          )
                          .map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name} {agent.phone_number ? `(${agent.phone_number})` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="member-role">Role</Label>
                    <Select value={selectedRoleForAdd} onValueChange={(val) => setSelectedRoleForAdd(val as any)}>
                      <SelectTrigger id="member-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMemberToChannel} className="h-11 bg-green-500 text-white hover:bg-green-600">
                    Add Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={showEditChannelDialog} onOpenChange={setShowEditChannelDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-24 h-24 rounded-full bg-gray-100 overflow-hidden">
                {editingChannelForm.image_url ? (
                  <img
                    src={editingChannelForm.image_url || "/placeholder.svg"}
                    alt="Channel"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => editFileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Change Image"}
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Channel Name</Label>
              <Input
                id="edit-name"
                value={editingChannelName}
                onChange={(e) => setEditingChannelName(e.target.value)}
                placeholder="Enter channel name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editingChannelForm.description}
                onChange={(e) => setEditingChannelForm({ ...editingChannelForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editingChannelForm.category}
                onValueChange={(val) => setEditingChannelForm({ ...editingChannelForm, category: val })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Skills">Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-max-members">Max Members</Label>
              <Input
                id="edit-max-members"
                type="number"
                min="1"
                step="1"
                value={editingChannelForm.max_members}
                onChange={(e) => {
                  const value = e.target.value
                  // Remove any leading zeros and parse as number
                  const numValue = value ? Math.max(1, Number.parseInt(value, 10)) : 1
                  setEditingChannelForm({ ...editingChannelForm, max_members: numValue })
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is-public"
                checked={editingChannelForm.is_public}
                onChange={(e) => setEditingChannelForm({ ...editingChannelForm, is_public: e.target.checked })}
              />
              <Label htmlFor="edit-is-public">Public Channel</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditChannelDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedChannel) {
                  handleUpdateChannelDetails(selectedChannel.id)
                  handleEditChannelName(selectedChannel.id)
                }
              }}
              className="h-11 bg-green-500 text-white hover:bg-green-600"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
