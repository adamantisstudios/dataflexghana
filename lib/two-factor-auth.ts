import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto"
import { generateSecret, generateURI, verifySync } from "otplib"
import { getAdminClient } from "@/lib/supabase-base"
import type { NextRequest, NextResponse } from "next/server"

export type TwoFactorUserType = "agent" | "admin"

const ISSUER = "Dataflex Ghana"
const TRUST_COOKIE_DAYS = 30
const PENDING_TOKEN_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000
const BACKUP_CODE_COUNT = 5
/** ±1 TOTP period (30s) for clock skew */
const TOTP_EPOCH_TOLERANCE = 30

function getSigningSecret(): string {
  return process.env.TWO_FACTOR_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dataflex-2fa-dev-secret"
}

export function generateTwoFactorSecret(): string {
  return generateSecret()
}

export function buildOtpAuthUrl(accountLabel: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: accountLabel, secret })
}

export function verifyTotpToken(token: string, secret: string): boolean {
  const code = token.replace(/\s/g, "")
  if (!/^\d{6}$/.test(code)) return false
  try {
    return verifySync({ secret, token: code, epochTolerance: TOTP_EPOCH_TOLERANCE }).valid
  } catch {
    return false
  }
}

export function hashBackupCode(plain: string): string {
  return createHash("sha256").update(plain.trim().toUpperCase()).digest("hex")
}

export function generatePlainBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const part = randomBytes(4).toString("hex").toUpperCase()
    codes.push(`${part.slice(0, 4)}-${part.slice(4, 8)}`)
  }
  return codes
}

export function hashBackupCodes(plainCodes: string[]): string[] {
  return plainCodes.map(hashBackupCode)
}

export function verifyBackupCode(
  input: string,
  hashedCodes: string[],
): { valid: boolean; remaining: string[] } {
  const normalized = input.replace(/\s/g, "").toUpperCase()
  const hash = hashBackupCode(normalized)
  const idx = hashedCodes.findIndex((h) => {
    try {
      return timingSafeEqual(Buffer.from(h), Buffer.from(hash))
    } catch {
      return false
    }
  })
  if (idx === -1) return { valid: false, remaining: hashedCodes }
  const remaining = [...hashedCodes]
  remaining.splice(idx, 1)
  return { valid: true, remaining }
}

export function createPending2FAToken(userId: string, userType: TwoFactorUserType): string {
  const payload = {
    userId,
    userType,
    exp: Date.now() + PENDING_TOKEN_TTL_MS,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", getSigningSecret()).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyPending2FAToken(
  token: string,
): { userId: string; userType: TwoFactorUserType } | null {
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = createHmac("sha256", getSigningSecret()).update(body).digest("base64url")
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      userId: string
      userType: TwoFactorUserType
      exp: number
    }
    if (!payload.userId || !payload.userType || Date.now() > payload.exp) return null
    return { userId: payload.userId, userType: payload.userType }
  } catch {
    return null
  }
}

function trustCookieName(userType: TwoFactorUserType): string {
  return userType === "agent" ? "df_2fa_trust_agent" : "df_2fa_trust_admin"
}

export function createTrustDeviceValue(userId: string, userType: TwoFactorUserType): string {
  const payload = {
    userId,
    userType,
    exp: Date.now() + TRUST_COOKIE_DAYS * 24 * 60 * 60 * 1000,
    nonce: randomBytes(16).toString("hex"),
  }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", getSigningSecret()).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyTrustDeviceCookie(
  cookieValue: string | undefined,
  userId: string,
  userType: TwoFactorUserType,
): boolean {
  if (!cookieValue) return false
  const parts = cookieValue.split(".")
  if (parts.length !== 2) return false
  const [body, sig] = parts
  const expected = createHmac("sha256", getSigningSecret()).update(body).digest("base64url")
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  } catch {
    return false
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      userId: string
      userType: TwoFactorUserType
      exp: number
    }
    return (
      payload.userId === userId &&
      payload.userType === userType &&
      Date.now() <= payload.exp
    )
  } catch {
    return false
  }
}

export function getTrustCookieFromRequest(
  request: NextRequest,
  userType: TwoFactorUserType,
): string | undefined {
  return request.cookies.get(trustCookieName(userType))?.value
}

export function appendTrustDeviceCookie(
  response: NextResponse,
  userId: string,
  userType: TwoFactorUserType,
): void {
  const value = createTrustDeviceValue(userId, userType)
  const maxAge = TRUST_COOKIE_DAYS * 24 * 60 * 60
  response.cookies.set(trustCookieName(userType), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })
}

export async function recordTwoFactorAttempt(
  userId: string,
  userType: TwoFactorUserType,
): Promise<void> {
  const db = getAdminClient()
  await db.from("two_factor_attempts").insert({ user_id: userId, user_type: userType })
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString()
  await db
    .from("two_factor_attempts")
    .delete()
    .eq("user_id", userId)
    .eq("user_type", userType)
    .lt("attempted_at", cutoff)
}

export async function isTwoFactorRateLimited(
  userId: string,
  userType: TwoFactorUserType,
): Promise<boolean> {
  const db = getAdminClient()
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString()
  const { count, error } = await db
    .from("two_factor_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("user_type", userType)
    .gte("attempted_at", since)

  if (error) {
    console.error("[2fa] rate limit check error:", error.message)
    return false
  }
  return (count ?? 0) >= MAX_ATTEMPTS
}

export async function verifyTwoFactorCode(
  userId: string,
  userType: TwoFactorUserType,
  code: string,
): Promise<{ ok: true; usedBackup: boolean } | { ok: false; error: string }> {
  if (await isTwoFactorRateLimited(userId, userType)) {
    return { ok: false, error: "Too many attempts. Try again in 5 minutes." }
  }

  await recordTwoFactorAttempt(userId, userType)

  const table = userType === "agent" ? "agents" : "admin_users"
  const db = getAdminClient()
  const { data: row, error } = await db
    .from(table)
    .select("two_factor_secret, two_factor_backup_codes, two_factor_enabled")
    .eq("id", userId)
    .maybeSingle()

  if (error || !row?.two_factor_enabled || !row.two_factor_secret) {
    return { ok: false, error: "Two-factor authentication is not enabled" }
  }

  const secret = row.two_factor_secret as string
  const hashedCodes = Array.isArray(row.two_factor_backup_codes)
    ? (row.two_factor_backup_codes as string[])
    : []

  if (verifyTotpToken(code, secret)) {
    return { ok: true, usedBackup: false }
  }

  const backupResult = verifyBackupCode(code, hashedCodes)
  if (backupResult.valid) {
    await db
      .from(table)
      .update({
        two_factor_backup_codes: backupResult.remaining,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
    return { ok: true, usedBackup: true }
  }

  return { ok: false, error: "Invalid code. Enter a 6-digit authenticator code or a backup code." }
}

export function sanitizeAgentForClient(agent: Record<string, unknown>) {
  const { password_hash: _p, two_factor_secret: _s, two_factor_backup_codes: _b, ...safe } = agent
  return safe
}

export function sanitizeAdminForClient(admin: Record<string, unknown>) {
  const { password_hash: _p, two_factor_secret: _s, two_factor_backup_codes: _b, ...safe } = admin
  return safe
}
