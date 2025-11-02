"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface UnreadCounts {
  [referralId: string]: number
}

export function useUnreadMessages(userId: string, userType: "agent" | "admin") {
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({})
  const [loading, setLoading] = useState(true)

  const loadUnreadCounts = async () => {
    if (!userId) return

    try {
      // Get all referrals for this user
      let referralsQuery
      if (userType === "agent") {
        referralsQuery = supabase.from("referrals").select("id").eq("agent_id", userId)
      } else {
        referralsQuery = supabase.from("referrals").select("id")
      }

      const { data: referrals } = await referralsQuery

      if (!referrals) return

      // Get unread message counts for each referral
      const counts: UnreadCounts = {}
      let totalUnread = 0

      for (const referral of referrals) {
        const { data: messages } = await supabase
          .from("messages")
          .select("id")
          .eq("referral_id", referral.id)
          .eq("is_read", false)
          .neq("sender_type", userType) // Don't count our own messages as unread

        const count = messages?.length || 0
        counts[referral.id] = count
        totalUnread += count
      }

      setUnreadCounts(counts)
      setUnreadCount(totalUnread)
    } catch (error) {
      console.error("Error loading unread counts:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (referralId: string) => {
    try {
      // Mark all messages in this referral as read for this user type
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("referral_id", referralId)
        .neq("sender_type", userType)

      // Update local state
      setUnreadCounts((prev) => ({
        ...prev,
        [referralId]: 0,
      }))

      setUnreadCount((prev) => prev - (unreadCounts[referralId] || 0))
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const getUnreadCount = (referralId: string) => {
    return unreadCounts[referralId] || 0
  }

  useEffect(() => {
    loadUnreadCounts()

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as any
          // Only count if it's not from the current user type
          if (newMessage.sender_type !== userType) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMessage.referral_id]: (prev[newMessage.referral_id] || 0) + 1,
            }))
            setUnreadCount((prev) => prev + 1)
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, userType])

  return {
    unreadCount,
    unreadCounts,
    markAsRead,
    getUnreadCount,
    loading,
    refreshCounts: loadUnreadCounts,
  }
}
