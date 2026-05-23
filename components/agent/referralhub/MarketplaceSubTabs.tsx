"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  bundles: ReactNode
  services: ReactNode
  wholesale: ReactNode
  compliance: ReactNode
  advertising: ReactNode
  writing: ReactNode
  realEstate: ReactNode
  defaultSubTab?: string
}

const tabTriggerClass =
  "rounded-lg py-2.5 px-2 text-xs sm:text-sm font-semibold transition-all border border-transparent " +
  "data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md " +
  "data-[state=active]:border-slate-900 " +
  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100"

export function MarketplaceSubTabs({
  bundles,
  services,
  wholesale,
  compliance,
  advertising,
  writing,
  realEstate,
  defaultSubTab = "bundles",
}: Props) {
  return (
    <Tabs defaultValue={defaultSubTab} className="w-full">
      <TabsList
        className={cn(
          "w-full h-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1.5 p-1.5 rounded-xl",
          "bg-slate-100/80 border border-slate-200 shadow-inner mb-4",
        )}
      >
        <TabsTrigger value="bundles" className={tabTriggerClass}>
          Data bundles
        </TabsTrigger>
        <TabsTrigger value="services" className={tabTriggerClass}>
          Referral services
        </TabsTrigger>
        <TabsTrigger value="wholesale" className={tabTriggerClass}>
          Wholesale
        </TabsTrigger>
        <TabsTrigger value="compliance" className={tabTriggerClass}>
          Compliance
        </TabsTrigger>
        <TabsTrigger value="advertising" className={tabTriggerClass}>
          Advertising
        </TabsTrigger>
        <TabsTrigger value="writing" className={tabTriggerClass}>
          Writing
        </TabsTrigger>
        <TabsTrigger value="real-estate" className={tabTriggerClass}>
          Real Estate
        </TabsTrigger>
      </TabsList>
      <TabsContent value="bundles" className="mt-0 space-y-6 focus-visible:outline-none">
        {bundles}
      </TabsContent>
      <TabsContent value="services" className="mt-0 focus-visible:outline-none">
        {services}
      </TabsContent>
      <TabsContent value="wholesale" className="mt-0 focus-visible:outline-none">
        {wholesale}
      </TabsContent>
      <TabsContent value="compliance" className="mt-0 focus-visible:outline-none">
        {compliance}
      </TabsContent>
      <TabsContent value="advertising" className="mt-0 focus-visible:outline-none">
        {advertising}
      </TabsContent>
      <TabsContent value="writing" className="mt-0 focus-visible:outline-none">
        {writing}
      </TabsContent>
      <TabsContent value="real-estate" className="mt-0 focus-visible:outline-none">
        {realEstate}
      </TabsContent>
    </Tabs>
  )
}
