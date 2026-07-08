"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Shield } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { realtimeManager } from "@/lib/realtime-manager"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type SecurityEvent = {
  id: string
  action: string
  severity: string
  created_at: string
  actor_type?: string
  new_data?: Record<string, unknown> | null
}

const PHOTO_AUTO_VERIFIED_ACTION = "profile_photo_auto_verified"

function summarizeAction(action: string, data?: Record<string, unknown> | null): string {
  const agentName = typeof data?.agent_name === "string" ? data.agent_name : "An agent"
  const labels: Record<string, string> = {
    failed_login: "Failed agent login",
    rate_limit_hit: "Rate limit triggered",
    withdrawal_blocked_cooldown: "Withdrawal blocked (password cooldown)",
    large_withdrawal_requested: "Large withdrawal requested",
    payout_marked_paid: "Payout marked paid",
    agent_login: "Agent login",
    withdrawal_requested: "Withdrawal requested",
    storefront_webhook_capture_failed: "Storefront payment capture failed",
    wallet_topup_webhook_capture_failed: "Wallet top-up payment capture failed",
    new_order: "New pending order",
    manual_wallet_topup: "Manual wallet top-up — verify MoMo payment",
    profile_photo_auto_verified: `New verified: ${agentName} — check their photo`,
    official_announcement: "New official announcement",
  }
  if (labels[action]) return labels[action]
  if (data?.error && typeof data.error === "string") {
    return `${action}: ${data.error.slice(0, 80)}`
  }
  return action.replace(/_/g, " ")
}

function formatEventTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

type SecurityNotificationBellProps = {
  buttonClassName?: string
}

export function SecurityNotificationBell({ buttonClassName }: SecurityNotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recent, setRecent] = useState<SecurityEvent[]>([])
  const [open, setOpen] = useState(false)
  const readIdsRef = useRef<Set<string>>(new Set())
  const bellRef = useRef<HTMLButtonElement>(null)

  const ingestEvent = useCallback((row: SecurityEvent) => {
    const sev = row.severity || "info"
    const isManualWalletTopup = row.action === "manual_wallet_topup"
    const isPhotoAutoVerified = row.action === PHOTO_AUTO_VERIFIED_ACTION
    if (
      sev !== "warning" &&
      sev !== "critical" &&
      row.action !== "new_order" &&
      row.action !== "official_announcement" &&
      !isManualWalletTopup &&
      !isPhotoAutoVerified
    ) {
      return
    }

    setRecent((prev) => {
      if (prev.some((e) => e.id === row.id)) return prev
      return [row, ...prev].slice(0, 8)
    })

    if (!readIdsRef.current.has(row.id)) {
      setUnreadCount((c) => c + 1)

      if (isManualWalletTopup) {
        const data = row.new_data ?? null
        const amount =
          data?.amount != null ? `GH₵${Number(data.amount).toFixed(2)}` : ""
        const agentName = typeof data?.agent_name === "string" ? data.agent_name : "An agent"
        toast.error("Manual wallet top-up needs verification", {
          description: `${agentName} submitted ${amount}. Open Wallets to approve after confirming MoMo.`,
          duration: 15000,
          action: {
            label: "Open Wallets",
            onClick: () => router.push("/admin?tab=wallets"),
          },
        })
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("admin-pending-refresh"))
        }
      } else if (isPhotoAutoVerified) {
        const data = row.new_data ?? null
        const agentName = typeof data?.agent_name === "string" ? data.agent_name : "An agent"
        toast.warning("New verified agent photo", {
          description: `${agentName} was auto-approved. Open Verified list to check their image — reject if it looks wrong.`,
          duration: 12000,
          action: {
            label: "Check photo",
            onClick: () => router.push("/admin?tab=photo-verification&filter=verified"),
          },
        })
      } else {
        const toastFn = row.action === "official_announcement" ? toast.info : toast.warning
        toastFn(summarizeAction(row.action, row.new_data ?? null), {
          description: `${sev.toUpperCase()} · ${formatEventTime(row.created_at)}`,
          duration: 6000,
          action:
            row.action === "new_order"
              ? {
                  label: "View",
                  onClick: () => router.push("/admin?tab=dashboard"),
                }
              : undefined,
        })
      }

      if (bellRef.current && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(
            isManualWalletTopup || isPhotoAutoVerified
              ? [200, 100, 200, 100, 200]
              : [120, 60, 120],
          )
        } catch {
          /* ignore */
        }
      }
    }
  }, [router])

  useEffect(() => {
    const loadInitial = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from("audit_log")
        .select("id, action, severity, created_at, actor_type, new_data")
        .or(
          "severity.in.(warning,critical),action.in.(official_announcement,new_order,manual_wallet_topup,profile_photo_auto_verified)",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(8)

      if (data?.length) {
        setRecent(data as SecurityEvent[])
      }
    }
    void loadInitial()

    const unsub = realtimeManager.subscribe(
      "admin_security_audit_log",
      "audit_log",
      (payload) => {
        const row = payload.new as SecurityEvent | null
        if (!row?.id) return
        ingestEvent({
          id: row.id,
          action: row.action,
          severity: (row as { severity?: string }).severity || "info",
          created_at: row.created_at || new Date().toISOString(),
          actor_type: row.actor_type,
          new_data: (row as { new_data?: Record<string, unknown> }).new_data,
        })
      },
    )

    return () => unsub()
  }, [ingestEvent])

  const markAllRead = () => {
    recent.forEach((e) => readIdsRef.current.add(e.id))
    setUnreadCount(0)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) markAllRead()
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={bellRef}
          variant="secondary"
          size="sm"
          className={cn(
            "relative h-9 w-9 shrink-0 border border-white/25 bg-white/15 p-0 text-white shadow-none hover:bg-white/25 hover:text-white",
            buttonClassName,
            unreadCount > 0 && "animate-pulse",
          )}
          aria-label="Security alerts"
        >
          <Bell className={cn("h-4 w-4", unreadCount > 0 && "animate-call-wiggle")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          Security alerts
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">No recent warnings</p>
        ) : (
          recent.map((ev) => (
            <DropdownMenuItem
              key={ev.id}
              className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
              onClick={() => {
                markAllRead()
                setOpen(false)
                if (ev.action === "new_order") {
                  router.push("/admin?tab=dashboard")
                } else if (ev.action === "manual_wallet_topup") {
                  router.push("/admin?tab=wallets")
                } else if (ev.action === "profile_photo_auto_verified") {
                  router.push("/admin?tab=photo-verification&filter=verified")
                } else if (ev.action === "official_announcement") {
                  router.push("/admin?tab=security-log")
                } else {
                  router.push("/admin?tab=security-log")
                }
              }}
            >
              <span className="text-sm font-medium leading-tight">
                {summarizeAction(ev.action, ev.new_data ?? null)}
              </span>
              <span className="text-xs text-muted-foreground">
                {ev.severity} · {formatEventTime(ev.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-blue-600 font-medium justify-center"
          onClick={() => {
            markAllRead()
            setOpen(false)
            router.push("/admin?tab=dashboard")
          }}
        >
          View pending orders
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-blue-600 font-medium justify-center"
          onClick={() => {
            markAllRead()
            setOpen(false)
            router.push("/admin?tab=security-log")
          }}
        >
          View all security logs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
