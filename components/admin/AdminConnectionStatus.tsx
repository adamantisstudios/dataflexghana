"use client"

import { CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "session" | "db"

type Props = {
  variant: Variant
  /** session: healthy | issues; db: connected | disconnected */
  status: "healthy" | "issues" | "connected" | "disconnected"
  className?: string
}

/** Compact connection indicator for the admin header — icon-only on mobile. */
export function AdminConnectionStatus({ variant, status, className }: Props) {
  const isOk =
    status === "healthy" || status === "connected"

  const label =
    variant === "session"
      ? status === "healthy"
        ? "Connected"
        : "Issues"
      : status === "connected"
        ? "Connected"
        : "Offline"

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-1.5 py-1 sm:px-2",
        isOk ? "text-emerald-200" : "text-amber-200",
        className,
      )}
      title={label}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isOk ? "bg-emerald-400" : "bg-amber-400",
        )}
        aria-hidden
      />
      {isOk ? (
        <CheckCircle2 className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden />
      ) : (
        <AlertCircle className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden />
      )}
      <span className="hidden text-[10px] font-medium leading-none sm:inline lg:text-xs">
        {label}
      </span>
    </div>
  )
}
