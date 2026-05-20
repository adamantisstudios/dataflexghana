"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { BUNDLE_NETWORKS, type BundleNetwork } from "@/lib/storefront-utils"
import { getNetworkProviderImage } from "@/lib/network-provider-icons"
import { Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DataBundle {
  id: string
  name: string
  provider: string
  size_gb: number
  price: number
  image_url?: string | null
}

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
  custom_margin: number
}

interface Props {
  agentId: string
  settings: StoreSetting[]
  savedBundles: DataBundle[]
  onSettingsChange: () => void
}

function NetworkTabLabel({ network }: { network: BundleNetwork }) {
  return (
    <span className="flex items-center justify-center gap-1.5">
      <span className="relative h-6 w-6 shrink-0 rounded overflow-hidden border border-slate-200">
        <Image
          src={getNetworkProviderImage(network)}
          alt={`${network} logo`}
          fill
          className="object-cover"
          sizes="24px"
        />
      </span>
      <span className="truncate">{network}</span>
    </span>
  )
}

export function MarketplaceBundlesSection({
  agentId,
  settings,
  savedBundles,
  onSettingsChange,
}: Props) {
  const [network, setNetwork] = useState<BundleNetwork>("MTN")
  const [bundles, setBundles] = useState<DataBundle[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [margins, setMargins] = useState<Record<string, string>>({})

  const savedSettings = settings.filter((s) => s.item_type === "data_bundle")

  const fetchBundles = useCallback(async () => {
    setLoading(true)
    try {
      const headers = getAgentAuthHeaders()
      const res = await fetch(
        `/api/agent/store-bundles?provider=${encodeURIComponent(network)}&page=${page}&limit=20`,
        { headers },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBundles(data.bundles || [])
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load bundles")
    } finally {
      setLoading(false)
    }
  }, [network, page])

  useEffect(() => {
    fetchBundles()
  }, [fetchBundles])

  useEffect(() => {
    setPage(1)
  }, [network])

  const addToStore = async (bundleId: string, margin: number) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: bundleId,
          item_type: "data_bundle",
          is_visible: true,
          custom_margin: margin,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Added to store")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add")
    }
  }

  const updateMargin = async (bundleId: string, margin: number) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: bundleId,
          item_type: "data_bundle",
          is_visible: true,
          custom_margin: margin,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Margin updated")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const removeFromStore = async (bundleId: string) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ agentId, item_id: bundleId, item_type: "data_bundle" }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Removed from store")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed")
    }
  }

  const bundleById = (id: string) => savedBundles.find((b) => b.id === id)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data bundles</CardTitle>
          <CardDescription>Pick a network, set your margin, then add to your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={network} onValueChange={(v) => setNetwork(v as BundleNetwork)}>
            <TabsList className="w-full grid grid-cols-3 h-auto p-1 gap-1">
              {BUNDLE_NETWORKS.map((n) => (
                <TabsTrigger
                  key={n}
                  value={n}
                  className={cn(
                    "text-xs sm:text-sm py-2 data-[state=active]:bg-emerald-700 data-[state=active]:text-white",
                  )}
                >
                  <NetworkTabLabel network={n} />
                </TabsTrigger>
              ))}
            </TabsList>

            {BUNDLE_NETWORKS.map((n) => (
              <TabsContent key={n} value={n} className="mt-4">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 border rounded-lg p-4">
                        <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-9 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bundles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bundles for {n}.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {bundles.map((b) => {
                      const marginVal = margins[b.id] ?? "0"
                      const inStore = savedSettings.some((s) => s.item_id === b.id)
                      return (
                        <div
                          key={b.id}
                          className="flex flex-row gap-3 border rounded-lg p-4 w-full items-start bg-white shadow-sm"
                        >
                          <span className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border bg-slate-50">
                            <Image
                              src={getNetworkProviderImage(b.provider)}
                              alt={b.provider}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </span>
                          <div className="flex-1 min-w-0 space-y-2">
                            <p className="font-medium">{b.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.provider} · {b.size_gb}GB · Base ₵{Number(b.price).toFixed(2)}
                            </p>
                            <div className="flex flex-col xs:flex-row gap-2 items-stretch sm:items-end">
                              <div className="w-full sm:max-w-[140px]">
                                <Label className="text-xs">Margin (₵)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={marginVal}
                                  onChange={(e) => setMargins((m) => ({ ...m, [b.id]: e.target.value }))}
                                  className="w-full"
                                />
                              </div>
                              <Button
                                className="w-full sm:w-auto"
                                disabled={inStore}
                                onClick={() => addToStore(b.id, parseFloat(marginVal) || 0)}
                              >
                                {inStore ? "In store" : "Add to Store"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm self-center">
                          Page {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your store bundles</CardTitle>
          <CardDescription>Items currently in your storefront</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedSettings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bundles in your store yet.</p>
          ) : (
            savedSettings.map((s) => {
              const b = bundleById(s.item_id)
              return (
                <div
                  key={s.item_id}
                  className="flex flex-row gap-3 border rounded-lg p-4 items-start bg-white shadow-sm"
                >
                  <span className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border bg-slate-50">
                    <Image
                      src={getNetworkProviderImage(b?.provider || "MTN")}
                      alt={b?.provider || "Network"}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-medium">{b?.name || s.item_id.slice(0, 8)}</p>
                    {b && (
                      <p className="text-xs text-muted-foreground">
                        {b.provider} · {b.size_gb}GB · Base ₵{Number(b.price).toFixed(2)} · Sell ₵
                        {(Number(b.price) + Number(s.custom_margin)).toFixed(2)}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                      <div className="w-full sm:max-w-[140px]">
                        <Label className="text-xs">Margin (₵)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          defaultValue={s.custom_margin}
                          onBlur={(e) =>
                            updateMargin(s.item_id, parseFloat(e.target.value) || 0)
                          }
                          className="w-full"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => removeFromStore(s.item_id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
