"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { AD_MEDIA_LABELS, type AdMediaType, type PublicAdPackage } from "@/lib/advertising-types"
import { Megaphone, Loader2, Radio, Tv, Globe, Newspaper, MapPin } from "lucide-react"

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
}

type PackageRow = PublicAdPackage & { is_on_storefront?: boolean }

interface Props {
  agentId: string
  settings: StoreSetting[]
  onSettingsChange: () => void
}

const MEDIA_ICONS: Record<AdMediaType, typeof Radio> = {
  radio: Radio,
  tv: Tv,
  online: Globe,
  print: Newspaper,
  outdoor: MapPin,
  other: Megaphone,
}

export function MarketplaceAdvertisingSection({ agentId, settings, onSettingsChange }: Props) {
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [loading, setLoading] = useState(true)

  const visibleIds = new Set(
    settings.filter((s) => s.item_type === "ad_package" && s.is_visible).map((s) => s.item_id),
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/advertising/packages?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPackages(data.packages || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load advertising packages")
      setPackages([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (packageId: string, visible: boolean) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: packageId,
          item_type: "ad_package",
          is_visible: visible,
          custom_margin: 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      toast.success(visible ? "Package visible on your store" : "Package hidden from store")
      onSettingsChange()
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  return (
    <Card id="advertising-packages-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[#0E8F3D]" />
          Advertising marketplace
        </CardTitle>
        <CardDescription>
          Enable radio, TV, and outdoor packages on your storefront. You earn commission when admin marks
          orders as completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No advertising packages available yet. Check back when admin adds media partner packages.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const Icon = MEDIA_ICONS[pkg.media_type] || Megaphone
              const onStore = visibleIds.has(pkg.id) || pkg.is_on_storefront
              return (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0E8F3D]/15 to-[#35B24A]/25 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-[#0E8F3D]" />
                    </div>
                    <Badge className="bg-[#0E8F3D]/10 text-[#0A5C2A] border-[#0E8F3D]/20 hover:bg-[#0E8F3D]/10">
                      Earn ₵{pkg.agent_commission.toFixed(2)}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="mt-3 text-[10px]">
                    {AD_MEDIA_LABELS[pkg.media_type]}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">{pkg.station_name}</p>
                  <h3 className="font-bold text-slate-900 mt-1">{pkg.package_name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{pkg.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(pkg.custom_fields)
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border text-slate-600"
                        >
                          {k}: {v}
                        </span>
                      ))}
                  </div>
                  <p className="text-xl font-bold text-[#0E8F3D] mt-3">₵{pkg.price.toFixed(2)}</p>
                  <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                    <Label htmlFor={`ad-${pkg.id}`} className="text-sm font-medium">
                      On storefront
                    </Label>
                    <Switch
                      id={`ad-${pkg.id}`}
                      checked={onStore}
                      onCheckedChange={(v) => toggle(pkg.id, v)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
