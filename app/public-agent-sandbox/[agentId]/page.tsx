import { Suspense } from "react"
import PublicAgentStorefront from "./storefront-client"

type PageProps = {
  params: Promise<{ agentId: string }>
}

export default async function PublicAgentStorefrontPage({ params }: PageProps) {
  const { agentId } = await params
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
          Loading store…
        </div>
      }
    >
      <PublicAgentStorefront agentId={agentId} />
    </Suspense>
  )
}
