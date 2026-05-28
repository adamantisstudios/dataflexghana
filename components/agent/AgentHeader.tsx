"use client"

import Link from "next/link"
import { BookOpen, LogOut, Settings, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentAvatar } from "@/components/agent/AgentAvatar"
import { AgentVerificationBadge } from "@/components/agent/AgentVerificationBadge"
import { cn } from "@/lib/utils"

const iconBtnClass =
  "h-9 w-9 shrink-0 border border-white/25 bg-white/15 p-0 text-white shadow-none hover:bg-white/25 hover:text-white sm:w-auto sm:px-2.5"

function shortMobileName(name?: string | null): string {
  if (!name?.trim()) return "Agent"
  const firstName = name.trim().split(/\s+/)[0]
  return firstName.length > 12 ? `${firstName.slice(0, 11)}…` : firstName
}

type AgentHeaderProps = {
  fullName?: string | null
  profileImageUrl?: string | null
  agent: { isapproved?: boolean } | null
  isApprovedInfluencer?: boolean
  walletBalance?: number
  onLogout: () => void
  className?: string
}

export function AgentHeader({
  fullName,
  profileImageUrl,
  agent,
  isApprovedInfluencer = false,
  walletBalance = 0,
  onLogout,
  className,
}: AgentHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full max-w-[100vw] border-b border-emerald-900/40 bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 shadow-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 min-h-14 w-full max-w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <AgentAvatar
            name={fullName}
            imageUrl={profileImageUrl}
            size="sm"
            className="h-9 w-9 shrink-0 border border-white/35"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white sm:max-w-[280px] sm:text-[15px]">
              <span className="sm:hidden">{shortMobileName(fullName)}</span>
              <span className="hidden sm:inline">{fullName || "Agent"}</span>
            </p>
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[11px] text-emerald-100/95 sm:text-xs">DataFlex Agent Dashboard</p>
              {agent?.isapproved && <AgentVerificationBadge agent={agent} />}
              {isApprovedInfluencer && (
                <span className="hidden sm:inline-flex items-center rounded-full border border-sky-300/35 bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-100">
                  Influencer
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className={iconBtnClass}
            title="Wallet"
          >
            <Link href="/agent/wallet">
              <Wallet className="h-4 w-4 shrink-0" />
              <span className="sr-only sm:not-sr-only sm:ml-1.5">
                GH₵ {Number(walletBalance || 0).toFixed(2)}
              </span>
            </Link>
          </Button>

          <Button variant="secondary" size="sm" asChild className={iconBtnClass} title="Settings">
            <Link href="/agent/settings">
              <Settings className="h-4 w-4 shrink-0" />
              <span className="sr-only sm:not-sr-only sm:ml-1.5">Settings</span>
            </Link>
          </Button>

          <Button variant="secondary" size="sm" asChild className={iconBtnClass} title="Blog">
            <Link href="/blogs" prefetch={false}>
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="sr-only sm:not-sr-only sm:ml-1.5">Blog</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onLogout}
            className={cn(iconBtnClass, "hover:bg-red-500/70 hover:text-white")}
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="sr-only sm:not-sr-only sm:ml-1.5">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
