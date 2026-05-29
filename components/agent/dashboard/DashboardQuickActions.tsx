"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, CreditCard, Users, MessageCircle, Plus, Megaphone } from "lucide-react"
import { getAnnouncementsMemberPath } from "@/lib/announcements-channel"

type Props = {
  onInviteFriends: () => void
}

export function DashboardQuickActions({ onInviteFriends }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#0E8F3D]/10 rounded-full flex items-center justify-center shrink-0">
            <Megaphone className="h-5 w-5 text-[#0E8F3D]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">Announcements</h3>
            <p className="text-gray-500 text-xs">Official platform updates</p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full min-h-[44px] bg-[#0E8F3D] text-white hover:bg-[#0a7a34] font-medium">
          <Link href={getAnnouncementsMemberPath()} prefetch={false}>
            Open Announcements
          </Link>
        </Button>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-violet-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">Top Up Wallet</h3>
            <p className="text-gray-500 text-xs">Add funds for faster purchases</p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full min-h-[44px] bg-violet-600 text-white hover:bg-violet-700 font-medium">
          <Link href="/agent/wallet?tab=topup">
            <Plus className="h-4 w-4 mr-2" />
            Top Up Wallet
          </Link>
        </Button>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">Invite Friends</h3>
            <p className="text-gray-500 text-xs">Earn ₵5 when they join</p>
          </div>
        </div>
        <Button
          onClick={onInviteFriends}
          size="sm"
          className="w-full min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Send Referral Message
        </Button>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-blue-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">Platform Blog</h3>
            <p className="text-gray-500 text-xs">Read updates and tips</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="w-full min-h-[44px] font-medium border-gray-200">
          <Link href="/blogs" prefetch={false}>
            Open Blog
          </Link>
        </Button>
      </div>
    </div>
  )
}
