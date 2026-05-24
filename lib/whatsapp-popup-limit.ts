const WHATSAPP_POPUP_KEY = "df_whatsapp_popup_tracking"
const MAX_SHOWS = 2
const WINDOW_MS = 24 * 60 * 60 * 1000

interface PopupTracking {
  count: number
  firstShownAt: number
  lastShownAt: number
}

export function shouldShowWhatsAppPopup(isApproved: boolean): boolean {
  if (!isApproved || typeof window === "undefined") return false

  try {
    const raw = localStorage.getItem(WHATSAPP_POPUP_KEY)
    if (!raw) return true

    const tracking: PopupTracking = JSON.parse(raw)
    const now = Date.now()

    if (now - tracking.firstShownAt > WINDOW_MS) return true
    return tracking.count < MAX_SHOWS
  } catch {
    return true
  }
}

export function recordWhatsAppPopupDismissed(): void {
  if (typeof window === "undefined") return

  try {
    const raw = localStorage.getItem(WHATSAPP_POPUP_KEY)
    const now = Date.now()

    if (!raw) {
      localStorage.setItem(
        WHATSAPP_POPUP_KEY,
        JSON.stringify({ count: 1, firstShownAt: now, lastShownAt: now } satisfies PopupTracking),
      )
      return
    }

    const tracking: PopupTracking = JSON.parse(raw)

    if (now - tracking.firstShownAt > WINDOW_MS) {
      localStorage.setItem(
        WHATSAPP_POPUP_KEY,
        JSON.stringify({ count: 1, firstShownAt: now, lastShownAt: now }),
      )
      return
    }

    localStorage.setItem(
      WHATSAPP_POPUP_KEY,
      JSON.stringify({
        count: tracking.count + 1,
        firstShownAt: tracking.firstShownAt,
        lastShownAt: now,
      }),
    )
  } catch {
    // ignore storage errors
  }
}
