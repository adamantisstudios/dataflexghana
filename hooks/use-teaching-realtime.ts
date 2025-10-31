"use client"

import { useEffect } from "react"
import { realtimeManager } from "@/lib/teaching-platform-realtime"

/**
 * Hook for real-time channel updates
 */
export function useChannelRealtime(channelId: string, onUpdate: (data: any) => void) {
  useEffect(() => {
    realtimeManager.subscribeToChannel(channelId, onUpdate)

    return () => {
      realtimeManager.unsubscribeFromChannel(channelId)
    }
  }, [channelId, onUpdate])
}

/**
 * Hook for real-time post comments
 */
export function usePostCommentsRealtime(postId: string, onUpdate: (data: any) => void) {
  useEffect(() => {
    realtimeManager.subscribeToPostComments(postId, onUpdate)

    return () => {
      realtimeManager.unsubscribeFromPostComments(postId)
    }
  }, [postId, onUpdate])
}

/**
 * Hook for real-time join requests
 */
export function useJoinRequestsRealtime(channelId: string, onUpdate: (data: any) => void) {
  useEffect(() => {
    realtimeManager.subscribeToJoinRequests(channelId, onUpdate)

    return () => {
      realtimeManager.unsubscribeFromChannel(channelId)
    }
  }, [channelId, onUpdate])
}
