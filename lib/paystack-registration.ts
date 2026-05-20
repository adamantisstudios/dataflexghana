import type { NextRequest } from "next/server"
import { getServerAppBaseUrl, resolveOriginFromRequest } from "@/lib/app-url"

export const AGENT_REGISTRATION_PAYMENT_TYPE = "agent_registration" as const

const DEFAULT_REGISTRATION_ORIGIN = "https://www.dataflexghana.com"

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "")
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return host === "localhost" || host === "127.0.0.1"
  } catch {
    return /localhost|127\.0\.0\.1/i.test(origin)
  }
}

/** Public site origin for agent registration Paystack callbacks and redirects. */
export function getRegistrationAppOrigin(request?: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl && !isLocalhostOrigin(envUrl)) {
    return stripTrailingSlash(envUrl)
  }

  if (request) {
    const fromRequest = resolveOriginFromRequest(request)
    if (fromRequest && !isLocalhostOrigin(fromRequest)) {
      return fromRequest
    }
  }

  const serverBase = getServerAppBaseUrl(request)
  if (!isLocalhostOrigin(serverBase)) {
    return serverBase
  }

  return process.env.NODE_ENV === "production"
    ? DEFAULT_REGISTRATION_ORIGIN
    : stripTrailingSlash(serverBase)
}

export function getRegistrationPaystackCallbackUrl(request?: NextRequest): string {
  return `${getRegistrationAppOrigin(request)}/api/paystack/callback`
}

export function buildAgentRegisterSuccessUrl(
  origin: string,
  reference: string,
  extras?: { phone?: string; name?: string; email?: string },
): string {
  const url = new URL("/agent/register", stripTrailingSlash(origin))
  url.searchParams.set("payment", "success")
  url.searchParams.set("reference", reference)
  if (extras?.phone) url.searchParams.set("phone", extras.phone)
  if (extras?.name) url.searchParams.set("name", extras.name)
  if (extras?.email) url.searchParams.set("email", extras.email)
  return url.toString()
}

export function isAgentRegistrationPaystackMetadata(
  metadata: Record<string, unknown>,
): boolean {
  const registrationType = String(metadata.registration_type || "")
  const paymentType = String(metadata.payment_type || "")
  const transactionType = String(metadata.transaction_type || "")
  return (
    registrationType === AGENT_REGISTRATION_PAYMENT_TYPE ||
    paymentType === AGENT_REGISTRATION_PAYMENT_TYPE ||
    transactionType === "registration_fee"
  )
}
