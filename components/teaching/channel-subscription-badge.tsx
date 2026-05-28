"use client"

import { Lock, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { MembershipUiStatus } from "@/lib/channel-membership-lifecycle"

interface ChannelSubscriptionBadgeProps {
  isEnabled: boolean
  monthlyFee?: number
  daysUntilExpiry?: number
  membershipStatus?: MembershipUiStatus
  isTeacherOrAdmin?: boolean
  onJoin?: () => void
  onRenew?: () => void
}

export function ChannelSubscriptionBadge({
  isEnabled,
  monthlyFee = 0,
  daysUntilExpiry,
  membershipStatus = "none",
  isTeacherOrAdmin = false,
  onJoin,
  onRenew,
}: ChannelSubscriptionBadgeProps) {
  if (!isEnabled || isTeacherOrAdmin) {
    return null
  }

  if (membershipStatus === "pending") {
    return (
      <Badge className="bg-amber-100 text-amber-900 border-amber-300">Awaiting approval</Badge>
    )
  }

  if (membershipStatus === "active") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={
                daysUntilExpiry !== undefined && daysUntilExpiry <= 3
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-green-100 text-green-800 border-green-300"
              }
            >
              <Clock className="h-3 w-3 mr-1" />
              {daysUntilExpiry !== undefined && daysUntilExpiry > 0
                ? `${daysUntilExpiry}d left`
                : "Member"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-xs">
            Your subscription is active.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (membershipStatus === "expired") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired — renew
        </Badge>
        {onRenew && (
          <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={onRenew}>
            Renew
          </Button>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              GHS {monthlyFee.toFixed(2)} / month
            </Badge>
            {onJoin && (
              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={onJoin}>
                Join
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-xs">
          Paid channel — submit a join request and complete payment to access content.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
