import { Suspense } from "react"
import { FarmersFriendMarketplace } from "@/components/farmers/FarmersFriendMarketplace"

export default function FarmersFriendPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading Farmers Friend…
        </div>
      }
    >
      <FarmersFriendMarketplace />
    </Suspense>
  )
}
