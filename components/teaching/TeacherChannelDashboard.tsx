"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Users, FileText, CheckCircle2, Trash2, Plus, Eye, MessageSquare, Play } from "lucide-react"
import { toast } from "sonner"
import { ImagePicker } from "./media/ImagePicker"
import { AudioRecorder } from "./media/AudioRecorder"
import { AudioPreviewPlayer } from "./media/AudioPreviewPlayer"
import { DocumentUploader } from "./media/DocumentUploader"
import { LinkSharer } from "./media/LinkSharer"
import { FontSizeControl } from "./FontSizeControl"
import { compressImage } from "./media/ImageCompressor"
import { getAudioDuration } from "./media/AudioCompressor"
import { uploadMultipleImages, uploadAudioToBlob } from "@/lib/media-upload"
import { MessageActions } from "./media/MessageActions"
import { ImageGalleryGrid } from "./media/ImageGalleryGrid"
import { AudioPlayerWithWaveform } from "./media/AudioPlayerWithWaveform"
import { DocumentPreview } from "./media/DocumentPreview"
import { uploadMultipleDocuments } from "@/lib/media-upload"
import { MathRenderer } from "./media/MathRenderer"
import { CodeBlockRenderer } from "./media/CodeBlockRenderer"
import { ChannelMenuBar } from "./media/ChannelMenuBar"
import { ContentRenderer } from "./media/ContentRenderer"
import { LinkPreviewRenderer } from "./media/LinkPreviewRenderer"
import { addMemberToChannel, logMembershipDiagnostic } from "@/lib/channel-membership-utils"
import { QAPostCreator, QAPostDisplay } from "./qa"
import { LessonNotesManager } from "./lesson-notes/LessonNotesManager"
import { VideoPostCreator } from "./VideoPostCreator"
import { VideoPostDisplay } from "./VideoPostDisplay"
import { DetailedMathExampleModal } from "./media/DetailedMathExampleModal"
import { YouTubeVideoCreator } from "./youtube/YouTubeVideoCreator"
import { YouTubeVideoDisplay } from "./youtube/YouTubeVideoDisplay"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChannelSubscriptionManager } from "./channel-subscription-manager"

interface Channel {
  id: string
  name: string
  description: string
  category: string
  is_active: boolean
  max_members: number
  created_at: string
}

interface ChannelMember {
  id: string
  agent_id: string
  agent_name: string
  agent_contact: string
  role: "admin" | "teacher" | "member"
  status: "active" | "suspended" | "left"
  joined_at: string
}

interface JoinRequest {
  id: string
  agent_id: string
  agent_name: string
  agent_contact: string
  request_message: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

interface ChannelMessage {
  id: string
  channel_id: string
  agent_id: string
  content: string
  message_type: "text" | "image" | "audio" | "document" | "link" | "deleted"
  created_at: string
  message_media?: Array<{
    id: string
    media_type: string
    media_url: string
    file_name: string
    width?: number
    height?: number
    duration?: number
  }>
}

interface SharedLink {
  url: string
  title: string
}

interface TeacherChannelDashboardProps {
  channelId: string
  teacherId: string
  teacherName: string
}

export function TeacherChannelDashboard({ channelId, teacherId, teacherName }: TeacherChannelDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    | "feeds"
    | "overview"
    | "members"
    | "requests"
    | "lesson-notes"
    | "qa"
    | "videos"
    | "youtube-videos"
    | "subscriptions"
  >("feeds")
  const [channel, setChannel] = useState<Channel | null>(null)
  const [members, setMembers] = useState<ChannelMember[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [messages, setMessages] = useState<ChannelMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    post_type: "lesson" as "lesson" | "announcement" | "resource" | "discussion",
  })
  const [showMediaDialog, setShowMediaDialog] = useState(false)
  const [mediaForm, setMediaForm] = useState({
    type: "text" as "text" | "image" | "audio" | "document" | "link" | "video",
    title: "",
    content: "",
    selectedImages: [] as File[],
    selectedAudio: null as Blob | null | File, // Allow File for video
    selectedDocuments: [] as File[],
    selectedLinks: [] as SharedLink[],
  })
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [addMemberForm, setAddMemberForm] = useState({
    agentId: "",
    role: "member" as "member" | "teacher" | "admin",
  })
  const [qaPosts, setQAPosts] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [permanentlyDeletingId, setPermanentlyDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmType, setDeleteConfirmType] = useState<string | null>(null)

  useEffect(() => {
    loadChannelData()
  }, [channelId])

