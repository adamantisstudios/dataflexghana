import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { hasActiveChannelSubscription } from "@/lib/ensure-channel-member-active"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }

const ACTIONS = new Set(["like", "unlike", "save", "unsave", "view"])

/** Source table for each post_type discriminator the feed emits. */
const POST_TABLES: Record<string, string> = {
  post: "channel_posts",
  message: "channel_messages",
  qa: "qa_posts",
  youtube: "youtube_videos",
  video: "videos",
  embed: "channel_embed_videos",
}

/** Subset of POST_TABLES whose rows carry a `view_count` column. */
const VIEW_TABLES: Record<string, string> = {
  post: "channel_posts",
  qa: "qa_posts",
  youtube: "youtube_videos",
  video: "videos",
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agentId = String(auth.user.id)

  try {
    const { channelId } = await context.params
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || "").trim()
    const postId = String(body.post_id || "").trim()
    const postType = String(body.post_type || "post").trim()

    if (!ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "action must be one of like, unlike, save, unsave, view" },
        { status: 400 },
      )
    }
    if (!postId) {
      return NextResponse.json({ error: "post_id is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: member } = await db
      .from("channel_members")
      .select("status")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    const { data: subscription } = await db
      .from("channel_subscription_settings")
      .select("is_enabled")
      .eq("channel_id", channelId)
      .maybeSingle()

    const subscriptionEnabled = Boolean(subscription?.is_enabled)
    const hasPaidAccess = subscriptionEnabled
      ? await hasActiveChannelSubscription(db, channelId, agentId)
      : true

    if (member?.status !== "active" || !hasPaidAccess) {
      return NextResponse.json(
        {
          error: "You must be an active member of this channel to interact with its content.",
          requires_join: true,
        },
        { status: 403 },
      )
    }

    // Membership is per-channel, so the target must actually live in this
    // channel — otherwise a member of any one channel could like, save or
    // inflate views on posts belonging to channels they cannot read.
    const sourceTable = POST_TABLES[postType]
    if (!sourceTable) {
      return NextResponse.json(
        { error: `Unknown post_type "${postType}"` },
        { status: 400 },
      )
    }

    const { data: owner } = await db
      .from(sourceTable)
      .select("id")
      .eq("id", postId)
      .eq("channel_id", channelId)
      .maybeSingle()

    if (!owner) {
      return NextResponse.json(
        { error: "That content does not belong to this channel." },
        { status: 404 },
      )
    }

    if (action === "like") {
      const { error } = await db.from("post_likes").insert({ post_id: postId, user_id: agentId })
      // Duplicate likes are harmless — treat the unique-violation as already-liked.
      if (error && error.code !== "23505") {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, liked: true })
    }

    if (action === "unlike") {
      const { error } = await db
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", agentId)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, liked: false })
    }

    if (action === "save" || action === "unsave") {
      const isQa = postType === "qa"
      if (action === "save") {
        const { error } = await db.from("saved_posts").insert({
          user_id: agentId,
          post_id: isQa ? null : postId,
          qa_post_id: isQa ? postId : null,
          post_type: isQa ? "qa" : "regular",
          channel_id: channelId,
        })
        if (error && error.code !== "23505") {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, saved: true })
      }

      let query = db.from("saved_posts").delete().eq("user_id", agentId).eq("channel_id", channelId)
      query = isQa ? query.eq("qa_post_id", postId) : query.eq("post_id", postId)
      const { error } = await query
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, saved: false })
    }

    // action === "view"
    const table = VIEW_TABLES[postType]
    if (!table) {
      return NextResponse.json({ success: true, view_count: null })
    }

    const { data: current } = await db.from(table).select("view_count").eq("id", postId).maybeSingle()
    const next = (typeof current?.view_count === "number" ? current.view_count : 0) + 1
    const { error } = await db.from(table).update({ view_count: next }).eq("id", postId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, view_count: next })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record interaction"
    console.error("[agent mobile channel interact POST]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
