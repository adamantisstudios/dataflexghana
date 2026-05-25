"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Loader2, Phone } from "lucide-react"

type FollowUpRow = {
  id: string
  agent_id: string
  agent_name: string
  agent_phone: string
  follow_up_date: string
  call_status: string
}

export function FollowUpsTodayCard() {
  const [items, setItems] = useState<FollowUpRow[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/agent-calls?follow_up=true&follow_up_date=${today}&limit=20`,
        { headers: getAdminAuthHeaders() },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(data.logs || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2 text-amber-900">
          <Phone className="h-5 w-5" />
          Follow-Ups Today
        </CardTitle>
        <Link href="/admin/agent-calls">
          <Button variant="outline" size="sm" className="text-xs h-8">
            View all calls
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No follow-ups scheduled for today.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/agent-calls?agent_id=${encodeURIComponent(row.agent_id)}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 hover:border-amber-300 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{row.agent_name}</p>
                    <p className="text-xs text-muted-foreground">{row.agent_phone}</p>
                  </div>
                  <span className="text-[10px] uppercase text-amber-700 shrink-0">{row.call_status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