  const loadChannelData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: channelData, error: channelError } = await supabase
        .from("teaching_channels")
        .select("*")
        .eq("id", channelId)
        .single()
      if (channelError) {
        console.error("[v0] Error loading channel:", channelError)
        toast.error("Failed to load channel data")
        setLoading(false)
        return
      }
      setChannel(channelData)
      const { data: membersData, error: membersError } = await supabase
        .from("channel_members_with_agents")
        .select("id, agent_id, role, status, joined_at, full_name, phone_number")
        .eq("channel_id", channelId)
        .eq("status", "active")
      if (membersError) {
        console.error("[v0] Error loading members:", membersError)
        toast.error("Failed to load channel members")
        setMembers([])
      } else {
        const membersWithDetails = (membersData || []).map((m: any) => ({
          id: m.id,
          agent_id: m.agent_id,
          agent_name: m.full_name || m.agent_id,
          agent_contact: m.phone_number || "",
          role: m.role,
          status: m.status,
          joined_at: m.joined_at,
        }))
        setMembers(membersWithDetails)
      }
      const { data: requestsData, error: requestsError } = await supabase
        .from("channel_join_requests_with_agents")
        .select("id, agent_id, request_message, status, requested_at, full_name, phone_number")
        .eq("channel_id", channelId)
        .eq("status", "pending")
      if (requestsError) {
        console.error("[v0] Error loading join requests:", requestsError)
        toast.error("Failed to load join requests")
        setJoinRequests([])
      } else {
        const requestsWithDetails = (requestsData || []).map((r: any) => ({
          id: r.id,
          agent_id: r.agent_id,
          agent_name: r.full_name || r.agent_id,
          agent_contact: r.phone_number || "",
          request_message: r.request_message,
          status: r.status,
          created_at: r.requested_at,
        }))
        setJoinRequests(requestsWithDetails)
      }
      const { data: postsData, error: postsError } = await supabase
        .from("channel_posts")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
      if (postsError) {
        console.error("[v0] Error loading posts:", postsError)
      } else {
        setPosts(postsData || [])
      }
      const { data: messagesData, error: messagesError } = await supabase
        .from("channel_messages")
        .select(
          `id,
          channel_id,
          agent_id,
          content,
          message_type,
          created_at,
          message_media (
            id,
            media_type,
            media_url,
            file_name,
            width,
            height,
            duration
          )
        `,
        )
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
      if (messagesError) {
        console.error("[v0] Error loading messages:", messagesError)
      } else {
        setMessages(messagesData || [])
      }
      const { data: qaPostsData, error: qaError } = await supabase
        .from("qa_posts")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
      if (qaError) {
        console.error("[v0] Error loading Q&A posts:", qaError)
      } else {
        setQAPosts(qaPostsData || [])
      }
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
      if (videosError) {
        console.error("[v0] Error loading videos:", videosError)
      } else {
        setVideos(videosData || [])
      }
      const { data: youtubeVideosData, error: youtubeError } = await supabase
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
      if (youtubeError) {
        console.error("[v0] Error loading YouTube videos:", youtubeError)
      } else {
        setYoutubeVideos(youtubeVideosData || [])
      }
    } catch (error) {
      console.error("[v0] Error loading channel data:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [channelId])

  const renderContentWithMath = useCallback((content: string) => {
    if (content.includes("\\(") || content.includes("\\[") || content.includes("$$")) {
      return <MathRenderer content={content} />
    }
    return <p className="text-gray-700 text-sm break-words whitespace-pre-wrap">{content}</p>
  }, [])

  const sortedContent = useMemo(() => {
    return [
      ...posts.map((p) => ({ ...p, type: "post", timestamp: new Date(p.created_at).getTime() })),
      ...messages.map((m) => ({ ...m, type: "message", timestamp: new Date(m.created_at).getTime() })),
      ...videos.map((v) => ({ ...v, type: "video", timestamp: new Date(v.created_at).getTime() })),
      ...youtubeVideos.map((v) => ({ ...v, type: "youtube", timestamp: new Date(v.created_at).getTime() })),
      ...qaPosts.map((q) => ({ ...q, type: "qa", timestamp: new Date(q.created_at).getTime() })),
    ].sort((a, b) => b.timestamp - a.timestamp)
  }, [posts, messages, videos, youtubeVideos, qaPosts])

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      toast.error("Title and content are required")
      return
    }
    try {
      const { data: membership, error: memberError } = await supabase
        .from("channel_members")
        .select("role")
        .eq("channel_id", channelId)
        .eq("agent_id", teacherId)
        .single()
      if (memberError || !membership) {
        toast.error("You don't have permission to create posts in this channel")
        return
      }
      if (membership.role !== "admin" && membership.role !== "teacher") {
        toast.error("Only admins and teachers can create posts")
        return
      }
      const { error } = await supabase.from("channel_posts").insert([
        {
          channel_id: channelId,
          author_id: teacherId,
          author_name: teacherName,
          title: postForm.title,
          content: postForm.content,
          post_type: postForm.post_type,
          is_pinned: false,
          is_archived: false,
        },
      ])
      if (error) {
        console.error("[v0] Error creating post:", error)
        throw error
      }
      toast.success("Post created successfully!")
      setShowPostDialog(false)
      setPostForm({ title: "", content: "", post_type: "lesson" })
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  const handleDeletePost = async (postId: string) => {
    setDeleteConfirmId(postId)
    setDeleteConfirmType("post")
  }

  const confirmDeletePost = async (postId: string) => {
    try {
      setDeletingPostId(postId)
      const { error } = await supabase
        .from("channel_posts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: teacherId,
        })
        .eq("id", postId)
      if (error) {
        console.error("[v0] Error deleting post:", error)
        throw error
      }
      toast.success("Post deleted")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      toast.error("Failed to delete post")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
    } finally {
      setDeletingPostId(null)
    }
  }

  const handlePermanentlyDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this post? This cannot be undone.")) return
    try {
      setPermanentlyDeletingId(postId)
      const { error } = await supabase.from("channel_posts").delete().eq("id", postId)
      if (error) {
        console.error("[v0] Error permanently deleting post:", error)
        throw error
      }
      toast.success("Post permanently deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error permanently deleting post:", error)
      toast.error("Failed to permanently delete post")
    } finally {
      setPermanentlyDeletingId(null)
    }
  }

  const handleCreateMediaMessage = async () => {
    if (!mediaForm.title.trim() || !mediaForm.content.trim()) {
      toast.error("Title and content are required")
      return
    }
    if (mediaForm.type === "image" && mediaForm.selectedImages.length === 0) {
      toast.error("Please select at least one image")
      return
    }
    if (mediaForm.type === "audio" && !mediaForm.selectedAudio) {
      toast.error("Please record an audio message")
      return
    }
    if (mediaForm.type === "video") {
      if (!mediaForm.selectedAudio) {
        // Assuming selectedAudio is used for video upload
        toast.error("Please upload a video")
        return
      }
      // Check if video duration is provided from VideoPostCreator
      const videoDuration = (mediaForm.selectedAudio as any).duration
      if (videoDuration && videoDuration > 120) {
        toast.error("Video duration must not exceed 2 minutes (120 seconds)")
        return
      }
      const videoSizeMB = (mediaForm.selectedAudio as any).size / (1024 * 1024)
      if (videoSizeMB > 100) {
        toast.error("Video file size must not exceed 100 MB")
        return
      }
    }
    if (mediaForm.type === "document" && mediaForm.selectedDocuments.length === 0) {
      toast.error("Please select at least one document")
      return
    }
    if (mediaForm.type === "link" && mediaForm.selectedLinks.length === 0) {
      toast.error("Please add at least one link")
      return
    }
    try {
      setIsUploadingMedia(true)
      const { data: messageData, error: messageError } = await supabase
        .from("channel_messages")
        .insert([
          {
            channel_id: channelId,
            agent_id: teacherId,
            content: mediaForm.content,
            message_type: mediaForm.type,
          },
        ])
        .select()
        .single()
      if (messageError) {
        console.error("[v0] Error creating message:", messageError)
        throw messageError
      }
      if (mediaForm.type === "image" && mediaForm.selectedImages.length > 0) {
        const compressedImages = await Promise.all(
          mediaForm.selectedImages.map((img) => compressImage(img, 1200, 1200, 0.8)),
        )
        const uploadedUrls = await uploadMultipleImages(compressedImages.map((ci) => ci.file))
        const mediaRecords = await Promise.all(
          uploadedUrls.map(async (url, index) => {
            const dims = compressedImages[index]
            return {
              message_id: messageData.id,
              media_type: "image",
              media_url: url,
              file_name: mediaForm.selectedImages[index].name,
              file_size: mediaForm.selectedImages[index].size,
              width: dims.width,
              height: dims.height,
            }
          }),
        )
        const { error: mediaError } = await supabase.from("message_media").insert(mediaRecords)
        if (mediaError) {
          console.error("[v0] Error creating media records:", mediaError)
          throw mediaError
        }
      } else if (mediaForm.type === "audio" && mediaForm.selectedAudio) {
        const audioUrl = await uploadAudioToBlob(
          new File([mediaForm.selectedAudio], "audio.webm", { type: "audio/webm" }),
        )
        const duration = await getAudioDuration(new File([mediaForm.selectedAudio], "audio.webm"))
        const { error: mediaError } = await supabase.from("message_media").insert([
          {
            message_id: messageData.id,
            media_type: "audio",
            media_url: audioUrl,
            file_name: "audio-message.webm",
            file_size: mediaForm.selectedAudio.size,
            duration,
          },
        ])
        if (mediaError) {
          console.error("[v0] Error creating audio record:", mediaError)
          throw mediaError
        }
      } else if (mediaForm.type === "video" && mediaForm.selectedAudio instanceof File) {
        // Handle video upload
        const videoFile = mediaForm.selectedAudio as File
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(`${channelId}/${videoFile.name}`, videoFile)
        if (uploadError) {
          console.error("[v0] Error uploading video:", uploadError)
          throw uploadError
        }
        const mediaUrl = `https://your-supabase-storage-url.com/${channelId}/${videoFile.name}` // Replace with your actual storage URL
        const { error: mediaError } = await supabase.from("message_media").insert([
          {
            message_id: messageData.id,
            media_type: "video",
            media_url: mediaUrl,
            file_name: videoFile.name,
            file_size: videoFile.size,
            duration: (videoFile as any).duration, // Assuming duration is attached from VideoPostCreator
          },
        ])
        if (mediaError) {
          console.error("[v0] Error creating video record:", mediaError)
          throw mediaError
        }
      } else if (mediaForm.type === "document" && mediaForm.selectedDocuments.length > 0) {
        const uploadedUrls = await uploadMultipleDocuments(mediaForm.selectedDocuments)
        const mediaRecords = uploadedUrls.map((url, index) => ({
          message_id: messageData.id,
          media_type: "document",
          media_url: url,
          file_name: mediaForm.selectedDocuments[index].name,
          file_size: mediaForm.selectedDocuments[index].size,
        }))
        const { error: mediaError } = await supabase.from("message_media").insert(mediaRecords)
        if (mediaError) {
          console.error("[v0] Error creating document records:", mediaError)
          throw mediaError
        }
      } else if (mediaForm.type === "link" && mediaForm.selectedLinks.length > 0) {
        const linkText = mediaForm.selectedLinks.map((l) => `[${l.title}](${l.url})`).join("\n")
        const { error: updateError } = await supabase
          .from("channel_messages")
          .update({ content: `${mediaForm.content}\n\n${linkText}` })
          .eq("id", messageData.id)
        if (updateError) throw updateError
      }
      toast.success(`${mediaForm.type} message shared successfully!`)
      setShowMediaDialog(false)
      setMediaForm({
        type: "text",
        title: "",
        content: "",
        selectedImages: [],
        selectedAudio: null,
        selectedDocuments: [],
        selectedLinks: [],
      })
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error creating media message:", error)
      toast.error("Failed to share media")
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const handleApproveRequest = async (requestId: string, agentId: string) => {
    try {
      const { error: memberError } = await supabase.from("channel_members").insert([
        {
          channel_id: channelId,
          agent_id: agentId,
          role: "member",
          status: "active",
        },
      ])
      if (memberError) {
        console.error("[v0] Error adding member:", memberError)
        throw memberError
      }
      const { error: requestError } = await supabase
        .from("channel_join_requests")
        .update({ status: "approved", responded_at: new Date().toISOString() })
        .eq("id", requestId)
      if (requestError) {
        console.error("[v0] Error updating request:", requestError)
        throw requestError
      }
      toast.success("Request approved! Member added as member.")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error approving request:", error)
      toast.error("Failed to approve request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("channel_join_requests")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", requestId)
      if (error) {
        console.error("[v0] Error rejecting request:", error)
        throw error
      }
      toast.success("Request rejected")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error rejecting request:", error)
      toast.error("Failed to reject request")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setDeleteConfirmId(memberId)
    setDeleteConfirmType("member")
  }

  const confirmRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from("channel_members").delete().eq("id", memberId)
      if (error) {
        console.error("[v0] Error removing member:", error)
        throw error
      }
      toast.success("Member removed")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error removing member:", error)
      toast.error("Failed to remove member")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    setDeleteConfirmId(messageId)
    setDeleteConfirmType("message")
  }

  const confirmDeleteMessage = async (messageId: string) => {
    try {
      setDeletingMessageId(messageId)
      const { error: mediaError } = await supabase.from("message_media").delete().eq("message_id", messageId)
      if (mediaError) {
        console.error("[v0] Error deleting media:", mediaError)
        throw mediaError
      }
      const { error: messageError } = await supabase
        .from("channel_messages")
        .update({
          content: "[This message was deleted]",
          message_type: "deleted",
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId)
      if (messageError) {
        console.error("[v0] Error deleting message:", messageError)
        throw messageError
      }
      toast.success("Message deleted")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error deleting message:", error)
      toast.error("Failed to delete message")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
    } finally {
      setDeletingMessageId(null)
    }
  }

  const handlePermanentlyDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to permanently delete this message? This cannot be undone.")) return
    try {
      setPermanentlyDeletingId(messageId)
      const { error: mediaError } = await supabase.from("message_media").delete().eq("message_id", messageId)
      if (mediaError) {
        console.error("[v0] Error deleting media:", mediaError)
        throw mediaError
      }
      const { error: messageError } = await supabase.from("channel_messages").delete().eq("id", messageId)
      if (messageError) {
        console.error("[v0] Error permanently deleting message:", messageError)
        throw messageError
      }
      toast.success("Message permanently deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error permanently deleting message:", error)
      toast.error("Failed to permanently delete message")
    } finally {
      setPermanentlyDeletingId(null)
    }
  }

  const handleDeleteMedia = async (messageId: string, mediaId: string) => {
    try {
      const { error } = await supabase.from("message_media").delete().eq("id", mediaId)
      if (error) {
        console.error("[v0] Error deleting media:", error)
        throw error
      }
      toast.success("Media deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error deleting media:", error)
      toast.error("Failed to delete media")
    }
  }

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear all messages and content? This cannot be undone.")) return
    try {
      const { error: mediaError } = await supabase
        .from("message_media")
        .delete()
        .in(
          "message_id",
          messages.map((m) => m.id),
        )
      if (mediaError) {
        console.error("[v0] Error deleting media:", mediaError)
        throw mediaError
      }
      const { error: messagesError } = await supabase.from("channel_messages").delete().eq("channel_id", channelId)
      if (messagesError) {
        console.error("[v0] Error deleting messages:", messagesError)
        throw messagesError
      }
      toast.success("Chat cleared successfully")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error clearing chat:", error)
      toast.error("Failed to clear chat")
    }
  }

  const handleAddMemberDirectly = async () => {
    if (!addMemberForm.agentId.trim()) {
      toast.error("Please enter an agent name or contact number")
      return
    }
    try {
      logMembershipDiagnostic(`Admin adding member ${addMemberForm.agentId} to channel ${channelId}`)
      const searchTerm = addMemberForm.agentId.trim().toLowerCase()
      let agentData: { id: string; full_name: string | null; phone_number: string | null } | null = null
      const { data: phoneMatch } = await supabase
        .from("agents")
        .select("id, full_name, phone_number")
        .eq("phone_number", searchTerm)
        .single()
      if (phoneMatch) {
        agentData = phoneMatch
      } else {
        const { data: nameMatches } = await supabase
          .from("agents")
          .select("id, full_name, phone_number")
          .ilike("full_name", `%${searchTerm}%`)
          .limit(10)
        if (nameMatches && nameMatches.length > 0) {
          agentData = nameMatches[0]
        }
      }
      if (!agentData) {
        toast.error("Agent not found. Please check the name or contact number.")
        return
      }
      const { success, error } = await addMemberToChannel(channelId, agentData.id, addMemberForm.role)
      if (!success) {
        toast.error(error || "Failed to add member")
        return
      }
      toast.success(`Member ${agentData.full_name} added successfully as ${addMemberForm.role}`)
      setShowAddMemberDialog(false)
      setAddMemberForm({ agentId: "", role: "member" })
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error adding member:", error)
      logMembershipDiagnostic(`Exception adding member: ${error}`)
      toast.error("Failed to add member")
    }
  }

  const handleDeleteQAPost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this Q&A post?")) return
    try {
      const { error } = await supabase
        .from("qa_posts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", postId)
      if (error) {
        console.error("[v0] Error deleting Q&A post:", error)
        throw error
      }
      toast.success("Q&A post deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error deleting Q&A post:", error)
      toast.error("Failed to delete Q&A post")
    }
  }

  const handlePermanentlyDeleteQAPost = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this Q&A post? This cannot be undone.")) return
    try {
      setPermanentlyDeletingId(postId)
      const { error } = await supabase.from("qa_posts").delete().eq("id", postId)
      if (error) {
        console.error("[v0] Error permanently deleting Q&A post:", error)
        throw error
      }
      toast.success("Q&A post permanently deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error permanently deleting Q&A post:", error)
      toast.error("Failed to permanently delete Q&A post")
    } finally {
      setPermanentlyDeletingId(null)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return
    try {
      const { error } = await supabase
        .from("videos")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", videoId)
      if (error) {
        console.error("[v0] Error deleting video:", error)
        throw error
      }
      toast.success("Video deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error deleting video:", error)
      toast.error("Failed to delete video")
    }
  }

  const handlePermanentlyDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to permanently delete this video? This cannot be undone.")) return
    try {
      setPermanentlyDeletingId(videoId)
      const { error } = await supabase.from("videos").delete().eq("id", videoId)
      if (error) {
        console.error("[v0] Error permanently deleting video:", error)
        throw error
      }
      toast.success("Video permanently deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error permanently deleting video:", error)
      toast.error("Failed to permanently delete video")
    } finally {
      setPermanentlyDeletingId(null)
    }
  }

  const handleRevealQAAnswer = async (postId: string) => {
    try {
      const post = qaPosts.find((p) => p.id === postId)
      const { error } = await supabase.from("qa_posts").update({ is_revealed: !post.is_revealed }).eq("id", postId)
      if (error) {
        console.error("[v0] Error revealing answer:", error)
        throw error
      }
      toast.success(post.is_revealed ? "Answer hidden" : "Answer revealed")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error revealing answer:", error)
      toast.error("Failed to reveal answer")
    }
  }

  const handleDeleteYoutubeVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return
    try {
      const { error } = await supabase
        .from("youtube_videos")
        .update({
          is_archived: true,
        })
        .eq("id", videoId)
      if (error) {
        console.error("[v0] Error deleting video:", error)
        throw error
      }
      toast.success("Video deleted")
      loadChannelData()
    } catch (error) {
      console.error("[v0] Error deleting video:", error)
      toast.error("Failed to delete video")
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const needsFullWidthScroll = (content: string): boolean => {
    const hasMath =
      content.includes("\\(") ||
      content.includes("\\[") ||
      content.includes("$$") ||
      content.includes("∛") ||
      content.includes("√")
    const hasTable = content.includes("|") && content.split("\n").length > 2
    return hasMath || hasTable
  }

  const renderContentWithCode = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const matches = Array.from(content.matchAll(codeBlockRegex))
    if (matches.length > 0) {
      return (
        <div className="space-y-3">
          {content.split(codeBlockRegex).map((part, idx) => {
            if (idx % 3 === 0) {
              return part.trim() ? (
                <p key={idx} className="text-gray-700 text-sm break-words whitespace-pre-wrap">
                  {part}
                </p>
              ) : null
            } else if (idx % 3 === 1) {
              return null
            } else {
              const language =
                content.match(codeBlockRegex)?.[Math.floor(idx / 3)]?.match(/```(\w+)?/)?.[1] || "javascript"
              return <CodeBlockRenderer key={idx} code={part.trim()} language={language} />
            }
          })}
        </div>
      )
    }
    return renderContentWithMath(content)
  }

  const parseLinksFromContent = (content: string): SharedLink[] => {
    const linkRegex = /\[([^\]]+)\]$$([^)]+)$$/g
    const links: SharedLink[] = []
    let match
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({ title: match[1], url: match[2] })
    }
    return links
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading channel data...</div>
  }

  if (!channel) {
    return <div className="text-center py-8 text-red-600">Channel not found</div>
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FontSizeControl onFontSizeChange={setFontSize} initialSize={16} />
      <ChannelMenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="w-full py-2 space-y-3">
        {/* Channel Header */}
        <div className="border-b-2 border-blue-200 pb-2 w-full px-2 sm:px-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-blue-800">{channel.name}</h2>
            <p className="text-xs text-gray-600">{channel.description}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant="secondary" className="text-xs">
                {channel.category}
              </Badge>
              <Badge variant={channel.is_active ? "default" : "destructive"} className="text-xs">
                {channel.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {members.length} members
              </Badge>
            </div>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-2 w-full">
          {/* Feeds Tab */}
          <TabsContent value="feeds" className="space-y-2 w-full px-2 sm:px-3">
            <div className="flex gap-1 w-full">
              <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                    <Plus className="h-3 w-3 mr-1" />
                    Create Lesson
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto w-full">
                  <DialogHeader>
                    <DialogTitle className="text-base">Create Lesson Post</DialogTitle>
                    <DialogDescription className="text-xs">Share a lesson with your channel members</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-3">
                    <div className="grid gap-1">
                      <Label htmlFor="post-type" className="text-xs">
                        Post Type
                      </Label>
                      <Select
                        value={postForm.post_type}
                        onValueChange={(val) => setPostForm({ ...postForm, post_type: val as any })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson">Lesson</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="resource">Resource</SelectItem>
                          <SelectItem value="discussion">Discussion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="post-title" className="text-xs">
                        Title
                      </Label>
                      <Input
                        id="post-title"
                        value={postForm.title}
                        onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                        placeholder="Lesson title"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="post-content" className="text-xs">
                        Content
                      </Label>
                      <Textarea
                        id="post-content"
                        value={postForm.content}
                        onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                        placeholder="Lesson content"
                        rows={4}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreatePost} className="bg-blue-600 hover:bg-blue-700 w-full text-xs h-8">
                      Create Post
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={handleClearChat} variant="destructive" className="flex-1 text-xs h-8">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Chat
              </Button>
            </div>
            <div className="space-y-2 w-full">
              <h3 className="font-semibold text-blue-800 text-sm">Latest Channel Feeds</h3>
              {posts.length === 0 &&
              messages.length === 0 &&
              videos.length === 0 &&
              youtubeVideos.length === 0 &&
              qaPosts.length === 0 ? (
                <div className="bg-blue-50 border-b-2 border-blue-200 rounded p-3 text-center text-blue-600 text-xs">
                  <FileText className="h-8 w-8 mx-auto mb-1 opacity-50" />
                  <p>No content yet. Create your first lesson post or share content!</p>
                </div>
              ) : (
                <div className="space-y-2 w-full">
                  {sortedContent.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="border-b-2 border-blue-200 pb-2 w-full">
                      {item.type === "post" ? (
                        <>
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-blue-800 break-words">{item.title}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.post_type} • {formatDateTime(item.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {item.post_type}
                              </Badge>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePost(item.id)}
                                disabled={deletingPostId === item.id}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePermanentlyDeletePost(item.id)}
                                disabled={permanentlyDeletingId === item.id}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <ContentRenderer content={item.content} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 mt-2 border-t border-gray-200">
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-2.5 w-2.5" />
                              {item.view_count || 0} views
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {item.comment_count || 0} comments
                            </span>
                          </div>
                        </>
                      ) : item.type === "message" ? (
                        <>
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-green-800 break-words">
                                {item.message_type === "deleted" ? "Deleted Message" : "Shared Content"}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.message_type} • {formatDateTime(item.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                {item.message_type}
                              </Badge>
                              {item.message_type !== "deleted" && (
                                <MessageActions
                                  messageId={item.id}
                                  onDelete={handleDeleteMessage}
                                  isLoading={deletingMessageId === item.id}
                                />
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePermanentlyDeleteMessage(item.id)}
                                disabled={permanentlyDeletingId === item.id}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <ContentRenderer content={item.content} />
                          </div>
                          {item.message_media && item.message_media.length > 0 && (
                            <div className="pt-2 mt-2 border-t border-gray-200 w-full">
                              {item.message_media[0]?.media_type === "image" && (
                                <ImageGalleryGrid
                                  images={item.message_media.map((m: any) => ({
                                    id: m.id,
                                    media_url: m.media_url,
                                    file_name: m.file_name,
                                    width: m.width,
                                    height: m.height,
                                  }))}
                                  onDelete={(mediaId) => handleDeleteMedia(item.id, mediaId)}
                                />
                              )}
                              {item.message_media[0]?.media_type === "audio" && (
                                <AudioPlayerWithWaveform
                                  audio={{
                                    id: item.message_media[0].id,
                                    media_url: item.message_media[0].media_url,
                                    file_name: item.message_media[0].file_name,
                                    duration: item.message_media[0].duration,
                                  }}
                                  onDelete={(mediaId) => handleDeleteMedia(item.id, mediaId)}
                                />
                              )}
                              {item.message_media[0]?.media_type === "document" && (
                                <div className="space-y-2 mt-2">
                                  {item.message_media.map((doc: any) => (
                                    <DocumentPreview
                                      key={doc.id}
                                      fileName={doc.file_name}
                                      fileType={doc.media_type}
                                      fileUrl={doc.media_url}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {item.message_type === "link" && (
                            <div className="space-y-1 mt-2">
                              {parseLinksFromContent(item.content).map((link, idx) => (
                                <LinkPreviewRenderer key={idx} url={link.url} title={link.title} />
                              ))}
                            </div>
                          )}
                        </>
                      ) : item.type === "video" ? (
                        <VideoPostDisplay
                          id={item.id}
                          title={item.title}
                          description={item.description}
                          videoType={item.video_type || "lesson"}
                          videoUrl={item.video_url}
                          thumbnailUrl={item.thumbnail_url}
                          duration={item.duration}
                          viewCount={item.view_count || 0}
                          likeCount={item.like_count || 0}
                          commentCount={item.comment_count || 0}
                          authorName={item.author_name}
                          createdAt={item.created_at}
                          isTeacher={true}
                          currentUserId={teacherId}
                          onDelete={handleDeleteVideo}
                          onPermanentDelete={handlePermanentlyDeleteVideo}
                        />
                      ) : item.type === "youtube" ? (
                        <YouTubeVideoDisplay
                          id={item.id}
                          title={item.title}
                          description={item.description}
                          youtubeVideoId={item.youtube_video_id}
                          viewCount={item.view_count}
                          likeCount={item.like_count}
                          commentCount={item.comment_count}
                          saveCount={item.save_count}
                          authorName={item.author_name}
                          userId={teacherId}
                          userName={teacherName}
                          onDelete={handleDeleteYoutubeVideo}
                        />
                      ) : item.type === "qa" ? (
                        <QAPostDisplay
                          id={item.id}
                          question={item.question}
                          questionFormat={item.question_format}
                          optionA={item.option_a}
                          optionAFormat={item.option_a_format}
                          optionB={item.option_b}
                          optionBFormat={item.option_b_format}
                          optionC={item.option_c}
                          optionCFormat={item.option_c_format}
                          optionD={item.option_d}
                          optionDFormat={item.option_d_format}
                          optionE={item.option_e}
                          optionEFormat={item.option_e_format}
                          correctAnswer={item.correct_answer}
                          explanation={item.explanation}
                          explanationFormat={item.explanation_format}
                          isRevealed={item.is_revealed}
                          authorName={item.author_name}
                          createdAt={item.created_at}
                          viewCount={item.view_count}
                          currentUserId={teacherId}
                          isTeacher={true}
                          onDelete={handleDeleteQAPost}
                          onReveal={handleRevealQAAnswer}
                          onPermanentDelete={handlePermanentlyDeleteQAPost}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 w-full px-2 sm:px-3">
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded p-2">
                <p className="text-xs font-medium text-blue-800">Members</p>
                <div className="text-lg font-bold text-blue-600">{members.length}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded p-2">
                <p className="text-xs font-medium text-amber-800">Pending</p>
                <div className="text-lg font-bold text-amber-600">{joinRequests.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded p-2">
                <p className="text-xs font-medium text-green-800">Capacity</p>
                <div className="text-lg font-bold text-green-600">{channel.max_members}</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 w-full">
                  <DetailedMathExampleModal />
                  <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 w-full">
                        <Plus className="h-3 w-3 mr-1" />
                        Share Content
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto w-full">
                      <DialogHeader>
                        <DialogTitle className="text-base">Share Content with Channel</DialogTitle>
                        <DialogDescription className="text-xs">
                          Share text, images, audio, documents, or links
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-3 w-full">
                        <div className="grid gap-1">
                          <Label htmlFor="content-type" className="text-xs">
                            Content Type
                          </Label>
                          <Select
                            value={mediaForm.type}
                            onValueChange={(val) => {
                              setMediaForm({
                                type: val as any,
                                title: "",
                                content: "",
                                selectedImages: [],
                                selectedAudio: null,
                                selectedDocuments: [],
                                selectedLinks: [],
                              })
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="image">Images</SelectItem>
                              <SelectItem value="audio">Audio Note</SelectItem>
                              <SelectItem value="document">Documents</SelectItem>
                              <SelectItem value="link">Links</SelectItem>
                              <SelectItem value="video">Videos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1">
                          <Label htmlFor="title" className="text-xs">
                            Title
                          </Label>
                          <Input
                            id="title"
                            value={mediaForm.title}
                            onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                            placeholder="Content title"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label htmlFor="content" className="text-xs">
                            Description
                          </Label>
                          <Textarea
                            id="content"
                            value={mediaForm.content}
                            onChange={(e) => setMediaForm({ ...mediaForm, content: e.target.value })}
                            placeholder="Content description"
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded space-y-2">
                          <p className="font-semibold text-blue-900 text-xs">📝 How to Format:</p>
                          <div className="space-y-1 text-xs text-blue-800">
                            <div>
                              <p className="font-medium">Math: $$x^2 + y^2 = z^2$$</p>
                              <p className="font-medium">Tables: | Header | Header |</p>
                              <p className="font-medium">Code: \`\`\`javascript code \`\`\`</p>
                            </div>
                          </div>
                        </div>
                        {mediaForm.type === "image" && (
                          <ImagePicker
                            onImagesSelected={(images) => setMediaForm({ ...mediaForm, selectedImages: images })}
                            maxImages={10}
                            disabled={isUploadingMedia}
                          />
                        )}
                        {mediaForm.type === "audio" && (
                          <div className="space-y-2">
                            <AudioRecorder
                              onAudioRecorded={(audio) => setMediaForm({ ...mediaForm, selectedAudio: audio })}
                              disabled={isUploadingMedia}
                            />
                            {mediaForm.selectedAudio && (
                              <AudioPreviewPlayer
                                audioBlob={mediaForm.selectedAudio}
                                onClear={() => setMediaForm({ ...mediaForm, selectedAudio: null })}
                              />
                            )}
                          </div>
                        )}
                        {mediaForm.type === "document" && (
                          <DocumentUploader
                            onDocumentsSelected={(docs) => setMediaForm({ ...mediaForm, selectedDocuments: docs })}
                            maxDocuments={5}
                            disabled={isUploadingMedia}
                          />
                        )}
                        {mediaForm.type === "link" && (
                          <LinkSharer
                            onLinksSelected={(links) => setMediaForm({ ...mediaForm, selectedLinks: links })}
                            maxLinks={5}
                            disabled={isUploadingMedia}
                          />
                        )}
                        {mediaForm.type === "video" && (
                          <VideoPostCreator
                            channelId={channelId}
                            teacherId={teacherId}
                            teacherName={teacherName}
                            onVideoCreated={(videoData) => {
                              setMediaForm({
                                ...mediaForm,
                                selectedAudio: videoData.videoFile, // Store the video file and duration
                              })
                            }}
                            isDialogMode={true} // Indicate this is for dialog upload
                          />
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleCreateMediaMessage}
                          disabled={isUploadingMedia}
                          className="bg-blue-600 hover:bg-blue-700 w-full text-xs h-8"
                        >
                          {isUploadingMedia ? "Uploading..." : "Share Content"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="bg-white rounded p-2 space-y-1 text-xs text-gray-700">
                <p>✅ Share lessons, announcements, resources</p>
                <p>✅ Upload images, audio, documents, links</p>
                <p>✅ Use LaTeX for math formulas</p>
              </div>
            </div>
            {/* YouTube Video Section */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-red-800">YouTube Videos</h3>
              </div>
              <YouTubeVideoCreator
                channelId={channelId}
                teacherId={teacherId}
                teacherName={teacherName}
                onVideoCreated={loadChannelData}
              />
              <div className="bg-white rounded p-2 space-y-1 text-xs text-gray-700">
                <p>✅ Share educational YouTube videos</p>
                <p>✅ Members can like, comment, and save</p>
                <p>✅ Full-screen preview mode available</p>
              </div>
            </div>
          </TabsContent>
          {/* Members Tab */}
          <TabsContent value="members" className="space-y-2 w-full px-2 sm:px-3">
            <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2 text-xs h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Member Directly
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-base">Add Member to Channel</DialogTitle>
                  <DialogDescription className="text-xs">Add an agent directly to this channel</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-3">
                  {/* Agent Input */}
                  <div className="grid gap-1">
                    <Label htmlFor="agent-id" className="text-xs">
                      Agent Name or Contact Number
                    </Label>
                    <Input
                      id="agent-id"
                      value={addMemberForm.agentId}
                      onChange={(e) => setAddMemberForm({ ...addMemberForm, agentId: e.target.value })}
                      placeholder="Enter agent name or phone"
                      autoComplete="off"
                      className="h-8 text-xs"
                    />
                    <p className="text-xs text-gray-500">Search by name or phone number</p>
                  </div>

                  {/* Role Select */}
                  <div className="grid gap-1">
                    <Label htmlFor="member-role" className="text-xs">
                      Role
                    </Label>
                    <Select
                      value={addMemberForm.role}
                      onValueChange={(val) => setAddMemberForm({ ...addMemberForm, role: val as any })}
                    >
                      <SelectTrigger className="h-8 text-xs">
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddMemberDialog(false)
                      setAddMemberForm({ agentId: "", role: "member" })
                    }}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAddMemberDirectly}
                    className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                  >
                    Add Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Members List */}
            {members.length === 0 ? (
              <div className="bg-blue-50 border-b-2 border-blue-200 rounded p-3 text-center text-blue-600 text-xs">
                <Users className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              <div className="space-y-1 w-full">
                {members.map((member) => (
                  <div key={member.id} className="border-b border-gray-200 pb-2 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{member.agent_name}</p>
                        <p className="text-xs text-gray-600">
                          {member.agent_contact ? `📞 ${member.agent_contact}` : "No contact"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-2 w-full px-2 sm:px-3">
            {joinRequests.length === 0 ? (
              <div className="bg-green-50 border-b-2 border-green-200 rounded p-3 text-center text-green-600 text-xs">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-1 w-full">
                {joinRequests.map((request) => (
                  <div key={request.id} className="border-b-2 border-amber-200 bg-amber-50 p-2 rounded w-full">
                    <div className="space-y-1">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{request.agent_name}</p>
                        <p className="text-xs text-gray-600">
                          {request.agent_contact ? `📞 ${request.agent_contact}` : "No contact"}
                        </p>
                      </div>
                      {request.request_message && (
                        <p className="text-xs text-gray-700 bg-white p-1 rounded border border-amber-200">
                          "{request.request_message}"
                        </p>
                      )}
                      <div className="text-xs text-gray-600 bg-white p-1 rounded border border-amber-100">
                        <p className="font-medium mb-0.5">When approved, they will be added as a Member</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          <li>Can view and comment on posts</li>
                          <li>Can react to content</li>
                        </ul>
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id, request.agent_id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectRequest(request.id)}
                          className="flex-1 text-xs h-7"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          {/* Lesson Notes Tab */}
          <TabsContent value="lesson-notes" className="space-y-2 w-full px-2 sm:px-3">
            <LessonNotesManager
              channelId={channelId}
              teacherId={teacherId}
              teacherName={teacherName}
              onNotesUpdated={loadChannelData}
            />
          </TabsContent>
          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-2 w-full px-2 sm:px-3">
            <VideoPostCreator
              channelId={channelId}
              teacherId={teacherId}
              teacherName={teacherName}
              onVideoCreated={loadChannelData}
            />
            <div className="space-y-2 w-full">
              <h3 className="font-semibold text-purple-800 text-sm">Channel Videos</h3>
              {videos.length === 0 ? (
                <div className="bg-purple-50 border-b-2 border-purple-200 rounded p-3 text-center text-purple-600 text-xs">
                  <Play className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No videos yet. Post your first educational video!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                  {videos.map((video) => (
                    <VideoPostDisplay
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      description={video.description}
                      videoType={video.video_type}
                      videoUrl={video.video_url}
                      thumbnailUrl={video.thumbnail_url}
                      duration={video.duration}
                      viewCount={video.view_count || 0}
                      likeCount={video.like_count || 0}
                      commentCount={video.comment_count || 0}
                      authorName={video.author_name}
                      createdAt={video.created_at}
                      isTeacher={true}
                      currentUserId={teacherId}
                      onDelete={handleDeleteVideo}
                      onPermanentDelete={handlePermanentlyDeleteVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          {/* Q&A Tab */}
          <TabsContent value="qa" className="space-y-2 w-full px-2 sm:px-3">
            <QAPostCreator
              channelId={channelId}
              teacherId={teacherId}
              teacherName={teacherName}
              onPostCreated={loadChannelData}
            />
            <div className="space-y-2 w-full">
              <h3 className="font-semibold text-purple-800 text-sm">Q&A Posts</h3>
              {qaPosts.length === 0 ? (
                <div className="bg-purple-50 border-b-2 border-purple-200 rounded p-3 text-center text-purple-600 text-xs">
                  <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No Q&A posts yet. Create your first question!</p>
                </div>
              ) : (
                <div className="space-y-2 w-full">
                  {[...qaPosts].reverse().map((post) => (
                    <QAPostDisplay
                      key={post.id}
                      id={post.id}
                      question={post.question}
                      questionFormat={post.question_format}
                      optionA={post.option_a}
                      optionAFormat={post.option_a_format}
                      optionB={post.option_b}
                      optionBFormat={post.option_b_format}
                      optionC={post.option_c}
                      optionCFormat={post.option_c_format}
                      optionD={post.option_d}
                      optionDFormat={post.option_d_format}
                      optionE={post.option_e}
                      optionEFormat={post.option_e_format}
                      correctAnswer={post.correct_answer}
                      explanation={post.explanation}
                      explanationFormat={post.explanation_format}
                      isRevealed={post.is_revealed}
                      authorName={post.author_name}
                      createdAt={post.created_at}
                      viewCount={post.view_count}
                      currentUserId={teacherId}
                      isTeacher={true}
                      onDelete={handleDeleteQAPost}
                      onReveal={handleRevealQAAnswer}
                      onPermanentDelete={handlePermanentlyDeleteQAPost}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          {/* YouTube Videos Tab */}
          <TabsContent value="youtube-videos" className="space-y-2 w-full px-2 sm:px-3">
            <YouTubeVideoCreator
              channelId={channelId}
              teacherId={teacherId}
              teacherName={teacherName}
              onVideoCreated={loadChannelData}
            />
            <div className="space-y-2 w-full">
              <h3 className="font-semibold text-red-800 text-sm">Channel YouTube Videos</h3>
              {youtubeVideos.length === 0 ? (
                <div className="bg-red-50 border-b-2 border-red-200 rounded p-3 text-center text-red-600 text-xs">
                  <p>No YouTube videos yet. Post your first educational video!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                  {youtubeVideos.map((video) => (
                    <YouTubeVideoDisplay
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      description={video.description}
                      youtubeVideoId={video.youtube_video_id}
                      viewCount={video.view_count}
                      likeCount={video.like_count}
                      commentCount={video.comment_count}
                      saveCount={video.save_count}
                      authorName={video.author_name}
                      userId={teacherId}
                      userName={teacherName}
                      onDelete={handleDeleteYoutubeVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-2 w-full px-2 sm:px-3">
            <ChannelSubscriptionManager channelId={channelId} />
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog
        open={!!deleteConfirmId && deleteConfirmType === "post"}
        onOpenChange={(open) => !open && (setDeleteConfirmId(null), setDeleteConfirmType(null))}
      >
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              This post will be deleted but can be recovered. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && confirmDeletePost(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteConfirmId && deleteConfirmType === "member"}
        onOpenChange={(open) => !open && (setDeleteConfirmId(null), setDeleteConfirmType(null))}
      >
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Remove Member</AlertDialogTitle>
            <AlertDialogDescription>This member will be removed from the channel.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && confirmRemoveMember(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteConfirmId && deleteConfirmType === "message"}
        onOpenChange={(open) => !open && (setDeleteConfirmId(null), setDeleteConfirmType(null))}
      >
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Message</AlertDialogTitle>
            <AlertDialogDescription>This message will be deleted. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && confirmDeleteMessage(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
