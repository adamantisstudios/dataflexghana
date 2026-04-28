"use client"

import { Lock, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface ChannelSubscriptionBadgeProps {
  isEnabled: boolean
  monthlyFee?: number
  daysUntilExpiry?: number
  isPaid?: boolean
  isExpired?: boolean
  isTeacherOrAdmin?: boolean
}

export function ChannelSubscriptionBadge({
  isEnabled,
  monthlyFee = 0,
  daysUntilExpiry,
  isPaid = false,
  isExpired = false,
  isTeacherOrAdmin = false,
}: ChannelSubscriptionBadgeProps) {
  if (!isEnabled || isTeacherOrAdmin) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isExpired ? (
            <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Expired - Renew
            </Badge>
          ) : isPaid && daysUntilExpiry !== undefined && daysUntilExpiry > 0 ? (
            <Badge
              className={
                daysUntilExpiry <= 3
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-green-100 text-green-800 border-green-300"
              }
            >
              <Clock className="h-3 w-3 mr-1" />
              {daysUntilExpiry}d left
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Subscription: GHS {monthlyFee.toFixed(2)} / Month
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-xs">
          {isExpired
            ? "Your subscription has expired. Renew now to continue accessing this channel's content."
            : isPaid && daysUntilExpiry !== undefined && daysUntilExpiry > 0
              ? daysUntilExpiry <= 3
                ? `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Renew soon to avoid losing access!`
                : `Your subscription is active for ${daysUntilExpiry} more day${daysUntilExpiry === 1 ? "" : "s"}`
              : "This is a paid channel. Monthly subscription of GHS " +
                monthlyFee.toFixed(2) +
                " per month required to access content."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
