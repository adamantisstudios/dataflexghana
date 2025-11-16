"use client"
import { useState, useEffect, useRef } from "react"
import { DialogDescription } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase } from "@/lib/supabase"
import {
  BookOpen,
  Users,
  CheckCircle2,
  Trash2,
  Search,
  Plus,
  Eye,
  Award,
  MessageSquare,
  UserPlus,
  Edit2,
} from "lucide-react"
import { toast } from "sonner"

interface TeachingChannel {
  id: string
  name: string
  description: string
  category: string
  created_by: string
  is_active: boolean
  is_public: boolean
  max_members: number
  created_at: string
  member_count?: number
}

interface TeacherApproval {
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

interface Agent {
  id: string
  full_name: string
  phone_number: string
}

interface ChannelMember {
  id: string
  agent_id: string
  agent_name: string
  phone_number?: string
  role: "admin" | "teacher" | "member"
  status: "active" | "suspended" | "left"
  joined_at: string
}

interface TeacherHubTabProps {
  getCachedData: () => any
  setCachedData: (data: any) => void
}

export default function TeacherHubTab({ getCachedData, setCachedData }: TeacherHubTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"channels" | "teachers" | "join-requests">("channels")
  const [channels, setChannels] = useState<TeachingChannel[]>([])
  const [teachers, setTeachers] = useState<TeacherApproval[]>([])
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
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherApproval | null>(null)
  const [selectedAgentForAdd, setSelectedAgentForAdd] = useState<string>("")
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<"member" | "teacher" | "admin">("member")
  const [agentSearchTerm, setAgentSearchTerm] = useState("")

  const [channelForm, setChannelForm] = useState({
    name: "",
    description: "",
    category: "General",
    is_public: false,
    max_members: 50,
  })

  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [editingChannelName, setEditingChannelName] = useState("")

  const [teacherForm, setTeacherForm] = useState({
    qualifications: "",
    experience_years: 0,
    bio: "",
    expertise_areas: "",
    approval_notes: "",
  })

  const itemsPerPage = 10
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading teacher hub data...")

      const [channelsRes, teachersRes, agentsRes, joinRequestsRes] = await Promise.all([
        supabase.from("teaching_channels").select("*").order("created_at", { ascending: false }),
        supabase.from("teacher_approvals").select("*").order("created_at", { ascending: false }),
        supabase.from("agents").select("id, full_name, phone_number").eq("isapproved", true),
        supabase
          .from("channel_join_requests_with_agents")
          .select(
            "id, channel_id, agent_id, request_message, status, requested_at, full_name, phone_number, teaching_channels(name)",
          )
          .eq("status", "pending")
          .order("requested_at", { ascending: false }),
      ])

      if (channelsRes.error) {
        console.error("[v0] Error loading channels:", channelsRes.error)
        throw channelsRes.error
      }
      if (teachersRes.error) {
        console.error("[v0] Error loading teachers:", teachersRes.error)
        throw teachersRes.error
      }
      if (agentsRes.error) {
        console.error("[v0] Error loading agents:", agentsRes.error)
        throw agentsRes.error
      }

      const { data: memberCounts, error: countError } = await supabase.from("channel_members").select("channel_id")

      if (countError) {
        console.error("[v0] Error loading member counts:", countError)
      }

      const countMap = new Map()
      memberCounts?.forEach((m) => {
        countMap.set(m.channel_id, (countMap.get(m.channel_id) || 0) + 1)
      })

      const channelsWithCounts = (channelsRes.data || []).map((channel) => ({
        ...channel,
        member_count: countMap.get(channel.id) || 0,
      }))

      const agentMap = new Map()
      agentsRes.data?.forEach((agent: any) => {
        agentMap.set(agent.id, agent)
      })

      const teachersWithAgentInfo = (teachersRes.data || []).map((teacher: any) => {
        const agent = agentMap.get(teacher.agent_id)
        return {
          ...teacher,
          agent_name: agent?.full_name || teacher.agent_id,
          agent_contact: agent?.phone_number || "No contact",
        }
      })

      setChannels(channelsWithCounts)
      setTeachers(teachersWithAgentInfo)
      setAgents(agentsRes.data || [])
      setJoinRequests(joinRequestsRes.data || [])

      console.log("[v0] Loaded:", {
        channels: channelsRes.data?.length,
        teachers: teachersRes.data?.length,
        agents: agentsRes.data?.length,
        joinRequests: joinRequestsRes.data?.length,
      })
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast.error("Failed to load Teacher Hub data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) {
      toast.error("Channel name is required")
      return
    }

    try {
      const { data, error } = await supabase.from("teaching_channels").insert([
        {
          name: channelForm.name,
          description: channelForm.description,
          category: channelForm.category,
          is_public: channelForm.is_public,
          max_members: channelForm.max_members,
          created_by: "admin",
          is_active: true,
        },
      ])

      if (error) {
        console.error("[v0] Error creating channel:", error)
        throw error
      }

      toast.success("Channel created successfully")
      setShowChannelDialog(false)
      setChannelForm({
        name: "",
        description: "",
        category: "General",
        is_public: false,
        max_members: 50,
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error creating channel:", error)
      toast.error("Failed to create channel. Please try again.")
    }
  }

  const loadChannelMembers = async (channelId: string) => {
    try {
      const { data: members, error } = await supabase
        .from("channel_members_with_agents")
        .select("id, agent_id, role, status, joined_at, full_name, phone_number")
        .eq("channel_id", channelId)
        .eq("status", "active")

      if (error) throw error

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
      console.error("[v0] Error loading channel members:", error)
      toast.error("Failed to load channel members")
    }
  }

  const handleAddMemberToChannel = async () => {
    if (!selectedChannel || !selectedAgentForAdd) {
      toast.error("Please select an agent")
      return
    }

    try {
      const { data: existing, error: checkError } = await supabase
        .from("channel_members")
        .select("id")
        .eq("channel_id", selectedChannel.id)
        .eq("agent_id", selectedAgentForAdd)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("[v0] Error checking membership:", checkError)
        throw checkError
      }

      if (existing) {
        toast.error("Agent is already a member of this channel")
        return
      }

      const { error: insertError } = await supabase.from("channel_members").insert([
        {
          channel_id: selectedChannel.id,
          agent_id: selectedAgentForAdd,
          role: selectedRoleForAdd,
          status: "active",
        },
      ])

      if (insertError) {
        console.error("[v0] Error adding member:", insertError)
        throw insertError
      }

      toast.success(`Member added as ${selectedRoleForAdd}`)
      setShowAddMemberDialog(false)
      setSelectedAgentForAdd("")
      setSelectedRoleForAdd("member")
      loadData()
      if (selectedChannel) {
        loadChannelMembers(selectedChannel.id)
      }
    } catch (error) {
      console.error("[v0] Error adding member:", error)
      toast.error("Failed to add member. Please try again.")
    }
  }

  const handleDeleteMemberFromChannel = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this channel?`)) return

    try {
      const { error } = await supabase.from("channel_members").delete().eq("id", memberId)

      if (error) throw error

      toast.success("Member removed from channel")
      if (selectedChannel) {
        loadChannelMembers(selectedChannel.id)
      }
    } catch (error) {
      console.error("[v0] Error deleting member:", error)
      toast.error("Failed to remove member")
    }
  }

  const handleEditChannelName = async (channelId: string) => {
    if (!editingChannelName.trim()) {
      toast.error("Channel name cannot be empty")
      return
    }

    try {
      const { error } = await supabase
        .from("teaching_channels")
        .update({ name: editingChannelName })
        .eq("id", channelId)

      if (error) throw error

      toast.success("Channel name updated successfully")
      setEditingChannelId(null)
      setEditingChannelName("")
      loadData()
    } catch (error) {
      console.error("[v0] Error updating channel name:", error)
      toast.error("Failed to update channel name")
    }
  }

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      const { error } = await supabase
        .from("teacher_approvals")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", teacherId)

      if (error) throw error

      toast.success("Teacher approved successfully")
      loadData()
    } catch (error) {
      console.error("[v0] Error approving teacher:", error)
      toast.error("Failed to approve teacher")
    }
  }

  const handleRejectTeacher = async (teacherId: string) => {
    try {
      const { error } = await supabase.from("teacher_approvals").update({ status: "rejected" }).eq("id", teacherId)

      if (error) throw error

      toast.success("Teacher rejected")
      loadData()
    } catch (error) {
      console.error("[v0] Error rejecting teacher:", error)
      toast.error("Failed to reject teacher")
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Are you sure you want to delete this channel?")) return

    try {
      const { error } = await supabase.from("teaching_channels").delete().eq("id", channelId)

      if (error) throw error

      toast.success("Channel deleted successfully")
      loadData()
    } catch (error) {
      console.error("[v0] Error deleting channel:", error)
      toast.error("Failed to delete channel")
    }
  }

  const handleApproveJoinRequest = async (requestId: string, agentId: string, channelId: string) => {
    try {
      const { error: memberError } = await supabase.from("channel_members").insert([
        {
          channel_id: channelId,
          agent_id: agentId,
          role: "member",
          status: "active",
          joined_at: new Date().toISOString(),
        },
      ])

      if (memberError) throw memberError

      const { error: requestError } = await supabase
        .from("channel_join_requests")
        .update({ status: "approved", responded_at: new Date().toISOString() })
        .eq("id", requestId)

      if (requestError) throw requestError

      toast.success("Join request approved!")
      loadData()
    } catch (error) {
      console.error("[v0] Error approving request:", error)
      toast.error("Failed to approve request")
    }
  }

  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("channel_join_requests")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", requestId)

      if (error) throw error

      toast.success("Join request rejected")
      loadData()
    } catch (error) {
      console.error("[v0] Error rejecting request:", error)
      toast.error("Failed to reject request")
    }
  }

  const getFilteredData = () => {
    let data: any[] = []

    if (activeSubTab === "channels") {
      data = channels
    } else if (activeSubTab === "teachers") {
      data = teachers
    } else if (activeSubTab === "join-requests") {
      data = joinRequests
    }

    return data.filter((item) => {
      const searchLower = searchTerm.toLowerCase()
      if (activeSubTab === "channels") {
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
        )
      } else if (activeSubTab === "join-requests") {
        return (
          item.full_name?.toLowerCase().includes(searchLower) ||
          item.phone_number?.toLowerCase().includes(searchLower) ||
          item.teaching_channels?.name?.toLowerCase().includes(searchLower)
        )
      } else {
        return (
          item.agent_name?.toLowerCase().includes(searchLower) ||
          item.agent_contact?.toLowerCase().includes(searchLower) ||
          item.bio?.toLowerCase().includes(searchLower)
        )
      }
    })
  }

  const filteredAgents = agents.filter((agent) => {
    if (!agent || !agent.full_name) return false
    const searchLower = agentSearchTerm.toLowerCase()
    return (
      agent.full_name.toLowerCase().includes(searchLower) ||
      (agent.phone_number && agent.phone_number.toLowerCase().includes(searchLower))
    )
  })

  const filteredData = getFilteredData()
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-blue-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveSubTab("channels")
            setCurrentPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeSubTab === "channels"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <BookOpen className="inline h-4 w-4 mr-2" />
          Channels
        </button>
        <button
          onClick={() => {
            setActiveSubTab("join-requests")
            setCurrentPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeSubTab === "join-requests"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <UserPlus className="inline h-4 w-4 mr-2" />
          Join Requests ({joinRequests.length})
        </button>
        <button
          onClick={() => {
            setActiveSubTab("teachers")
            setCurrentPage(1)
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeSubTab === "teachers"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Award className="inline h-4 w-4 mr-2" />
          Teachers
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
          <Input
            placeholder={`Search ${activeSubTab}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 border-blue-200 focus:border-blue-500 bg-white/80"
          />
        </div>
        {activeSubTab === "channels" && (
          <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <Plus className="h-4 w-4 mr-2" />
                New Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Teaching Channel</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input
                    id="channel-name"
                    value={channelForm.name}
                    onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                    placeholder="e.g., Advanced Python Programming"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="channel-desc">Description</Label>
                  <Textarea
                    id="channel-desc"
                    value={channelForm.description}
                    onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                    placeholder="Channel description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="channel-category">Category</Label>
                  <Select
                    value={channelForm.category}
                    onValueChange={(val) => setChannelForm({ ...channelForm, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Skills">Skills</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max-members">Max Members</Label>
                  <Input
                    id="max-members"
                    type="number"
                    min="1"
                    value={channelForm.max_members}
                    onChange={(e) =>
                      setChannelForm({ ...channelForm, max_members: Number.parseInt(e.target.value) || 50 })
                    }
                    placeholder="Maximum number of members"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={channelForm.is_public}
                    onChange={(e) => setChannelForm({ ...channelForm, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="public">Public Channel</Label>
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

      {/* Channels View */}
      {activeSubTab === "channels" && (
        <div ref={listRef} className="space-y-4">
          {paginatedData.length === 0 ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center text-blue-600">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No channels found</p>
              </CardContent>
            </Card>
          ) : (
            paginatedData.map((channel: TeachingChannel) => (
              <Card key={channel.id} className="border-blue-200 bg-white/90 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        {editingChannelId === channel.id ? (
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={editingChannelName}
                              onChange={(e) => setEditingChannelName(e.target.value)}
                              className="border-blue-200 focus:border-blue-500"
                              placeholder="Channel name"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleEditChannelName(channel.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingChannelId(null)
                                setEditingChannelName("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-blue-800 text-lg">{channel.name}</h3>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={channel.is_public ? "default" : "secondary"}>
                          {channel.is_public ? "Public" : "Private"}
                        </Badge>
                        {editingChannelId !== channel.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingChannelId(channel.id)
                              setEditingChannelName(channel.name)
                            }}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{channel.category}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        <Users className="inline h-3 w-3 mr-1" />
                        {channel.member_count || 0} / {channel.max_members}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${channel.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {channel.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200 flex-wrap">
                      <Dialog
                        open={showChannelDetailsDialog && selectedChannel?.id === channel.id}
                        onOpenChange={setShowChannelDetailsDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-300 bg-transparent"
                            onClick={() => {
                              setSelectedChannel(channel)
                              loadChannelMembers(channel.id)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Channel
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedChannel?.name}</DialogTitle>
                            <DialogDescription>{selectedChannel?.description}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-600">Category</p>
                                <p className="font-semibold text-blue-800">{selectedChannel?.category}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Members</p>
                                <p className="font-semibold text-blue-800">
                                  {selectedChannelMembers.length} / {selectedChannel?.max_members}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Channel Members</h4>
                              {selectedChannelMembers.length === 0 ? (
                                <p className="text-sm text-gray-600">No members yet</p>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {selectedChannelMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{member.agent_name}</p>
                                        <p className="text-xs text-gray-600">
                                          {member.phone_number ? `📞 ${member.phone_number}` : "No contact"} • Joined{" "}
                                          {new Date(member.joined_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{member.role}</Badge>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteMemberFromChannel(member.id, member.agent_name)}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={showAddMemberDialog && selectedChannel?.id === channel.id}
                        onOpenChange={setShowAddMemberDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-300 bg-transparent"
                            onClick={() => setSelectedChannel(channel)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Add Member to Channel</DialogTitle>
                            <DialogDescription>
                              Select an agent and role to add to {selectedChannel?.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="agent-search">Search Agent</Label>
                              <Input
                                id="agent-search"
                                placeholder="Search by name or phone..."
                                value={agentSearchTerm}
                                onChange={(e) => setAgentSearchTerm(e.target.value)}
                                className="border-blue-200 focus:border-blue-500"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="agent-select">Select Agent</Label>
                              <Select value={selectedAgentForAdd} onValueChange={setSelectedAgentForAdd}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an agent..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredAgents.map((agent) => (
                                    <SelectItem key={agent.id} value={agent.id}>
                                      {agent.full_name} {agent.phone_number ? `(${agent.phone_number})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="member-role">Role</Label>
                              <Select
                                value={selectedRoleForAdd}
                                onValueChange={(val) => setSelectedRoleForAdd(val as any)}
                              >
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
                            <Button type="button" variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleAddMemberToChannel}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Add Member
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteChannel(channel.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Join Requests View */}
      {activeSubTab === "join-requests" && (
        <div ref={listRef} className="space-y-4">
          {paginatedData.length === 0 ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center text-blue-600">
                <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending join requests</p>
              </CardContent>
            </Card>
          ) : (
            paginatedData.map((request: any) => (
              <Card key={request.id} className="border-amber-200 bg-white/90 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-800 text-lg">{request.full_name}</h3>
                        <p className="text-sm text-gray-600">📞 {request.phone_number || "No contact"}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Requested to join: <span className="font-medium">{request.teaching_channels?.name}</span>
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    {request.request_message && (
                      <div className="bg-amber-50 p-3 rounded border border-amber-200">
                        <p className="text-xs text-gray-600 font-medium mb-1">Message:</p>
                        <p className="text-sm text-gray-700">"{request.request_message}"</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Requested on {new Date(request.requested_at).toLocaleString()}
                    </p>
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Button
                        size="sm"
                        onClick={() => handleApproveJoinRequest(request.id, request.agent_id, request.channel_id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectJoinRequest(request.id)}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Teachers View - REDESIGNED */}
      {activeSubTab === "teachers" && (
        <div ref={listRef} className="space-y-4">
          {paginatedData.length === 0 ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center text-blue-600">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No teachers found</p>
              </CardContent>
            </Card>
          ) : (
            paginatedData.map((teacher: TeacherApproval) => {
              const teacherChannels = channels.filter((ch) =>
                selectedChannelMembers?.some((m) => m.agent_id === teacher.agent_id && m.role === "teacher"),
              )

              return (
                <Card key={teacher.id} className="border-blue-200 bg-white/90 hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-800 text-lg">{teacher.agent_name}</h3>
                          <p className="text-sm text-gray-600">📞 {teacher.agent_contact}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Experience:</span> {teacher.experience_years} years
                          </p>
                        </div>
                        <Badge
                          variant={
                            teacher.status === "approved"
                              ? "default"
                              : teacher.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">Channels Teaching:</p>
                        <div className="space-y-1">
                          {teacherChannels.length > 0 ? (
                            teacherChannels.map((ch) => (
                              <div key={ch.id} className="text-sm text-blue-700 flex items-center justify-between">
                                <span>{ch.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Teacher
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-600">Not assigned to any channels yet</p>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700">
                        <p>
                          <span className="font-medium">Bio:</span> {teacher.bio}
                        </p>
                        {teacher.expertise_areas && teacher.expertise_areas.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {teacher.expertise_areas.map((area, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 bg-transparent">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Remove ${teacher.agent_name} as a teacher?`)) {
                              handleRemoveTeacherFromAllChannels(teacher.agent_id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Teacher
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )

  const handleRemoveTeacherFromAllChannels = async (agentId: string) => {
    try {
      const { error } = await supabase.from("channel_members").delete().eq("agent_id", agentId).eq("role", "teacher")

      if (error) throw error

      toast.success("Teacher removed from all channels")
      loadData()
    } catch (error) {
      console.error("[v0] Error removing teacher:", error)
      toast.error("Failed to remove teacher")
    }
  }
}
