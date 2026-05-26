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

function summarizeAction(action: string, data?: Record<string, unknown> | null): string {
  const labels: Record<string, string> = {
    failed_login: "Failed agent login",
    rate_limit_hit: "Rate limit triggered",
    withdrawal_blocked_cooldown: "Withdrawal blocked (password cooldown)",
    large_withdrawal_requested: "Large withdrawal requested",
    payout_marked_paid: "Payout marked paid",
    agent_login: "Agent login",
    withdrawal_requested: "Withdrawal requested",
    storefront_webhook_capture_failed: "Storefront payment capture failed",
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
    if (sev !== "warning" && sev !== "critical") return

    setRecent((prev) => {
      if (prev.some((e) => e.id === row.id)) return prev
      return [row, ...prev].slice(0, 5)
    })

    if (!readIdsRef.current.has(row.id)) {
      setUnreadCount((c) => c + 1)
      toast.warning(summarizeAction(row.action, row.new_data ?? null), {
        description: `${sev.toUpperCase()} · ${formatEventTime(row.created_at)}`,
        duration: 6000,
      })
      if (bellRef.current && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([120, 60, 120])
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  useEffect(() => {
    const loadInitial = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from("audit_log")
        .select("id, action, severity, created_at, actor_type, new_data")
        .in("severity", ["warning", "critical"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5)

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
            <DropdownMenuItem key={ev.id} className="flex flex-col items-start gap-0.5 py-2">
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
            router.push("/admin?tab=security-log")
          }}
        >
          View all security logs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
