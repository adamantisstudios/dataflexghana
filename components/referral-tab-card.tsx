"use client"

import { Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  onTabChange?: (tab: string) => void
}

export function ReferralTabCard({ onTabChange }: Props) {
  return (
    <Card
      className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onTabChange?.("referral-program")}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-emerald-800">Referral Program</h3>
          <p className="text-sm text-emerald-600">Share your unique link and earn 5% commission on each referral</p>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full"
          >
            Start Referring
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
