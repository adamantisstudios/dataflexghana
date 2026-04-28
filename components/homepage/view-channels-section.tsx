"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Users, Eye, Lock, Unlock, ArrowRight, BookOpen } from 'lucide-react'
import { toast } from "sonner"

interface Channel {
  id: string
  name: string
  description: string
  category: string
  is_public: boolean
  image_url?: string
  created_at: string
  member_count?: number
  subscription_fee?: number
  is_subscription_required?: boolean
}

export function ViewChannelsSection() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const { data: channelData, error: channelsError } = await supabase
        .from("teaching_channels")
        .select("*")
        .eq("is_public", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10)

      if (channelsError) throw channelsError

      const { data: memberCounts } = await supabase
        .from("channel_members")
        .select("channel_id")

      const countMap = new Map<string, number>()
      memberCounts?.forEach((m: any) => {
        countMap.set(m.channel_id, (countMap.get(m.channel_id) || 0) + 1)
      })

      const { data: subscriptionSettings } = await supabase
        .from("channel_subscription_settings")
        .select("channel_id, is_enabled, monthly_fee")

      const subscriptionMap = new Map()
      subscriptionSettings?.forEach((s: any) => {
        subscriptionMap.set(s.channel_id, {
          is_enabled: s.is_enabled,
          monthly_fee: s.monthly_fee,
        })
      })

      const enrichedChannels = (channelData || []).map((channel: any) => ({
        ...channel,
        member_count: countMap.get(channel.id) || 0,
        subscription_fee: subscriptionMap.get(channel.id)?.monthly_fee || 0,
        is_subscription_required: subscriptionMap.get(channel.id)?.is_enabled || false,
      }))

      setChannels(enrichedChannels)
    } catch (error) {
      console.error("[v0] Error loading channels:", error)
      toast.error("Failed to load channels")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 mb-4">
            <BookOpen className="h-3 w-3 mr-1" />
            Learning Hub
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Join Teacher <span className="text-indigo-600">Channels</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with expert teachers and mentors. Access exclusive educational content and join private or public channels on DataFlex Ghana. 
            <span className="font-semibold text-indigo-600 block mt-2">Some channels may require a monthly subscription for full access.</span>
          </p>
        </div>

        {/* Channels Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-indigo-100 bg-white/90">
                <CardHeader>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <Card className="bg-indigo-50 border-indigo-200 text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-gray-600">No channels available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <Card
                key={channel.id}
                className="border-indigo-100 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="relative">
                  {/* Channel Image */}
                  {channel.image_url && (
                    <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-100">
                      <img
                        src={channel.image_url || "/placeholder.svg"}
                        alt={channel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Subscription Badge */}
                  {channel.is_subscription_required && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <Lock className="h-3 w-3 mr-1" />
                        Paid Channel
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-lg text-indigo-800 line-clamp-2">{channel.name}</CardTitle>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{channel.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 justify-center">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {channel.member_count || 0} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {channel.is_public ? "Public" : "Private"}
                    </span>
                  </div>

                  {/* Category */}
                  <Badge variant="secondary" className="text-xs w-fit mx-auto">
                    {channel.category}
                  </Badge>

                  {/* Subscription Info */}
                  {channel.is_subscription_required && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-auto">
                      <p className="text-xs text-red-700 font-semibold">
                        Monthly Fee: GH₵ {channel.subscription_fee?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Subscription required to access channel content
                      </p>
                    </div>
                  )}

                  {/* Join Button */}
                  <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Link href="/agent/register">
                      {channel.is_subscription_required ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          View & Subscribe
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Join Channel
                        </>
                      )}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Want to explore all channels?</p>
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/agent/register">
              Register to Access All Channels
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
