import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { hashPassword } from "@/lib/supabase"
import { logAuditFromRequest, getRequestClientMeta } from "@/lib/audit-logger"
import { sendEmail } from "@/lib/sendEmail"
import { MIN_INFLUENCER_AUDIENCE, parseSocialHandles } from "@/lib/influencer-types"

export const dynamic = "force-dynamic"

type SocialRow = { platform?: string; url?: string }

function parseSocialRows(raw: unknown): { ok: true; handles: Record<string, string> } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "At least one social handle is required" }
  }
  const out: Record<string, string> = {}
  for (const row of raw as SocialRow[]) {
    const platform = String(row.platform ?? "").trim()
    const url = String(row.url ?? "").trim()
    if (!platform || !url) continue
    if (!/^https?:\/\//i.test(url)) {
      return { ok: false, error: `Invalid URL for ${platform}. Use a full https:// link.` }
    }
    out[platform] = url
  }
  if (Object.keys(out).length === 0) {
    return { ok: false, error: "At least one valid social handle (platform + URL) is required" }
  }
  return { ok: true, handles: out }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName = String(body.full_name ?? body.fullName ?? "").trim()
    const phoneNumber = String(body.phone_number ?? body.phoneNumber ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const bio = body.bio ? String(body.bio).trim() : null
    const photo_url = body.photo_url ? String(body.photo_url).trim() : null
    const password = String(body.password ?? "").trim()
    const nicheRaw = String(body.niche ?? "").trim()
    const audience_size = Number(body.audience_size ?? body.audienceSize)
    const termsAccepted = Boolean(body.terms_accepted ?? body.termsAccepted)
    const socialParsed = parseSocialRows(body.social_handles ?? body.socialHandles)

    if (!fullName || !phoneNumber || !email) {
      return NextResponse.json({ error: "Full name, phone number, and email are required" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 })
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: "You must accept the Influencer Terms and Conditions" }, { status: 400 })
    }
    if (!photo_url) {
      return NextResponse.json({ error: "Profile photo is required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }
    if (!nicheRaw) {
      return NextResponse.json({ error: "Niche is required" }, { status: 400 })
    }
    if (!Number.isFinite(audience_size) || audience_size < MIN_INFLUENCER_AUDIENCE) {
      return NextResponse.json(
        { error: `Audience size must be at least ${MIN_INFLUENCER_AUDIENCE.toLocaleString()}` },
        { status: 400 },
      )
    }
    if (!socialParsed.ok) {
      return NextResponse.json({ error: socialParsed.error }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: existingPhone } = await db
      .from("agents")
      .select("id")
      .eq("phone_number", phoneNumber)
      .maybeSingle()

    if (existingPhone) {
      return NextResponse.json({ error: "An account with this phone number already exists" }, { status: 409 })
    }

    const { data: existingEmail } = await db.from("agents").select("id").eq("email", email).maybeSingle()

    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const { data: newAgent, error: agentError } = await db
      .from("agents")
      .insert({
        full_name: fullName,
        agent_name: fullName,
        phone_number: phoneNumber,
        email,
        momo_number: phoneNumber,
        region: "Ghana",
        password_hash: passwordHash,
        isapproved: false,
        status: "pending",
        registration_source: "influencer_self_register",
        profile_image_url: photo_url,
        profile_verified: true,
      })
      .select("id, full_name, phone_number, email")
      .single()

    if (agentError || !newAgent) {
      console.error("[influencers/register] agent insert:", agentError)
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
    }

    const social_handles = parseSocialHandles(socialParsed.handles)

    const { data: profile, error: profileError } = await db
      .from("influencer_profiles")
      .insert({
        agent_id: newAgent.id,
        bio: bio || null,
        photo_url,
        social_handles,
        audience_size,
        niche: nicheRaw,
        approved: false,
        registration_source: "self_registered",
      })
      .select("id")
      .single()

    if (profileError) {
      console.error("[influencers/register] profile insert:", profileError)
      await db.from("agents").delete().eq("id", newAgent.id)
      return NextResponse.json({ error: "Could not save influencer profile" }, { status: 500 })
    }

    const { ipAddress, userAgent } = getRequestClientMeta(request)
    await logAuditFromRequest(request, {
      actorId: newAgent.id,
      actorType: "influencer",
      action: "influencer_self_registered",
      targetTable: "influencer_profiles",
      targetId: profile?.id ?? newAgent.id,
      newData: {
        full_name: fullName,
        phone_number: phoneNumber,
        email,
        audience_size,
        niche: nicheRaw,
        registration_source: "self_registered",
      },
      ipAddress,
      userAgent,
    })

    await sendEmail({
      to: "sales@dataflexghana.com",
      subject: `New influencer self-registration: ${fullName}`,
      text: [
        "A new influencer application was submitted via /influencers/register",
        "",
        `Name: ${fullName}`,
        `Phone: ${phoneNumber}`,
        `Email: ${email}`,
        `Niche: ${nicheRaw}`,
        `Audience: ${audience_size.toLocaleString()}`,
        bio ? `Bio: ${bio}` : null,
        "",
        `Review in admin: /admin (Micro-Influencers tab)`,
        `Agent ID: ${newAgent.id}`,
        `Profile ID: ${profile?.id ?? "—"}`,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    return NextResponse.json({
      success: true,
      agent_id: newAgent.id,
      profile_id: profile?.id,
    })
  } catch (e) {
    console.error("[influencers/register]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
