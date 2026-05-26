"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { LogOut, Shield, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SecurityNotificationBell } from "@/components/admin/SecurityNotificationBell"
import { cn } from "@/lib/utils"

function shortDisplayName(name?: string | null): string {
  if (!name?.trim()) return "Admin"
  const first = name.trim().split(/\s+/)[0]
  if (first.length <= 14) return first
  return `${first.slice(0, 12)}…`
}

const iconBtnClass =
  "h-9 w-9 shrink-0 border border-white/25 bg-white/15 p-0 text-white shadow-none hover:bg-white/25 hover:text-white sm:h-9"

type Props = {
  displayName?: string | null
  adminEmail?: string | null
  /** Status dot / label (connection health) — keep compact on mobile */
  connectionIndicator?: ReactNode
  /** Extra actions before the security bell (e.g. Settings dialog) */
  trailingActions?: ReactNode
  showMaintenanceLink?: boolean
  onLogout: () => void
  className?: string
}

export function AdminHeader({
  displayName,
  adminEmail,
  connectionIndicator,
  trailingActions,
  showMaintenanceLink = false,
  onLogout,
  className,
}: Props) {
  const welcomeDesktop = displayName?.trim() || adminEmail || "Admin"
  const welcomeMobile = shortDisplayName(displayName)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full max-w-[100vw] border-b border-blue-900/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 min-h-14 max-w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <Link
          href="/admin"
          className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden pr-1 sm:gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
            <Shield className="h-full w-full text-blue-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-[15px]">
              <span className="md:hidden">DataFlex Admin</span>
              <span className="hidden md:inline">DataFlex Admin Portal</span>
            </p>
            <p className="truncate text-[11px] text-blue-100/95 sm:text-xs md:hidden">
              Welcome, {welcomeMobile}
            </p>
            <p className="hidden truncate text-xs text-blue-100/95 md:block">
              Welcome back, {welcomeDesktop}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {connectionIndicator ? (
            <div className="flex max-w-[72px] shrink-0 items-center justify-end sm:max-w-none">
              {connectionIndicator}
            </div>
          ) : null}

          {trailingActions}

          {showMaintenanceLink ? (
            <Button
              variant="secondary"
              size="sm"
              asChild
              className={cn(iconBtnClass, "sm:w-auto sm:px-2.5")}
              title="Maintenance"
            >
              <Link href="/admin/maintenance">
                <Wrench className="h-4 w-4 shrink-0" aria-hidden />
                <span className="sr-only sm:not-sr-only sm:ml-1.5 sm:inline">Maintenance</span>
              </Link>
            </Button>
          ) : null}

          <SecurityNotificationBell buttonClassName={iconBtnClass} />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onLogout}
            className={cn(iconBtnClass, "sm:w-auto sm:px-2.5")}
            title="Log out"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className="sr-only sm:not-sr-only sm:ml-1.5 sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
