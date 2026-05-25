const VERIFICATION_REMINDER_LAST_DISMISSED_KEY = "df_verification_reminder_last_dismissed"
const WINDOW_MS = 24 * 60 * 60 * 1000

/** Show verification slide-up at most once per 24h for unverified approved agents. */
export function shouldShowVerificationReminder(isApproved: boolean, isVerified: boolean): boolean {
  if (!isApproved || isVerified || typeof window === "undefined") return false

  try {
    const raw = localStorage.getItem(VERIFICATION_REMINDER_LAST_DISMISSED_KEY)
    if (!raw) return true

    const lastDismissed = Number.parseInt(raw, 10)
    if (Number.isNaN(lastDismissed)) return true

    return Date.now() - lastDismissed >= WINDOW_MS
  } catch {
    return true
  }
}

export function recordVerificationReminderDismissed(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(VERIFICATION_REMINDER_LAST_DISMISSED_KEY, String(Date.now()))
  } catch {
    // ignore storage errors
  }
}

/** @deprecated Use shouldShowVerificationReminder */
export function shouldShowWhatsAppPopup(isApproved: boolean): boolean {
  return shouldShowVerificationReminder(isApproved, false)
}

/** @deprecated Use recordVerificationReminderDismissed */
export function recordWhatsAppPopupDismissed(): void {
  recordVerificationReminderDismissed()
}
