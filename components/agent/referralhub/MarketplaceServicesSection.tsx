"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { Loader2, Search } from "lucide-react"

interface ReferralService {
  id: string
  title: string
  description: string
  cost: number
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
  onSettingsChange: () => void
}

export function MarketplaceServicesSection({ agentId, settings, onSettingsChange }: Props) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [services, setServices] = useState<ReferralService[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getSetting = (id: string) =>
    settings.find((s) => s.item_id === id && s.item_type === "referral_service")

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const headers = getAgentAuthHeaders()
      const q = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const res = await fetch(`/api/agent/store-services?${q}`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setServices(data.services || [])
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load services")
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const toggleVisibility = async (svc: ReferralService, visible: boolean) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: svc.id,
          item_type: "referral_service",
          is_visible: visible,
          custom_margin: 0,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral services</CardTitle>
        <CardDescription>Search and toggle which services appear on your store</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-full"
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map((svc) => {
              const s = getSetting(svc.id)
              const img = svc.image_url || "/placeholder.svg"
              return (
                <div
                  key={svc.id}
                  className="flex flex-col sm:flex-row gap-3 border rounded-lg p-4 w-full"
                >
                  <div className="relative w-full sm:w-20 sm:h-20 aspect-square shrink-0 mx-auto sm:mx-0 max-w-[120px]">
                    <Image
                      src={img}
                      alt={svc.title}
                      fill
                      className="rounded-lg object-cover border"
                      sizes="(max-width: 640px) 100vw, 80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div>
                      <p className="font-medium">{svc.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {svc.description}
                      </p>
                      <p className="text-sm font-semibold mt-1">₵{Number(svc.cost).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {s?.is_visible ? "Visible" : "Hidden"}
                      </span>
                      <Switch
                        checked={s?.is_visible ?? false}
                        onCheckedChange={(v) => toggleVisibility(svc, v)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
      </CardContent>
    </Card>
  )
}
