import { getPhotoVerificationStatus } from "@/lib/photo-verification-status"
import { isPlatformAdminAgent } from "@/lib/platform-admin"

export const AGENT_AUTH_PUBLIC_PATHS = [
  "/agent/login",
  "/agent/register",
  "/agent/registration-payment",
  "/agent/registration-complete",
] as const

/** Only route unverified agents may visit (verification holding area). */
export const AGENT_PHOTO_VERIFICATION_HOLD_PATH = "/agent/dashboard"

/** API routes agents may call before admin approves their profile photo. */
export const AGENT_PHOTO_VERIFICATION_EXEMPT_API_PATHS = [
  "/api/agent/profile-photo/verify",
  "/api/upload/image",
  "/api/agent/mobile/home",
  "/api/agent/mobile/display-balances",
  "/api/agent/mobile/data-bundles",
  "/api/agent/mobile/data-orders",
  "/api/agent/mobile/wallet",
  "/api/agent/mobile/notifications",
  "/api/agent/mobile/compliance",
  "/api/agent/mobile/compliance/upload",
  "/api/agent/mobile/jobs",
  "/api/agent/mobile/fashion/categories",
  "/api/agent/mobile/fashion/products",
  "/api/agent/mobile/settings",
  "/api/agent/mobile/writing",
  "/api/agent/mobile/wholesale",
  "/api/agent/mobile/properties",
  "/api/agent/mobile/domestic-workers",
  "/api/agent/login",
  "/api/agent/verify-2fa",
  "/api/agent/2fa/status",
  "/api/agent/2fa/setup",
  "/api/agent/2fa/confirm",
  "/api/agent/2fa/disable",
  "/api/agent/account/delete",
] as const

export const PHOTO_VERIFICATION_REQUIRED_ERROR =
  "Please verify your account with a photo before using this feature. Upload a clear selfie from your dashboard and wait for our team to approve it."

export function isAgentAuthPublicPath(pathname: string): boolean {
  return AGENT_AUTH_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isAgentPhotoVerificationHoldPath(pathname: string): boolean {
  return (
    pathname === AGENT_PHOTO_VERIFICATION_HOLD_PATH ||
    pathname.startsWith(`${AGENT_PHOTO_VERIFICATION_HOLD_PATH}/`)
  )
}

export function isAgentPhotoVerificationExemptApiPath(pathname: string): boolean {
  return AGENT_PHOTO_VERIFICATION_EXEMPT_API_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function isAgentPhotoVerified(
  agent: { profile_image_url?: string | null; profile_verified?: boolean | null; email?: string | null } | null | undefined,
): boolean {
  if (!agent) return false
  if (isPlatformAdminAgent(agent)) return true
  return getPhotoVerificationStatus(agent) === "verified"
}

export function agentRequiresPhotoVerification(
  agent: { profile_image_url?: string | null; profile_verified?: boolean | null; email?: string | null; isapproved?: boolean } | null | undefined,
): boolean {
  if (!agent?.isapproved) return false
  if (isPlatformAdminAgent(agent)) return false
  return !isAgentPhotoVerified(agent)
}
