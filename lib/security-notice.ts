export const SECURITY_NOTICE_SESSION_KEY = "dataflex_security_notice_ack_v1"
export const SECURITY_NOTICE_DAILY_KEY = "dataflex_security_notice_daily_v1"
export const SECURITY_NOTICE_MAX_PER_DAY = 2

export const SECURITY_NOTICE_MESSAGE =
  "All activities on this platform are monitored and logged. Unauthorized access, hacking, or tampering is illegal and will be tracked with your IP address and device information. Violators will be prosecuted to the full extent of the law."

export const FOOTER_SECURITY_LINE =
  "Your IP address and activity are logged for security and fraud-prevention purposes."

type DailyNoticeRecord = { date: string; count: number }

function readDailyNoticeRecord(): DailyNoticeRecord {
  const today = new Date().toDateString()
  try {
    const raw = localStorage.getItem(SECURITY_NOTICE_DAILY_KEY)
    if (!raw) return { date: today, count: 0 }
    const parsed = JSON.parse(raw) as DailyNoticeRecord
    if (parsed.date !== today) return { date: today, count: 0 }
    return { date: today, count: Number(parsed.count) || 0 }
  } catch {
    return { date: today, count: 0 }
  }
}

/** True if the hacking/security notice may be shown today (max twice per calendar day). */
export function canShowSecurityNoticeToday(): boolean {
  return readDailyNoticeRecord().count < SECURITY_NOTICE_MAX_PER_DAY
}

/** Call when the notice is displayed to count toward the daily limit. */
export function recordSecurityNoticeShown(): void {
  const today = new Date().toDateString()
  const current = readDailyNoticeRecord()
  const count = current.date === today ? current.count + 1 : 1
  try {
    localStorage.setItem(SECURITY_NOTICE_DAILY_KEY, JSON.stringify({ date: today, count }))
  } catch {
    /* ignore */
  }
}
