"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreditCard, Users, MessageCircle, Plus } from "lucide-react"

type Props = {
  onInviteFriends: () => void
}

export function DashboardQuickActions({ onInviteFriends }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full">
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-5 border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Top Up Wallet</h3>
            <p className="text-purple-100 text-xs">Add funds for faster purchases</p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full bg-white text-purple-600 hover:bg-purple-50 font-medium">
          <Link href="/agent/wallet?tab=topup">
            <Plus className="h-4 w-4 mr-2" />
            Top Up Wallet
          </Link>
        </Button>
      </div>
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 sm:p-5 border border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Invite Friends</h3>
            <p className="text-green-100 text-xs">Earn ₵7 when they join</p>
          </div>
        </div>
        <Button
          onClick={onInviteFriends}
          size="sm"
          className="w-full bg-white text-green-600 hover:bg-green-50 font-medium"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Send Referral Message
        </Button>
      </div>
    </div>
  )
}
