import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { hashPassword } from "@/lib/supabase"
import { logAuditFromRequest, getRequestClientMeta } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

const REGISTRATION_WINDOW_MS = 24 * 60 * 60 * 1000

async function recordRateLimit(
  ip: string | null,
  phone: string,
  action: string,
): Promise<void> {
  const db = getAdminClient()
  await db.from("rate_limits").insert({
    ip_address: ip,
    phone_number: phone,
    action,
  })
}

async function isRegistrationRateLimited(
  ip: string | null,
  phone: string,
): Promise<{ limited: boolean; message?: string }> {
  const db = getAdminClient()
  const since = new Date(Date.now() - REGISTRATION_WINDOW_MS).toISOString()

  if (ip) {
    const { count, error } = await db
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("action", "agent_registration_success")
      .gte("created_at", since)

    if (error) {
      console.error("[register] IP rate limit check failed:", error)
    } else if ((count ?? 0) > 3) {
      return {
        limited: true,
        message: "Too many accounts were registered from this network. Please try again later.",
      }
    }
  }

  const { count: phoneAttempts, error: phoneError } = await db
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("phone_number", phone)
    .eq("action", "agent_registration_attempt")
    .gte("created_at", since)

  if (phoneError) {
    console.error("[register] phone rate limit check failed:", phoneError)
  } else if ((phoneAttempts ?? 0) > 3) {
    return {
      limited: true,
      message: "Too many registration attempts for this phone number. Please try again later.",
    }
  }

  return { limited: false }
}

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestClientMeta(request)

  try {
    const body = await request.json()
    const {
      fullName,
      phoneNumber,
      paymentLine,
      region,
      password,
      referralCode,
    } = body as {
      fullName?: string
      phoneNumber?: string
      paymentLine?: string
      region?: string
      password?: string
      referralCode?: string | null
    }

    if (!fullName?.trim() || !phoneNumber?.trim() || !paymentLine?.trim() || !region?.trim() || !password) {
      return NextResponse.json({ error: "All registration fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const normalizedPhone = phoneNumber.trim()

    await recordRateLimit(ipAddress, normalizedPhone, "agent_registration_attempt")

    const rateCheck = await isRegistrationRateLimited(ipAddress, normalizedPhone)
    if (rateCheck.limited) {
      await logAudit({
        actorType: "system",
        action: "rate_limit_hit",
        severity: "critical",
        newData: {
          action: "agent_registration",
          phone_number: normalizedPhone,
          ip_address: ipAddress,
        },
        ipAddress,
        userAgent,
      })
      return NextResponse.json({ error: rateCheck.message }, { status: 429 })
    }

    const db = getAdminClient()

    const { data: existingAgent } = await db
      .from("agents")
      .select("id")
      .eq("phone_number", normalizedPhone)
      .maybeSingle()

    if (existingAgent) {
      return NextResponse.json({ error: "An agent with this phone number already exists" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const { data: newAgent, error: insertError } = await db
      .from("agents")
      .insert({
        full_name: fullName.trim(),
        agent_name: fullName.trim(),
        phone_number: normalizedPhone,
        momo_number: paymentLine.trim(),
        region: region.trim(),
        password_hash: passwordHash,
        isapproved: false,
        referral_code: referralCode?.trim() || null,
        registration_ip: ipAddress,
        registration_user_agent: userAgent,
        last_ip: ipAddress,
      })
      .select("id, full_name, phone_number, isapproved, created_at")
      .single()

    if (insertError || !newAgent) {
      console.error("[register] insert failed:", insertError)
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
    }

    await recordRateLimit(ipAddress, normalizedPhone, "agent_registration_success")

    await logAuditFromRequest(request, {
      actorId: newAgent.id,
      actorType: "agent",
      action: "agent_registered",
      targetTable: "agents",
      targetId: newAgent.id,
      newData: {
        phone_number: normalizedPhone,
        region: region.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      agent: newAgent,
    })
  } catch (error) {
    console.error("[api/agent/register] error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 },
    )
  }
}
