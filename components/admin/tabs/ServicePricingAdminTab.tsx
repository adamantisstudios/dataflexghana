"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import { Loader2, RefreshCw, Save } from "lucide-react"
import {
  COMPLIANCE_PRICING_GROUPS,
  DEFAULT_COMPLIANCE_PRICING_ROWS,
} from "@/lib/compliance-form-pricing-defaults"
import type { ServicePricingRow } from "@/lib/service-pricing-types"
import { invalidateCompliancePricingCache } from "@/components/agent/compliance/CompliancePricingProvider"

export default function ServicePricingAdminTab() {
  const [pricing, setPricing] = useState<ServicePricingRow[]>(DEFAULT_COMPLIANCE_PRICING_ROWS)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/service-pricing", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setPricing(data.pricing || DEFAULT_COMPLIANCE_PRICING_ROWS)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load service pricing")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateLocal = (key: string, amount: number) => {
    setPricing((prev) => prev.map((row) => (row.key === key ? { ...row, amount } : row)))
  }

  const saveRow = async (row: ServicePricingRow) => {
    setSavingKey(row.key)
    try {
      const res = await fetch("/api/admin/service-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify(row),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.hint || "Save failed")
      setPricing(data.pricing || [])
      invalidateCompliancePricingCache()
      toast.success(`${row.label} updated`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingKey(null)
    }
  }

  const rowByKey = new Map(pricing.map((r) => [r.key, r]))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading service pricing…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Compliance &amp; service pricing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All agent compliance form fees and commissions. Agent registration (₵47 / ₵50) stays fixed in code.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 text-sm text-amber-900">
          First-time setup: run{" "}
          <code className="text-xs bg-white px-1 py-0.5 rounded">scripts/platform-service-pricing.sql</code> in
          Supabase if saving fails with a missing-table error.
        </CardContent>
      </Card>

      {COMPLIANCE_PRICING_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.keys.map((key) => {
              const row = rowByKey.get(key)
              if (!row) return null
              return (
                <div key={key} className="flex flex-wrap items-end gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <Label>{row.label}</Label>
                    {row.description ? (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2 min-w-[140px]">
                    <Label>Amount (GHS)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateLocal(key, Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={() => saveRow(row)} disabled={savingKey === key} size="sm">
                    {savingKey === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
