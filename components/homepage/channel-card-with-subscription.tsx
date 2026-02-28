"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface ChannelCardProps {
  id: string
  name: string
  description: string
  image_url?: string
  category?: string
  member_count?: number
  is_subscription_required: boolean
  monthly_fee?: number
  currency?: string
  is_member?: boolean
  onJoinClick: (channelId: string) => void
}

export function ChannelCardWithSubscription({
  id,
  name,
  description,
  image_url,
  category,
  member_count,
  is_subscription_required,
  monthly_fee,
  currency = "GHS",
  is_member,
  onJoinClick,
}: ChannelCardProps) {
  const router = useRouter()

  if (is_member) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4" onClick={() => router.push(`/teaching/channels/${id}`)}>
          {image_url && (
            <div className="w-full h-40 rounded-lg mb-3 overflow-hidden bg-gray-100">
              <img src={image_url || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-800 line-clamp-2">{name}</h3>
              <Badge className="shrink-0 bg-green-100 text-green-800">Member</Badge>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4 space-y-3">
        {image_url && (
          <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100 relative">
            <img src={image_url || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
            {is_subscription_required && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-white rounded-full p-3">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-800 line-clamp-2">{name}</h3>
            <Badge className={is_subscription_required ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
              {is_subscription_required ? "Paid Channel" : "Free Channel"}
            </Badge>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2">{description}</p>

          {is_subscription_required && monthly_fee && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              <p className="text-sm font-semibold text-amber-900">
                {currency} {monthly_fee.toFixed(2)}/month
              </p>
              <p className="text-xs text-amber-700">Subscription required to join</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            {member_count !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {member_count} members
              </span>
            )}
            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={() => onJoinClick(id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
          {is_subscription_required ? "Request Access" : "Join Channel"}
        </Button>
      </CardContent>
    </Card>
  )
}
