"use client"

import type { CSSProperties } from "react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smartphone, Users, ShoppingBag, FileText, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

export type StorefrontTabId = "bundles" | "services" | "products" | "business" | "advertise"

const TABS: {
  id: StorefrontTabId
  label: string
  short: string
  icon: typeof Smartphone
  iconClass: string
  inactiveBg: string
}[] = [
  {
    id: "bundles",
    label: "Data Bundles",
    short: "Bundles",
    icon: Smartphone,
    iconClass: "text-violet-600",
    inactiveBg: "bg-gradient-to-br from-violet-100 to-purple-50",
  },
  {
    id: "services",
    label: "Referral Services",
    short: "Services",
    icon: Users,
    iconClass: "text-teal-600",
    inactiveBg: "bg-gradient-to-br from-teal-100 to-cyan-50",
  },
  {
    id: "products",
    label: "Wholesale Shopping",
    short: "Wholesale",
    icon: ShoppingBag,
    iconClass: "text-emerald-600",
    inactiveBg: "bg-gradient-to-br from-emerald-100 to-green-50",
  },
  {
    id: "business",
    label: "Compliance",
    short: "Compliance",
    icon: FileText,
    iconClass: "text-indigo-600",
    inactiveBg: "bg-gradient-to-br from-indigo-100 to-violet-50",
  },
  {
    id: "advertise",
    label: "Advertise",
    short: "Advertise",
    icon: Megaphone,
    iconClass: "text-[#0E8F3D]",
    inactiveBg: "bg-gradient-to-br from-emerald-100 to-green-50",
  },
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
        "w-full h-auto p-1.5 gap-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner",
        "flex overflow-x-auto snap-x snap-mandatory scrollbar-none",
        tabs.length <= 2
          ? "grid grid-cols-2"
          : tabs.length === 3
            ? "grid grid-cols-3"
            : tabs.length === 4
              ? "grid grid-cols-2 sm:grid-cols-4"
              : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
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
              "snap-center shrink-0 rounded-xl py-2.5 px-2 sm:px-3 flex flex-col items-center justify-center gap-1.5",
              "border-2 font-semibold transition-all min-h-[4.5rem]",
              "data-[state=inactive]:border-slate-200 data-[state=inactive]:text-slate-700",
              "data-[state=inactive]:hover:border-slate-300 data-[state=inactive]:shadow-sm",
              "data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-offset-2",
            )}
            style={
              isActive
                ? ({ backgroundColor: accent, "--tw-ring-color": accent } as CSSProperties)
                : undefined
            }
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                isActive ? "bg-white/20" : tab.inactiveBg,
              )}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : tab.iconClass)}
                strokeWidth={2.25}
              />
            </span>
            <span className="text-[10px] sm:text-xs leading-tight text-center whitespace-nowrap">
              {tab.short}
            </span>
            {count != null && count > 0 && (
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full tabular-nums font-bold",
                  isActive ? "bg-white/25 text-white" : "bg-white text-slate-700 border border-slate-200",
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
