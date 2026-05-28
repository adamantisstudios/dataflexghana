import { cn } from "@/lib/utils"

/** Full-page shell aligned with Referral Hub */
export const teachingHubPageClass =
  "min-h-screen w-full bg-gradient-to-b from-slate-100 via-slate-50 to-white text-gray-900"

export const teachingHubMainClass = "w-full px-4 py-6 sm:px-6 lg:px-8"

export const teachingHubContentCardClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6"

export const teachingHubTabListClass = cn(
  "flex h-auto w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto overscroll-x-contain",
  "whitespace-nowrap rounded-2xl p-2 border border-slate-200 bg-white shadow-sm",
  "no-scrollbar scroll-smooth",
)

/** Sticky wrapper for channel / member tab bars */
export const teachingHubTabBarStickyClass =
  "sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"

export const teachingHubTabTriggerClass = cn(
  "rounded-full py-2.5 px-4 text-xs sm:text-sm font-semibold transition-all border border-transparent whitespace-nowrap min-h-[44px]",
  "data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow",
  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100",
)

export function isChannelManager(
  channel: { user_role?: string | null; created_by?: string | null },
  agentId?: string | null,
): boolean {
  if (!agentId) return false
  const role = channel.user_role
  if (role === "admin" || role === "teacher") return true
  if (channel.created_by && String(channel.created_by) === String(agentId)) return true
  return false
}

/** Ensure audio URLs work in the browser (absolute https). */
export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url?.trim()) return ""
  const trimmed = url.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  if (typeof window !== "undefined" && trimmed.startsWith("/")) {
    return `${window.location.origin}${trimmed}`
  }
  return trimmed
}
