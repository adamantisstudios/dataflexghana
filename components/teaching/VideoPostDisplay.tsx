"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Eye, MessageSquare, ThumbsUp, MoreVertical, Download, Share2 } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoPostDisplayProps {
  id: string;
  title: string;
  description: string;
  videoType?: "lesson" | "tutorial" | "announcement" | "discussion";
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  authorName: string;
  createdAt: string;
  isTeacher: boolean;
  currentUserId: string;
  onDelete?: (videoId: string) => void;
  onPermanentDelete?: (videoId: string) => void;
  onVideoDeleted?: (videoId: string) => void;
}

export function VideoPostDisplay({
  id,
  title,
  description,
  videoType = "lesson",
  videoUrl,
  thumbnailUrl,
  duration,
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  authorName,
  createdAt,
  isTeacher,
  currentUserId,
  onDelete,
  onPermanentDelete,
  onVideoDeleted,
}: VideoPostDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likeCount);
  const [videoError, setVideoError] = useState<string | null>(null);

  const validVideoUrl = videoUrl && videoUrl.trim() !== '' ? videoUrl : null;
  const validThumbnailUrl = thumbnailUrl && thumbnailUrl.trim() !== '' ? thumbnailUrl : null;

  useEffect(() => {
    const incrementViews = async () => {
      try {
        const { data } = await supabase
          .from("videos")
          .select("view_count")
          .eq("id", id)
          .single();

        if (data) {
          await supabase
            .from("videos")
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq("id", id);
        }
      } catch (err) {
        console.warn("[v0] Could not increment view count:", err);
      }
    };

    if (isPlaying) {
      incrementViews();
    }
  }, [isPlaying, id]);

  useEffect(() => {
    loadComments();
  }, [id]);

  const loadComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("video_comments")
        .select("*")
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      if (!error) {
        setComments(data || []);
      }
    } catch (err) {
      console.warn("[v0] Failed to load comments:", err);
    }
  }, [id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateMetadata = () => {
      if (video.duration) {
        setCurrentTime(0);
      }
    };

    const updateTime = () => {
      setCurrentTime(video.currentTime);
    };

    const handleError = () => {
      setVideoError("Unable to load video. Please try again later.");
    };

    video.addEventListener("loadedmetadata", updateMetadata);
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("play", () => setIsPlaying(true));
    video.addEventListener("pause", () => setIsPlaying(false));
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", updateMetadata);
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("play", () => setIsPlaying(true));
      video.removeEventListener("pause", () => setIsPlaying(false));
      video.removeEventListener("error", handleError);
    };
  }, []);


  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleLike = async () => {
    try {
      const newLikeCount = isLiked ? currentLikes - 1 : currentLikes + 1;
      setIsLiked(!isLiked);
      setCurrentLikes(newLikeCount);

      await supabase
        .from("videos")
        .update({ like_count: newLikeCount })
        .eq("id", id);
    } catch (err) {
      console.error("[v0] Error updating likes:", err);
      setIsLiked(isLiked);
      setCurrentLikes(isLiked ? currentLikes + 1 : currentLikes - 1);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setIsPostingComment(true);

      const { data, error } = await supabase
        .from("video_comments")
        .insert({
          video_id: id,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNewComment("");
      setComments([data, ...comments]);

      await supabase
        .from("videos")
        .update({ comment_count: (commentCount || 0) + 1 })
        .eq("id", id);

      toast.success("Comment posted!");
    } catch (err: any) {
      console.error("[v0] Error posting comment:", err);
      toast.error(err.message || "Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("videos")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Video deleted successfully.");
      onDelete?.(id);
      onVideoDeleted?.(id);
    } catch (err: any) {
      console.error("[v0] Error soft deleting video:", err);
      toast.error(err.message || "Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this video? This cannot be undone.")) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase.from("videos").delete().eq("id", id);

      if (error) throw error;

      toast.success("Video permanently deleted.");
      onPermanentDelete?.(id);
      onVideoDeleted?.(id);
    } catch (err: any) {
      console.error("[v0] Error permanently deleting video:", err);
      toast.error(err.message || "Failed to permanently delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.warn("[v0] Share failed:", err);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!validVideoUrl) {
    return (
      <Card className="border-red-200 overflow-hidden">
        <CardContent className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 font-semibold mb-2">Video Unavailable</p>
            <p className="text-sm text-red-500">{title}</p>
            <p className="text-xs text-red-400 mt-2">The video file could not be loaded.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Video Container - Vertical Aspect Ratio 9:16 */}
        <div className="relative bg-black w-full max-w-xs mx-auto aspect-[9/16] rounded-lg overflow-hidden group">
          {videoError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
              <p className="text-sm font-semibold mb-2">Unable to Play Video</p>
              <p className="text-xs text-gray-400">{videoError}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={validVideoUrl}
              poster={validThumbnailUrl || undefined}
              className="w-full h-full object-cover"
              playsInline
              controls={false}
              preload="metadata"
            />
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 w-full h-full cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            />

            {/* Play/Pause Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button
                disabled
                className="bg-white/80 rounded-full p-3"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(duration)}
            </div>

            {/* Delete Button (Teacher Only) */}
            {isTeacher && (
              <div className="absolute top-2 right-2 flex gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      title="Options"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Soft Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handlePermanentDelete}
                      disabled={isDeleting}
                      className="text-red-800"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Video Progress Bar */}
          {!videoError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-400 rounded cursor-pointer accent-purple-600"
                title="Seek video"
              />
              <div className="flex justify-between items-center text-white text-xs px-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-3 space-y-2">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900 break-words line-clamp-2">{title}</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              By {authorName} • {formatDateTime(createdAt)}
            </p>

            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                {videoType}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-gray-700 line-clamp-2">{description}</p>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-200">
            <span className="flex items-center gap-1 hover:text-purple-600 transition-colors">
              <Eye className="h-3 w-3" />
              <span className="font-medium">{viewCount}</span>
            </span>
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
            >
              <ThumbsUp className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{currentLikes}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              <span className="font-medium">{comments.length}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Share2 className="h-3 w-3" />
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="pt-3 border-t border-gray-200 space-y-3">
              {/* Comment Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                    placeholder="Share your thoughts..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isPostingComment}
                  />
                  <Button
                    onClick={handlePostComment}
                    disabled={isPostingComment || !newComment.trim()}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3"
                  >
                    {isPostingComment ? "..." : "Send"}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {comment.user_name || comment.user_id || "Anonymous"}
                          </p>
                          <p className="text-sm text-gray-700 mt-1 break-words">{comment.content}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : "Just now"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
