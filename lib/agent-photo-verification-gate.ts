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
] as const

export const PHOTO_VERIFICATION_REQUIRED_ERROR =
  "Account photo verification required. Upload your profile photo and wait for admin approval before using the platform."

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
