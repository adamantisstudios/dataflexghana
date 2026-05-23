"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Search, ShoppingCart, Leaf, MapPin, CheckCircle2 } from "lucide-react"
import type { PublicFarmListing } from "@/lib/farm-types"
import { loadFarmCart, saveFarmCart, newFarmLineId, type FarmCartLine } from "@/lib/farm-cart"

type Props = {
  agentId?: string
  storeSegment?: string
  accent?: string
  embedded?: boolean
}

export function FarmersFriendMarketplace({
  agentId,
  storeSegment,
  accent = "#0E8F3D",
  embedded = false,
}: Props) {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<PublicFarmListing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [cart, setCart] = useState<FarmCartLine[]>([])
  const [selected, setSelected] = useState<PublicFarmListing | null>(null)
  const [qty, setQty] = useState("1")

  const cartScope = agentId ? { agentId } : ("global" as const)

  useEffect(() => {
    setCart(loadFarmCart(cartScope))
  }, [agentId])

  const farmPaid = searchParams.get("farm_payment") === "success"
  const farmRef = searchParams.get("ref")

  useEffect(() => {
    if (farmPaid && farmRef) {
      toast.success(`Order confirmed! Reference: ${farmRef}`)
      saveFarmCart(cartScope, [])
      setCart([])
    }
  }, [farmPaid, farmRef, cartScope])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (location.trim()) params.set("location", location.trim())
      if (agentId) params.set("agentId", agentId)
      const res = await fetch(`/api/farmers/public/listings?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListings(data.listings || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load produce")
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [search, location, agentId])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0)
  const cartHref = agentId && storeSegment
    ? `/store/${encodeURIComponent(storeSegment)}/farm-cart`
    : "/farmersfriend/cart"

  const addToCart = (listing: PublicFarmListing, quantity: number) => {
    if (quantity <= 0 || quantity > listing.quantity_available) {
      toast.error("Invalid quantity")
      return
    }
    const line: FarmCartLine = { lineId: newFarmLineId(), listing, quantity }
    const existing = cart.find((c) => c.listing.id === listing.id)
    let next: FarmCartLine[]
    if (existing) {
      next = cart.map((c) =>
        c.listing.id === listing.id
          ? { ...c, quantity: Math.min(listing.quantity_available, c.quantity + quantity) }
          : c,
      )
    } else {
      next = [...cart, line]
    }
    setCart(next)
    saveFarmCart(cartScope, next)
    toast.success("Added to cart")
    setSelected(null)
  }

  const filtered = useMemo(() => listings, [listings])

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-b from-emerald-50/80 to-white"}>
      {!embedded && (
        <header
          className="text-white px-4 py-10 sm:py-14"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, #35B24A 100%)` }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-white/80 uppercase tracking-widest font-medium">Farmers Friend</p>
                <h1 className="text-3xl sm:text-4xl font-bold mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Fresh Farm Produce
                </h1>
                <p className="mt-2 text-white/90 max-w-xl">
                  Agent-sourced produce from trusted farms. Pay securely, arrange delivery — farmer details stay private.
                </p>
              </div>
              <Link href={cartHref}>
                <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cartCount})
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className={embedded ? "" : "max-w-6xl mx-auto px-4 py-8 space-y-6"}>
        {farmPaid && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="h-6 w-6 text-green-700 shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Payment received — thank you!</p>
              <p className="text-sm text-green-800 mt-1">We will contact you to arrange delivery.</p>
            </div>
          </div>
        )}

        {embedded && (
          <div className="flex justify-end">
            <Link href={cartHref}>
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({cartCount})
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search produce…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input
            className="sm:w-56"
            placeholder="Filter by region…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-16">Loading fresh produce…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No listings available right now.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-emerald-50">
                  {item.photos[0] ? (
                    <Image src={item.photos[0]} alt={item.produce_name} fill className="object-cover" sizes="33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Leaf className="h-12 w-12 text-emerald-300" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h2 className="font-bold text-lg">{item.produce_name}</h2>
                  {item.region_hint && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.region_hint}
                    </p>
                  )}
                  {item.notes && <p className="text-sm text-slate-600 line-clamp-2">{item.notes}</p>}
                  <div className="flex items-end justify-between pt-2">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: accent }}>
                        ₵{item.retail_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per {item.unit} · {item.quantity_available} available
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="text-white"
                      style={{ backgroundColor: accent }}
                      onClick={() => {
                        setSelected(item)
                        setQty("1")
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold">{selected.produce_name}</h3>
            {selected.notes && <p className="text-sm text-muted-foreground">{selected.notes}</p>}
            <p className="text-2xl font-bold text-[#0E8F3D]">₵{selected.retail_price.toFixed(2)} / {selected.unit}</p>
            <div>
              <label className="text-sm font-medium">Quantity ({selected.unit})</label>
              <Input
                type="number"
                min={0.1}
                max={selected.quantity_available}
                step={0.1}
                className="mt-1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0E8F3D] hover:bg-[#0A5C2A] text-white"
                onClick={() => addToCart(selected, Number(qty))}
              >
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
