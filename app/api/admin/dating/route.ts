import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  const status = request.nextUrl.searchParams.get("status")
  const db = getAdminClient()

  let profileQuery = db
    .from("dating_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (status === "pending") {
    profileQuery = profileQuery
      .eq("is_approved", false)
      .eq("is_suspended", false)
      .is("rejection_reason", null)
  } else if (status === "suspended") {
    profileQuery = profileQuery.eq("is_suspended", true)
  }

  const [{ data: profiles }, { data: reports }, { data: sessions }] = await Promise.all([
    profileQuery,
    db.from("dating_reports").select("*").order("created_at", { ascending: false }).limit(100),
    db.from("dating_counselling_sessions").select("*").order("scheduled_at", { ascending: false }).limit(50),
  ])

  const profileList = profiles ?? []
  const profileIds = profileList.map((p) => p.id as string)
  let photosByProfile: Record<string, { id: string; order_index: number; public_url?: string }[]> = {}

  if (profileIds.length > 0) {
    const { data: photoRows } = await db
      .from("dating_profile_photos")
      .select("id, profile_id, order_index, public_url")
      .in("profile_id", profileIds)
      .order("order_index", { ascending: true })

    for (const row of photoRows ?? []) {
      const pid = row.profile_id as string
      if (!photosByProfile[pid]) photosByProfile[pid] = []
      photosByProfile[pid].push({
        id: row.id as string,
        order_index: row.order_index as number,
        public_url: `/api/admin/dating/photos/${row.id as string}/serve`,
      })
    }
  }

  const enriched = profileList.map((p) => {
    const photos = photosByProfile[p.id] ?? []
    return {
      ...p,
      photos,
      first_photo_id: photos[0]?.id ?? null,
    }
  })

  return NextResponse.json({
    success: true,
    profiles: enriched,
    reports: reports ?? [],
    sessions: sessions ?? [],
  })
}
