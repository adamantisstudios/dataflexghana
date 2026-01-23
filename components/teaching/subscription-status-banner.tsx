"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"
import type { SubscriptionStatus } from "@/hooks/use-subscription-status"

interface SubscriptionStatusBannerProps {
  status: SubscriptionStatus
  channelName: string
}

export function SubscriptionStatusBanner({ status, channelName }: SubscriptionStatusBannerProps) {
  if (!status) return null

  if (status.is_expired) {
    return (
      <Alert className="bg-red-50 border-red-300 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 space-y-1">
          <p className="font-semibold">Subscription Expired</p>
          <p className="text-xs">
            Your subscription to "{channelName}" has expired. Please renew your subscription to regain access to this
            channel.
          </p>
          <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700 h-7 text-xs">
            Renew Subscription
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (status.is_expiring_soon) {
    return (
      <Alert className="bg-amber-50 border-amber-300 mb-4">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 space-y-1">
          <p className="font-semibold">Subscription Expiring Soon</p>
          <p className="text-xs">
            Your subscription expires in {status.days_until_expiry} day{status.days_until_expiry !== 1 ? "s" : ""}.
            Renew now to avoid losing access.
          </p>
          <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700 h-7 text-xs">
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-green-50 border-green-300 mb-4">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 text-xs">
        Your subscription is active. Expires in {status.days_until_expiry} day
        {status.days_until_expiry !== 1 ? "s" : ""}.
      </AlertDescription>
    </Alert>
  )
}
