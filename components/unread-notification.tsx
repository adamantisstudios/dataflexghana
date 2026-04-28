"use client"

import { Bell, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UnreadNotificationProps {
  unreadCount: number
  userType: "agent" | "admin"
  onDismiss?: () => void
}

export function UnreadNotification({ unreadCount, userType, onDismiss }: UnreadNotificationProps) {
  if (unreadCount === 0) return null

  return (
    <Card className="mb-6 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-emerald-600 animate-pulse" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800">
                {unreadCount === 1 ? "New Message!" : `${unreadCount} New Messages!`}
              </h3>
              <p className="text-sm text-emerald-700">
                You have unread messages in your referral projects. Click to view them.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href={userType === "admin" ? "#referrals" : "#referrals"}>
                <MessageCircle className="h-4 w-4 mr-1" />
                View Messages
              </Link>
            </Button>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss} className="text-emerald-600 hover:text-emerald-700">
                ×
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
