import { Suspense } from "react"
import FindADateClient from "@/components/agent/dating/FindADateClient"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AgentDatingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rose-50">
          <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        </div>
      }
    >
      <FindADateClient />
    </Suspense>
  )
}
