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
  influencers: ReactNode
  defaultSubTab?: string
}

const tabTriggerClass =
  "rounded-full py-2.5 px-4 text-xs sm:text-sm font-semibold transition-all border border-transparent whitespace-nowrap " +
  "data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow " +
  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100"

const tabDescriptions: Record<string, { title: string; text: string }> = {
  bundles: {
    title: "Data Bundles",
    text: "Sell internet data bundles to customers and earn a commission on every completed sale.",
  },
  services: {
    title: "Referral Services",
    text: "Browse and refer clients to vetted service providers, then get paid when they convert.",
  },
  wholesale: {
    title: "Wholesale Products",
    text: "List and sell wholesale products directly from your storefront to scale your daily earnings.",
  },
  compliance: {
    title: "Compliance",
    text: "Submit customer information for compliance-heavy services like SIM registration and KYC workflows.",
  },
  advertising: {
    title: "Advertising",
    text: "Offer radio and TV advertising packages to businesses and earn markup on campaign placements.",
  },
  writing: {
    title: "Writing Services",
    text: "Promote writing and documentation packages for clients who need professional business or academic support.",
  },
  "real-estate": {
    title: "Real Estate",
    text: "Promote property sales and rentals while earning commissions from successful closes and referrals.",
  },
  influencers: {
    title: "Micro-Influencers",
    text: "Connect influencers with small businesses for paid promotions and referral-based campaign payouts.",
  },
}

function DescriptionBanner({ tab }: { tab: keyof typeof tabDescriptions }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">{tabDescriptions[tab].title}</h4>
      <p className="mt-1 text-sm text-slate-600">{tabDescriptions[tab].text}</p>
    </div>
  )
}

export function MarketplaceSubTabs({
  bundles,
  services,
  wholesale,
  compliance,
  advertising,
  writing,
  realEstate,
  influencers,
  defaultSubTab = "bundles",
}: Props) {
  return (
    <Tabs defaultValue={defaultSubTab} className="w-full space-y-4">
      <TabsList
        className={cn(
          "h-auto w-full justify-start gap-2 overflow-x-auto whitespace-nowrap rounded-2xl p-2",
          "bg-white border border-slate-200 shadow-sm",
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
        <TabsTrigger value="influencers" className={tabTriggerClass}>
          Micro-Influencers
        </TabsTrigger>
      </TabsList>
      <TabsContent value="bundles" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="bundles" />
        {bundles}
      </TabsContent>
      <TabsContent value="services" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="services" />
        {services}
      </TabsContent>
      <TabsContent value="wholesale" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="wholesale" />
        {wholesale}
      </TabsContent>
      <TabsContent value="compliance" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="compliance" />
        {compliance}
      </TabsContent>
      <TabsContent value="advertising" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="advertising" />
        {advertising}
      </TabsContent>
      <TabsContent value="writing" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="writing" />
        {writing}
      </TabsContent>
      <TabsContent value="real-estate" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="real-estate" />
        {realEstate}
      </TabsContent>
      <TabsContent value="influencers" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2">
        <DescriptionBanner tab="influencers" />
        {influencers}
      </TabsContent>
    </Tabs>
  )
}
