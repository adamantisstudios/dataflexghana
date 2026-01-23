"use client"
import { useState, useEffect, useRef } from "react"
import { BookOpen, CheckCircle2, Trash2, Plus, Eye, UserPlus, Edit2, ImageIcon, MoreVertical, X } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  const [activeSubTab, setActiveSubTab] = useState<"channels" | "join-requests">("channels")
  const [channels, setChannels] = useState<TeachingChannel[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
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
      const [channelsRes, agentsRes, joinRequestsRes] = await Promise.all([
        supabase.from("teaching_channels").select("*").order("created_at", { ascending: false }),
        supabase
          .from("agents")
          .select("id, full_name, phone_number")
          .eq("isapproved", true), // This line is actually kept from existing code, but agents are not used for teachers tab
        supabase
          .from("channel_join_requests_with_agents")
          .select(
            "id, channel_id, agent_id, request_message, status, requested_at, full_name, phone_number, teaching_channels(name)",
          )
          .eq("status", "pending")
          .order("requested_at", { ascending: false }),
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
    try {
      await supabase.from("channel_members").insert([
        {
          channel_id: channelId,
          agent_id: agentId,
          role: "member",
          status: "active",
          joined_at: new Date().toISOString(),
        },
      ])
      await supabase
        .from("channel_join_requests")
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
      toast.success("Join request approved!")
      loadData()
    } catch (error) {
      toast.error("Failed to approve request.")
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">Teacher Hub</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            className="w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {activeSubTab === "channels" && (
            <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
              <DialogTrigger asChild>
                <Button size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-5 w-5 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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
                  <Button onClick={handleCreateChannel} className="bg-blue-600 hover:bg-blue-700">
                    Create Channel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => {
            setActiveSubTab("channels")
            setCurrentPage(1)
          }}
          className={`flex-1 p-3 text-center ${activeSubTab === "channels" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          <BookOpen className="h-5 w-5 mx-auto" />
          <span className="text-xs">Channels</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab("join-requests")
            setCurrentPage(1)
          }}
          className={`flex-1 p-3 text-center ${activeSubTab === "join-requests" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          <UserPlus className="h-5 w-5 mx-auto" />
          <span className="text-xs">Join Requests</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Channels View */}
        {activeSubTab === "channels" && (
          <div className="space-y-3">
            {paginatedData.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No channels found</p>
                </CardContent>
              </Card>
            ) : (
              paginatedData.map((channel: TeachingChannel) => (
                <Card key={channel.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-3">
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
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xs">
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
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteChannel(channel.id)}>
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
              <Card className="text-center py-12">
                <CardContent>
                  <UserPlus className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No pending join requests</p>
                </CardContent>
              </Card>
            ) : (
              paginatedData.map((request: any) => (
                <Card key={request.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveJoinRequest(request.id, request.agent_id, request.channel_id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
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
        <DialogContent className="sm:max-w-md">
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
                          className="h-8 w-8 text-red-500 hover:text-red-600"
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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
                  <Button onClick={handleAddMemberToChannel} className="bg-blue-600 hover:bg-blue-700">
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
        <DialogContent className="sm:max-w-md">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
