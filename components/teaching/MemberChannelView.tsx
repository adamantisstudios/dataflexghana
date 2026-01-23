"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Eye, MessageSquare, Heart, Share2, Bookmark } from 'lucide-react'
import { ContentRenderer } from "./media/ContentRenderer"
import { CommentThread } from "./CommentThread"
import { FontSizeControl } from "./FontSizeControl"
import { QAPostDisplay } from "./qa"
import { YouTubeVideoDisplay } from "./youtube/YouTubeVideoDisplay"

interface Channel {
  id: string
  name: string
  description: string
  category: string
  is_active: boolean
  image_url?: string // Added image_url field
  created_at: string
}

interface ChannelPost {
  id: string
  channel_id: string
  author_id: string
  author_name: string
  title: string
  content: string
  post_type: "lesson" | "announcement" | "resource" | "discussion"
  is_pinned: boolean
  is_archived: boolean
  created_at: string
  view_count?: number
  comment_count?: number
}

interface MemberChannelViewProps {
  channelId: string
  memberId: string
  memberName: string
}

export function MemberChannelView({ channelId, memberId, memberName }: MemberChannelViewProps) {
  const [activeTab, setActiveTab] = useState<"feeds" | "saved">("feeds")
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [channel, setChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<ChannelPost[]>([])
  const [qaPosts, setQAPosts] = useState<any[]>([])
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadChannelData()
    loadSavedPosts()
    // Load data once on mount, not repeatedly
  }, [channelId])

  const loadChannelData = async () => {
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

      const { data: qaPostsData, error: qaError } = await supabase
        .from("qa_posts")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      if (qaError) {
        console.error("[v0] Error loading Q&A posts:", qaError)
      } else {
        setQAPosts(qaPostsData || [])
      }

      const { data: youtubeData, error: youtubeError } = await supabase
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })

      if (youtubeError) {
        console.error("[v0] Error loading YouTube videos:", youtubeError)
      } else {
        setYoutubeVideos(youtubeData || [])
      }

      const { data: likesData } = await supabase.from("post_likes").select("post_id").eq("user_id", memberId)

      if (likesData) {
        setLikedPosts(new Set(likesData.map((l) => l.post_id)))
      }
    } catch (error) {
      console.error("[v0] Error loading channel data:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const loadSavedPosts = async () => {
    try {
      const { data } = await supabase
        .from("saved_posts")
        .select("post_id, qa_post_id")
        .eq("user_id", memberId)
        .eq("channel_id", channelId)

      if (data) {
        const postIds = data.map((s) => s.post_id || s.qa_post_id).filter(Boolean)
        setSavedPosts(new Set(postIds))
      }
    } catch (error) {
      console.error("[v0] Error loading saved posts:", error)
    }
  }

  const handleSavePost = async (postId: string, isQAPost = false) => {
    try {
      const isSaved = savedPosts.has(postId)

      const response = await fetch("/api/teaching/save-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": memberId,
          "x-channel-id": channelId,
        },
        body: JSON.stringify({
          action: isSaved ? "unsave" : "save",
          postId: isQAPost ? undefined : postId,
          qaPostId: isQAPost ? postId : undefined,
          postType: isQAPost ? "qa" : "regular",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save post")
      }

      const newSaved = new Set(savedPosts)
      if (isSaved) {
        newSaved.delete(postId)
        toast.success("Post unsaved")
      } else {
        newSaved.add(postId)
        toast.success("Post saved")
      }
      setSavedPosts(newSaved)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] Error toggling save:", errorMessage)
      toast.error(errorMessage || "Failed to save post")
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const isLiked = likedPosts.has(postId)

      if (isLiked) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", memberId)

        if (error) throw error

        const newLiked = new Set(likedPosts)
        newLiked.delete(postId)
        setLikedPosts(newLiked)
      } else {
        const { error } = await supabase.from("post_likes").insert([
          {
            post_id: postId,
            user_id: memberId,
          },
        ])

        if (error) throw error

        const newLiked = new Set(likedPosts)
        newLiked.add(postId)
        setLikedPosts(newLiked)
      }
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
      toast.error("Failed to update like")
    }
  }

  const handleSharePost = async (post: ChannelPost) => {
    try {
      const shareText = `Check out this post: "${post.title}" from ${channel?.name}`
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: shareText,
          url: window.location.href,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${post.title}\n${window.location.href}`)
        toast.success("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("[v0] Error sharing post:", error)
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
      hour12: true,
    })
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading channel...</div>
  }

  if (!channel) {
    return <div className="text-center py-8 text-red-600">Channel not found</div>
  }

  return (
    <div className="w-full min-h-screen bg-white" style={{ fontSize: `${fontSize}px` }}>
      <FontSizeControl onFontSizeChange={setFontSize} initialSize={16} />

      <div className="w-full py-6">
        {channel?.image_url && (
          <div className="w-full mb-4 px-4 sm:px-6 lg:px-8">
            <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100 shadow-md border-4 border-white">
              <img
                src={channel.image_url || "/placeholder.svg"}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Channel Header */}
        <div className="border-b-2 border-blue-200 pb-4 w-full mb-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-blue-800">{channel.name}</h2>
            <p className="text-sm text-gray-600">{channel.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">{channel.category}</Badge>
              <Badge variant={channel.is_active ? "default" : "destructive"}>
                {channel.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-2 px-4 sm:px-6 lg:px-8">
            <TabsTrigger value="feeds">Feeds</TabsTrigger>
            <TabsTrigger value="saved">Saved Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="feeds" className="space-y-4 w-full px-4 sm:px-6 lg:px-8">
            {posts.length === 0 && qaPosts.length === 0 && youtubeVideos.length === 0 ? (
              <div className="bg-blue-50 border-b-2 border-blue-200 rounded p-6 text-center text-blue-600">
                <p>No posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {(() => {
                  const allContent = [
                    ...youtubeVideos.map((v) => ({
                      ...v,
                      type: "youtube",
                      timestamp: new Date(v.created_at).getTime(),
                    })),
                    ...posts.map((p) => ({ ...p, type: "post", timestamp: new Date(p.created_at).getTime() })),
                    ...qaPosts.map((q) => ({ ...q, type: "qa", timestamp: new Date(q.created_at).getTime() })),
                  ].sort((a, b) => b.timestamp - a.timestamp)

                  return allContent.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="border-b-2 pb-4 w-full">
                      {/* YouTube Videos */}
                      {item.type === "youtube" && (
                        <div className="border-b-2 border-red-200 pb-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-red-800 break-words">{item.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Video • {formatDateTime(item.created_at)} • By {item.author_name}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              Video
                            </Badge>
                          </div>
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
                            userId={memberId}
                            userName={memberName}
                          />
                        </div>
                      )}

                      {/* Regular Posts */}
                      {item.type === "post" && (
                        <div className="border-b-2 border-blue-200 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-blue-800 break-words">{item.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.post_type} • {formatDateTime(item.created_at)}
                              </p>
                            </div>
                            <Badge variant="secondary">{item.post_type}</Badge>
                          </div>

                          <div className="mt-3">
                            <ContentRenderer content={item.content} />
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-600 pt-3 mt-3 border-t border-gray-200">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {item.view_count || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {item.comment_count || 0} comments
                            </span>
                          </div>

                          <div className="flex gap-2 pt-3 mt-3 border-t border-gray-200 flex-wrap">
                            <Button
                              size="sm"
                              variant={likedPosts.has(item.id) ? "default" : "outline"}
                              onClick={() => handleLikePost(item.id)}
                              className="flex-1 gap-2 min-w-[100px]"
                            >
                              <Heart className={`h-4 w-4 ${likedPosts.has(item.id) ? "fill-current" : ""}`} />
                              Like
                            </Button>
                            <Button
                              size="sm"
                              variant={savedPosts.has(item.id) ? "default" : "outline"}
                              onClick={() => handleSavePost(item.id, false)}
                              className="flex-1 gap-2 min-w-[100px]"
                            >
                              <Bookmark className={`h-4 w-4 ${savedPosts.has(item.id) ? "fill-current" : ""}`} />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newExpanded = new Set(expandedComments)
                                if (newExpanded.has(item.id)) {
                                  newExpanded.delete(item.id)
                                } else {
                                  newExpanded.add(item.id)
                                }
                                setExpandedComments(newExpanded)
                              }}
                              className="flex-1 gap-2 min-w-[100px]"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Comment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSharePost(item)}
                              className="flex-1 gap-2 min-w-[100px]"
                            >
                              <Share2 className="h-4 w-4" />
                              Share
                            </Button>
                          </div>

                          {expandedComments.has(item.id) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <CommentThread
                                postId={item.id}
                                channelId={channelId}
                                currentUserId={memberId}
                                currentUserName={memberName}
                                isMember={true}
                                isTeacher={false}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Q&A Posts */}
                      {item.type === "qa" && (
                        <div className="border-b-2 border-purple-200 pb-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-purple-800 break-words">Q&A Question</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Q&A • {formatDateTime(item.created_at)} • By {item.author_name}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              Q&A
                            </Badge>
                          </div>
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
                            currentUserId={memberId}
                            isTeacher={false}
                            onDelete={() => {}}
                            onReveal={() => {}}
                          />
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <CommentThread
                              postId={item.id}
                              channelId={channelId}
                              currentUserId={memberId}
                              currentUserName={memberName}
                              isMember={true}
                              isTeacher={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                })()}
              </div>
            )}
          </TabsContent>

          {/* Saved Posts Tab */}
          <TabsContent value="saved" className="space-y-4 w-full px-4 sm:px-6 lg:px-8">
            {savedPosts.size === 0 ? (
              <div className="bg-amber-50 border-b-2 border-amber-200 rounded p-6 text-center text-amber-600">
                <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No saved posts yet. Save posts to view them here!</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {posts
                  .filter((post) => savedPosts.has(post.id))
                  .reverse()
                  .map((post) => (
                    <div key={post.id} className="border-b-2 border-amber-200 pb-4 w-full bg-amber-50 p-4 rounded">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-amber-800 break-words">{post.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {post.post_type} • {formatDateTime(post.created_at)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          {post.post_type}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <ContentRenderer content={post.content} />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 pt-3 mt-3 border-t border-amber-200">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.view_count || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comment_count || 0} comments
                        </span>
                      </div>

                      <div className="flex gap-2 pt-3 mt-3 border-t border-amber-200 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSavePost(post.id, false)}
                          className="flex-1 gap-2 min-w-[100px] text-amber-600 border-amber-300"
                        >
                          <Bookmark className="h-4 w-4 fill-current" />
                          Unsave
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSharePost(post)}
                          className="flex-1 gap-2 min-w-[100px]"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
