"use client"

import { StoreSocialShareButtons } from "@/components/shared/StoreSocialShareButtons"

type Props = {
  agentId: string
  storeSlug?: string | null
  storeName: string
}

export function StorefrontSocialShareBar({ agentId, storeSlug, storeName }: Props) {
  return (
    <>
      <StoreSocialShareButtons
        agentId={agentId}
        storeSlug={storeSlug}
        storeName={storeName}
        layout="floating-desktop"
      />
      <StoreSocialShareButtons
        agentId={agentId}
        storeSlug={storeSlug}
        storeName={storeName}
        layout="floating-mobile"
      />
    </>
  )
}
