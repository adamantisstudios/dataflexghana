import { createHash, randomBytes } from "crypto"
import type { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export type OpsDevice = {
  id: string
  label: string
  enabled: boolean
  api_key_prefix: string
}

export type OpsAuthResult =
  | { success: true; device: OpsDevice }
  | { success: false; error: string }

const OPS_KEY_PREFIX = "ops_"

export function hashOpsApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey.trim()).digest("hex")
}

/** Generate a plaintext API key (shown once) and its hash for storage. */
export function generateOpsApiKey(): { plaintext: string; hash: string; prefix: string } {
  const secret = randomBytes(24).toString("base64url")
  const plaintext = `${OPS_KEY_PREFIX}${secret}`
  const hash = hashOpsApiKey(plaintext)
  const prefix = plaintext.slice(0, 12)
  return { plaintext, hash, prefix }
}

export function extractOpsBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7).trim()
  return token || null
}

export async function authenticateOpsDevice(request: NextRequest): Promise<OpsAuthResult> {
  try {
    const token = extractOpsBearerToken(request)
    if (!token) {
      return { success: false, error: "Ops device authentication required" }
    }

    // Bootstrap: allow a single env key before any devices exist (optional)
    const bootstrap = process.env.OPS_DEVICE_BOOTSTRAP_KEY?.trim()
    if (bootstrap && token === bootstrap) {
      return {
        success: true,
        device: {
          id: "00000000-0000-0000-0000-000000000001",
          label: "bootstrap",
          enabled: true,
          api_key_prefix: "ops_bootstrap",
        },
      }
    }

    if (!token.startsWith(OPS_KEY_PREFIX)) {
      return { success: false, error: "Invalid ops API key format" }
    }

    const hash = hashOpsApiKey(token)
    const db = getAdminClient()
    const { data, error } = await db
      .from("ops_devices")
      .select("id, label, enabled, api_key_prefix")
      .eq("api_key_hash", hash)
      .maybeSingle()

    if (error) {
      console.error("[ops-auth] lookup failed:", error.message)
      return { success: false, error: "Ops authentication failed" }
    }

    if (!data || !data.enabled) {
      return { success: false, error: "Invalid or disabled ops device key" }
    }

    // Fire-and-forget last_seen
    void db
      .from("ops_devices")
      .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", data.id)

    return {
      success: true,
      device: {
        id: data.id,
        label: data.label,
        enabled: data.enabled,
        api_key_prefix: data.api_key_prefix,
      },
    }
  } catch (err) {
    console.error("[ops-auth] unexpected:", err)
    return { success: false, error: "Ops authentication failed" }
  }
}

export async function createOpsDevice(label: string): Promise<{
  deviceId: string
  plaintextKey: string
  prefix: string
} | null> {
  const { plaintext, hash, prefix } = generateOpsApiKey()
  const db = getAdminClient()
  const { data, error } = await db
    .from("ops_devices")
    .insert({
      label: label.trim() || "payment-phone",
      api_key_hash: hash,
      api_key_prefix: prefix,
      enabled: true,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[ops-auth] create device failed:", error?.message)
    return null
  }

  return { deviceId: data.id, plaintextKey: plaintext, prefix }
}
