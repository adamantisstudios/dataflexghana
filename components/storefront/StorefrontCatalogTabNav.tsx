"use client"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wifi, Users, ShoppingBag, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export type StorefrontTabId = "bundles" | "services" | "products" | "business"

const TABS: {
  id: StorefrontTabId
  label: string
  short: string
  icon: typeof Wifi
}[] = [
  { id: "bundles", label: "Data Bundles", short: "Bundles", icon: Wifi },
  { id: "services", label: "Referral Services", short: "Services", icon: Users },
  { id: "products", label: "Wholesale Shopping", short: "Wholesale", icon: ShoppingBag },
  { id: "business", label: "Compliance", short: "Compliance", icon: ShieldCheck },
]

type Props = {
  activeTab: StorefrontTabId
  accent: string
  visible: Partial<Record<StorefrontTabId, boolean>>
  counts?: Partial<Record<StorefrontTabId, number>>
}

export function StorefrontCatalogTabNav({ activeTab, accent, visible, counts }: Props) {
  const tabs = TABS.filter((t) => visible[t.id])
  if (tabs.length === 0) return null

  return (
    <TabsList
      className={cn(
        "w-full h-auto p-1 gap-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner",
        "flex overflow-x-auto snap-x snap-mandatory scrollbar-none",
        tabs.length <= 2 ? "grid grid-cols-2" : tabs.length === 3 ? "grid grid-cols-3" : "grid grid-cols-2 sm:grid-cols-4",
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const count = counts?.[tab.id]
        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "snap-center shrink-0 rounded-xl py-3 px-2 sm:px-3 flex flex-col items-center justify-center gap-1.5",
              "border-2 font-semibold transition-all min-h-[4.25rem]",
              "data-[state=inactive]:bg-white data-[state=inactive]:text-slate-600 data-[state=inactive]:border-slate-200",
              "data-[state=inactive]:hover:border-slate-300 data-[state=inactive]:hover:bg-slate-50",
              "data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-md",
            )}
            style={isActive ? { backgroundColor: accent } : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="text-[10px] sm:text-xs leading-tight text-center whitespace-nowrap">
              {tab.short}
            </span>
            {count != null && count > 0 && (
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full tabular-nums",
                  isActive ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700",
                )}
              >
                {count}
              </span>
            )}
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
