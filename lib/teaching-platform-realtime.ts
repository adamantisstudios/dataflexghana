import { supabase } from "@/lib/supabase"

/**
 * Real-time subscription manager for teaching platform
 * Handles live updates for channels, posts, and comments
 */

export class TeachingPlatformRealtimeManager {
  private subscriptions: Map<string, any> = new Map()

  /**
   * Subscribe to channel updates (new posts, member changes)
   */
  subscribeToChannel(channelId: string, onUpdate: (data: any) => void) {
    const key = `channel-${channelId}`

    if (this.subscriptions.has(key)) {
      return
    }

    const subscription = supabase
      .channel(`channel:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_posts",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onUpdate({ type: "post", data: payload })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_members",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onUpdate({ type: "member", data: payload })
        },
      )
      .subscribe()

    this.subscriptions.set(key, subscription)
  }

  /**
   * Subscribe to post comments in real-time
   */
  subscribeToPostComments(postId: string, onUpdate: (data: any) => void) {
    const key = `post-comments-${postId}`

    if (this.subscriptions.has(key)) {
      return
    }

    const subscription = supabase
      .channel(`post:${postId}:comments`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          onUpdate({ type: "comment", data: payload })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_reactions",
          filter: `comment_id=in.(SELECT id FROM post_comments WHERE post_id=${postId})`,
        },
        (payload) => {
          onUpdate({ type: "reaction", data: payload })
        },
      )
      .subscribe()

    this.subscriptions.set(key, subscription)
  }

  /**
   * Subscribe to join request updates
   */
  subscribeToJoinRequests(channelId: string, onUpdate: (data: any) => void) {
    const key = `join-requests-${channelId}`

    if (this.subscriptions.has(key)) {
      return
    }

    const subscription = supabase
      .channel(`channel:${channelId}:requests`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_join_requests",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onUpdate({ type: "request", data: payload })
        },
      )
      .subscribe()

    this.subscriptions.set(key, subscription)
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribeFromChannel(channelId: string) {
    const key = `channel-${channelId}`
    const subscription = this.subscriptions.get(key)

    if (subscription) {
      supabase.removeChannel(subscription)
      this.subscriptions.delete(key)
    }
  }

  /**
   * Unsubscribe from post comments
   */
  unsubscribeFromPostComments(postId: string) {
    const key = `post-comments-${postId}`
    const subscription = this.subscriptions.get(key)

    if (subscription) {
      supabase.removeChannel(subscription)
      this.subscriptions.delete(key)
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription)
    })
    this.subscriptions.clear()
  }
}

// Singleton instance
export const realtimeManager = new TeachingPlatformRealtimeManager()
