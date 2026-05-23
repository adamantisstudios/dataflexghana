"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import type { AgentPropertyCatalogRow } from "@/lib/property-types"
import { Home, Loader2, MapPin, AlertTriangle } from "lucide-react"

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
}

interface Props {
  agentId: string
  settings: StoreSetting[]
  onSettingsChange: () => void
}

function formatPrice(price: number, currency: string) {
  if (currency === "GHS") return `₵${price.toLocaleString()}`
  return `${currency} ${price.toLocaleString()}`
}

function PropertyToggleRow({
  row,
  toggling,
  onToggle,
}: {
  row: AgentPropertyCatalogRow
  toggling: boolean
  onToggle: (id: string, visible: boolean) => void
}) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-white">
      <div className="relative h-16 w-20 shrink-0 rounded-md overflow-hidden bg-slate-100">
        {row.image_urls[0] ? (
          <Image src={row.image_urls[0]} alt="" fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Home className="h-6 w-6 text-slate-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-2">{row.title}</p>
        <p className="text-sm font-semibold text-emerald-700">{formatPrice(row.price, row.currency)}</p>
        {row.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {row.location}
          </p>
        )}
        {row.is_own_listing && (
          <Badge variant="outline" className="mt-1 text-[10px]">
            Your listing
          </Badge>
        )}
      </div>
      <div className="flex flex-col items-end justify-center gap-1 shrink-0">
        <Switch
          checked={row.is_on_storefront}
          disabled={toggling}
          onCheckedChange={(c) => onToggle(row.id, c)}
          id={`property-${row.id}`}
        />
        <Label htmlFor={`property-${row.id}`} className="text-[10px] text-muted-foreground">
          On store
        </Label>
      </div>
    </div>
  )
}

export function MarketplaceRealEstateSection({ agentId, onSettingsChange }: Props) {
  const [own, setOwn] = useState<AgentPropertyCatalogRow[]>([])
  const [platform, setPlatform] = useState<AgentPropertyCatalogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [suspended, setSuspended] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/store-properties?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setOwn(data.own || [])
      setPlatform(data.platform || [])
      setSuspended(Boolean(data.suspended))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load properties")
      setOwn([])
      setPlatform([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (propertyId: string, visible: boolean) => {
    if (suspended) {
      toast.error("Your storefront is suspended. Contact support.")
      return
    }
    setTogglingId(propertyId)
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: propertyId,
          item_type: "property",
          is_visible: visible,
          custom_margin: 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      toast.success(visible ? "Property visible on your store" : "Property hidden from store")
      onSettingsChange()
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (suspended) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your storefront has been suspended. Property listings cannot be shown until an admin reactivates your store.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-300 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertDescription className="text-amber-900 text-sm">
          You must personally know the property owner and have permission to list. Fake or unauthorized listings will
          result in your storefront being permanently suspended.{" "}
          <Link href="/real-estate-terms" className="font-semibold underline">
            Read full terms
          </Link>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Home className="h-5 w-5 text-amber-700" />
            Real Estate on your storefront
          </CardTitle>
          <CardDescription>
            Toggle your approved listings and platform properties you want to promote. Customers contact you directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="own">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="own">My listings ({own.length})</TabsTrigger>
              <TabsTrigger value="platform">Platform ({platform.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="own" className="space-y-2 mt-0">
              {own.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No approved listings yet.{" "}
                  <Link href="/agent/publish-properties" className="text-emerald-700 font-medium underline">
                    Publish a property
                  </Link>
                </p>
              ) : (
                own.map((row) => (
                  <PropertyToggleRow
                    key={row.id}
                    row={row}
                    toggling={togglingId === row.id}
                    onToggle={toggle}
                  />
                ))
              )}
            </TabsContent>
            <TabsContent value="platform" className="space-y-2 mt-0">
              {platform.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No platform properties available to promote right now.
                </p>
              ) : (
                platform.map((row) => (
                  <PropertyToggleRow
                    key={row.id}
                    row={row}
                    toggling={togglingId === row.id}
                    onToggle={toggle}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
