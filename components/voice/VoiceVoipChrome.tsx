"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function VoipStatusBar({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <div className={cn("voip-status-bar", className)}>
      <p className="voip-status-title px-4">{title}</p>
      <p className="voip-status-subtitle">{subtitle}</p>
    </div>
  )
}

export function VoipFloatingActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("voip-floating-actions", className)}>{children}</div>
}

export function VoipFloatingButton({
  children,
  onClick,
  disabled,
  title,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn("voip-floating-btn", className)}
    >
      {children}
    </button>
  )
}

export function VoipGlassPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("voip-glass-panel", className)}>{children}</div>
}
