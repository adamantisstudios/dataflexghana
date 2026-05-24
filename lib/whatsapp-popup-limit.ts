const WHATSAPP_POPUP_LAST_DISMISSED_KEY = "df_whatsapp_popup_last_dismissed"
const WINDOW_MS = 24 * 60 * 60 * 1000

export function shouldShowWhatsAppPopup(isApproved: boolean): boolean {
  if (!isApproved || typeof window === "undefined") return false

  try {
    const raw = localStorage.getItem(WHATSAPP_POPUP_LAST_DISMISSED_KEY)
    if (!raw) return true

    const lastDismissed = Number.parseInt(raw, 10)
    if (Number.isNaN(lastDismissed)) return true

    return Date.now() - lastDismissed >= WINDOW_MS
  } catch {
    return true
  }
}

export function recordWhatsAppPopupDismissed(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(WHATSAPP_POPUP_LAST_DISMISSED_KEY, String(Date.now()))
  } catch {
    // ignore storage errors
  }
}
