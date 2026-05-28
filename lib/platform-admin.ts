import { getSupportEmail } from "@/lib/config"

/** Platform owner email — only this account may create teaching channels. */
export function getPlatformAdminEmail(): string {
  return getSupportEmail().trim().toLowerCase()
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false
  return email.trim().toLowerCase() === getPlatformAdminEmail()
}

export function isPlatformAdminAgent(agent: { email?: string | null } | null | undefined): boolean {
  return isPlatformAdminEmail(agent?.email)
}
