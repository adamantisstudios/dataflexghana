"use client"

import { Suspense } from "react"
import { FarmersFriendMarketplace } from "@/components/farmers/FarmersFriendMarketplace"

type Props = {
  agentId: string
  storeSegment: string
  accent: string
}

export function StorefrontFarmProduceTab({ agentId, storeSegment, accent }: Props) {
  return (
    <Suspense fallback={<p className="text-center py-8 text-muted-foreground">Loading produce…</p>}>
      <FarmersFriendMarketplace agentId={agentId} storeSegment={storeSegment} accent={accent} embedded />
    </Suspense>
  )
}
