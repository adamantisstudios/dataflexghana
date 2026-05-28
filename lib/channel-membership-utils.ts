import { supabase } from "@/lib/supabase-client"
import { ensureChannelMemberActive, hasActiveChannelSubscription } from "@/lib/ensure-channel-member-active"

/**
 * Diagnostic logging for channel membership issues
 */
export const logMembershipDiagnostic = (message: string, data?: unknown) => {
  console.log(`[v0] MEMBERSHIP_DIAGNOSTIC: ${message}`, data || "")
}

async function tryActivateMembershipFromSubscription(
  channelId: string,
  agentId: string,
  membershipId: string,
): Promise<boolean> {
  const hasSub = await hasActiveChannelSubscription(supabase, channelId, agentId)
  if (!hasSub) return false

  const { error } = await supabase
    .from("channel_members")
    .update({ status: "active", joined_at: new Date().toISOString() })
    .eq("id", membershipId)

  if (error) {
    logMembershipDiagnostic(`Failed to activate member from subscription: ${error.message}`)
    return false
  }

  logMembershipDiagnostic(`Activated pending member ${agentId} via active subscription`)
  return true
}

/**
 * Check if a user is an active member of a channel.
 * If they have an active paid subscription but membership row is pending, auto-activate.
 */
export const checkChannelMembership = async (
  channelId: string,
  agentId: string,
): Promise<{ isMember: boolean; role?: string; status?: string; error?: string }> => {
  try {
    logMembershipDiagnostic(`Checking membership for agent ${agentId} in channel ${channelId}`)

    const { data: membership, error } = await supabase
      .from("channel_members")
      .select("id, role, status")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    if (error) {
      logMembershipDiagnostic(`Error checking membership: ${error.message}`, error)
      return { isMember: false, error: error.message }
    }

    if (!membership) {
      const hasSub = await hasActiveChannelSubscription(supabase, channelId, agentId)
      if (hasSub) {
        const result = await ensureChannelMemberActive(supabase, channelId, agentId, "member")
        if (result.ok) {
          return { isMember: true, role: "member", status: "active" }
        }
        return { isMember: false, error: result.error }
      }
      logMembershipDiagnostic(`Agent ${agentId} is NOT a member of channel ${channelId}`)
      return { isMember: false }
    }

    if (membership.status === "active") {
      return {
        isMember: true,
        role: membership.role,
        status: membership.status,
      }
    }

    const activated = await tryActivateMembershipFromSubscription(channelId, agentId, membership.id)
    if (activated) {
      return {
        isMember: true,
        role: membership.role,
        status: "active",
      }
    }

    logMembershipDiagnostic(
      `Agent ${agentId} membership status: ${membership.status}, role: ${membership.role}, active: false`,
    )

    return {
      isMember: false,
      role: membership.role,
      status: membership.status,
    }
  } catch (err) {
    logMembershipDiagnostic(`Exception checking membership: ${err}`, err)
    return { isMember: false, error: String(err) }
  }
}

/**
 * Get all posts visible to a channel member
 */
export const getChannelPostsForMember = async (
  channelId: string,
  agentId: string,
): Promise<{ posts: any[]; error?: string }> => {
  try {
    logMembershipDiagnostic(`Fetching posts for member ${agentId} in channel ${channelId}`)

    // First verify membership
    const { isMember, error: memberError } = await checkChannelMembership(channelId, agentId)

    if (!isMember) {
      logMembershipDiagnostic(`Access denied: ${agentId} is not an active member of ${channelId}`)
      return { posts: [], error: "Not a member of this channel" }
    }

    const { data: posts, error } = await supabase
      .from("channel_posts")
      .select("*")
      .eq("channel_id", channelId)
      .eq("is_archived", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      logMembershipDiagnostic(`Error fetching posts: ${error.message}`, error)
      return { posts: [], error: error.message }
    }

    logMembershipDiagnostic(`Fetched ${posts?.length || 0} posts for member ${agentId}`)
    return { posts: posts || [] }
  } catch (err) {
    logMembershipDiagnostic(`Exception fetching posts: ${err}`, err)
    return { posts: [], error: String(err) }
  }
}

/**
 * Get comments for a post
 */
export const getPostComments = async (
  postId: string,
  agentId: string,
  channelId: string,
): Promise<{ comments: any[]; error?: string }> => {
  try {
    logMembershipDiagnostic(`Fetching comments for post ${postId}`)

    // Verify membership first
    const { isMember } = await checkChannelMembership(channelId, agentId)
    if (!isMember) {
      return { comments: [], error: "Not a member of this channel" }
    }

    const { data: comments, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      logMembershipDiagnostic(`Error fetching comments: ${error.message}`, error)
      return { comments: [], error: error.message }
    }

    return { comments: comments || [] }
  } catch (err) {
    logMembershipDiagnostic(`Exception fetching comments: ${err}`, err)
    return { comments: [], error: String(err) }
  }
}

/**
 * Verify that a member can perform an action (like, comment, share)
 */
export const checkMemberAction = async (
  channelId: string,
  agentId: string,
  action: "view" | "comment" | "like" | "share" | "post",
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const { isMember, role, status } = await checkChannelMembership(channelId, agentId)

    if (!isMember) {
      logMembershipDiagnostic(`Action denied: ${action} - agent not a member`)
      return { allowed: false, reason: "Not a member of this channel" }
    }

    if (status !== "active") {
      logMembershipDiagnostic(`Action denied: ${action} - member status is ${status}`)
      return { allowed: false, reason: `Your membership status is ${status}` }
    }

    // Members can view, comment, like, and share
    if (action === "view" || action === "comment" || action === "like" || action === "share") {
      logMembershipDiagnostic(`Action allowed: ${action} for member ${agentId}`)
      return { allowed: true }
    }

    // Only teachers and admins can post
    if (action === "post") {
      const canPost = role === "teacher" || role === "admin"
      if (!canPost) {
        logMembershipDiagnostic(`Action denied: ${action} - only teachers/admins can post, user is ${role}`)
        return { allowed: false, reason: "Only teachers and admins can create posts" }
      }
      logMembershipDiagnostic(`Action allowed: ${action} for ${role} ${agentId}`)
      return { allowed: true }
    }

    return { allowed: false, reason: "Unknown action" }
  } catch (err) {
    logMembershipDiagnostic(`Exception checking action permission: ${err}`, err)
    return { allowed: false, reason: "Error checking permissions" }
  }
}

/**
 * Add a member directly to a channel (admin action)
 */
export const addMemberToChannel = async (
  channelId: string,
  agentId: string,
  role: "member" | "teacher" | "admin" = "member",
): Promise<{ success: boolean; error?: string }> => {
  try {
    logMembershipDiagnostic(`Adding agent ${agentId} to channel ${channelId} as ${role}`)

    // Check if already a member
    const { data: existing } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .single()

    if (existing) {
      logMembershipDiagnostic(`Agent ${agentId} is already a member of channel ${channelId}`)
      return { success: false, error: "Agent is already a member of this channel" }
    }

    // Add the member
    const { error } = await supabase.from("channel_members").insert([
      {
        channel_id: channelId,
        agent_id: agentId,
        role,
        status: "active",
        joined_at: new Date().toISOString(),
      },
    ])

    if (error) {
      logMembershipDiagnostic(`Error adding member: ${error.message}`, error)
      return { success: false, error: error.message }
    }

    logMembershipDiagnostic(`Successfully added agent ${agentId} to channel ${channelId}`)
    return { success: true }
  } catch (err) {
    logMembershipDiagnostic(`Exception adding member: ${err}`, err)
    return { success: false, error: String(err) }
  }
}
