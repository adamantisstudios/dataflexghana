"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { StorefrontQrCard } from "@/components/agent/referralhub/StorefrontQrCard"
import { MarketplaceBundlesSection } from "@/components/agent/referralhub/MarketplaceBundlesSection"
import { MarketplaceServicesSection } from "@/components/agent/referralhub/MarketplaceServicesSection"
import { StorefrontOrdersSection } from "@/components/agent/referralhub/StorefrontOrdersSection"
import { buildStorefrontUrl } from "@/lib/storefront-utils"
import Link from "next/link"
import { ArrowLeft, Store, Loader2, Check, X } from "lucide-react"
import { ReferralHubSkeleton } from "@/components/agent/referralhub/ReferralHubSkeleton"
import { ReferralHubEarningsTip } from "@/components/agent/referralhub/ReferralHubEarningsTip"
import { MarketplaceWholesaleSection } from "@/components/agent/referralhub/MarketplaceWholesaleSection"
import { MarketplaceComplianceSection } from "@/components/agent/referralhub/MarketplaceComplianceSection"
import { MarketplaceSubTabs } from "@/components/agent/referralhub/MarketplaceSubTabs"
import { MarketplaceAdvertisingSection } from "@/components/agent/referralhub/MarketplaceAdvertisingSection"
import { MarketplaceWritingSection } from "@/components/agent/referralhub/MarketplaceWritingSection"
import { MarketplaceRealEstateSection } from "@/components/agent/referralhub/MarketplaceRealEstateSection"
import { MarketplaceInfluencersSection } from "@/components/agent/referralhub/MarketplaceInfluencersSection"
import { MarketplaceMyListingsSection } from "@/components/agent/referralhub/MarketplaceMyListingsSection"
import { FarmersFriendHub } from "@/components/agent/farmersfriend/FarmersFriendHub"
import { Switch } from "@/components/ui/switch"

interface AgentSession {
  id: string
  full_name?: string
}

interface StoreProfile {
  store_name: string | null
  store_slug: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
  whatsapp_channel_url: string | null
  show_whatsapp_popup: boolean
}

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
  custom_margin: number
}

interface DataBundle {
  id: string
  name: string
  provider: string
  size_gb: number
  price: number
  image_url?: string | null
}

export default function ReferralHubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agent, setAgent] = useState<AgentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StoreProfile>({
    store_name: "",
    store_slug: "",
    whatsapp_number: "",
    phone_number: "",
    primary_color: "#3B82F6",
    business_info: "",
    whatsapp_channel_url: "",
    show_whatsapp_popup: true,
  })
  const [settings, setSettings] = useState<StoreSetting[]>([])
  const [savedBundles, setSavedBundles] = useState<DataBundle[]>([])
  const [savedWholesale, setSavedWholesale] = useState<
    { id: string; name: string; description: string | null; price: number; image_url?: string | null }[]
  >([])
  const [commissionBalance, setCommissionBalance] = useState(0)
  const [saving, setSaving] = useState(false)
  const [slugInput, setSlugInput] = useState("")
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "bad">("idle")
  const [slugMessage, setSlugMessage] = useState("")
  const hubTabFromUrl = searchParams.get("hubTab")
  const marketplaceTabFromUrl = searchParams.get("marketplaceTab")
  const [hubTab, setHubTab] = useState(
    hubTabFromUrl === "listings"
      ? "listings"
      : hubTabFromUrl === "marketplace" ||
          marketplaceTabFromUrl === "real-estate" ||
          marketplaceTabFromUrl === "influencers"
        ? "marketplace"
        : "profile",
  )

  useEffect(() => {
    const raw = localStorage.getItem("agent")
    if (!raw) {
      router.push("/agent/login")
      return
    }
    setAgent(JSON.parse(raw))
  }, [router])

  const loadSettings = useCallback(async (agentId: string) => {
    const headers = getAgentAuthHeaders()
    const marketRes = await fetch(`/api/agent/store-settings?agentId=${agentId}`, { headers })
    const marketData = await marketRes.json()
    if (!marketRes.ok) throw new Error(marketData.error)
    setSettings(marketData.settings || [])
    setSavedBundles(marketData.savedBundles || [])
    setSavedWholesale(marketData.savedWholesale || [])
    setCommissionBalance(Number(marketData.storefront_commission_balance ?? 0))
  }, [])

  const loadAll = useCallback(
    async (agentId: string) => {
      setLoading(true)
      try {
        const headers = getAgentAuthHeaders()
        const profileRes = await fetch(`/api/agent/store-profile?agentId=${agentId}`, { headers })
        const profileData = await profileRes.json()
        if (profileData.profile) {
          setProfile({
            store_name: profileData.profile.store_name || "",
            store_slug: profileData.profile.store_slug || "",
            whatsapp_number: profileData.profile.whatsapp_number || "",
            phone_number: profileData.profile.phone_number || "",
            primary_color: profileData.profile.primary_color || "#3B82F6",
            business_info: profileData.profile.business_info || "",
            whatsapp_channel_url: profileData.profile.whatsapp_channel_url || "",
            show_whatsapp_popup: profileData.profile.show_whatsapp_popup !== false,
          })
          setSlugInput(profileData.profile.store_slug || "")
        }
        await loadSettings(agentId)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load hub data")
      } finally {
        setLoading(false)
      }
    },
    [loadSettings],
  )

  useEffect(() => {
    if (agent?.id) loadAll(agent.id)
  }, [agent?.id, loadAll])

  useEffect(() => {
    if (!agent?.id || !slugInput.trim()) {
      setSlugStatus("idle")
      setSlugMessage("")
      return
    }
    if (slugInput === profile.store_slug) {
      setSlugStatus("ok")
      setSlugMessage("Current slug")
      return
    }
    const t = setTimeout(async () => {
      setSlugStatus("checking")
      try {
        const headers = getAgentAuthHeaders()
        const res = await fetch(
          `/api/agent/store-profile/check-slug?slug=${encodeURIComponent(slugInput)}&agentId=${agent.id}`,
          { headers },
        )
        const data = await res.json()
        if (data.available) {
          setSlugStatus("ok")
          setSlugMessage("Available")
        } else {
          setSlugStatus("bad")
          setSlugMessage(data.reason || "Unavailable")
        }
      } catch {
        setSlugStatus("bad")
        setSlugMessage("Could not verify")
      }
    }, 500)
    return () => clearTimeout(t)
  }, [slugInput, agent?.id, profile.store_slug])

  const saveProfile = async () => {
    if (!agent?.id) return
    if (slugInput.trim() && slugStatus === "bad") {
      toast.error(slugMessage || "Fix store URL slug before saving")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/agent/store-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId: agent.id,
          ...profile,
          store_slug: slugInput.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.profile) {
        setProfile((p) => ({ ...p, store_slug: data.profile.store_slug }))
        setSlugInput(data.profile.store_slug || "")
      }
      toast.success("Profile saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (!agent) return null

  const storeUrl = buildStorefrontUrl(agent.id, profile.store_slug)

  const scrollToReferralServices = () => {
    setHubTab("marketplace")
    window.setTimeout(() => {
      document.getElementById("referral-services-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-slate-900 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/agent/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Store className="h-5 w-5 shrink-0" />
              Referral Hub
            </h1>
            <p className="text-slate-300 text-xs truncate">Storefront profile, marketplace, orders & QR</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <ReferralHubSkeleton />
        ) : (
          <Tabs value={hubTab} onValueChange={setHubTab} className="w-full">
            <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 p-1 rounded-xl bg-white border shadow-sm">
              <TabsTrigger
                value="profile"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="listings"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                My Listings
              </TabsTrigger>
              <TabsTrigger
                value="marketplace"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                Marketplace
              </TabsTrigger>
              <TabsTrigger
                value="farmers-friend"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                Farmers Friend
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="qr"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                QR code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Storefront profile</CardTitle>
                  <CardDescription>Branding shown on your public store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full">
                    <Label>Store name</Label>
                    <Input
                      className="w-full"
                      value={profile.store_name || ""}
                      onChange={(e) => setProfile({ ...profile, store_name: e.target.value })}
                    />
                  </div>
                  <div className="w-full space-y-1">
                    <Label>Store URL slug</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center gap-0 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                          …/store/
                        </span>
                        <Input
                          className="w-full"
                          placeholder="my-store"
                          value={slugInput}
                          onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
                        />
                      </div>
                      {slugStatus === "checking" && (
                        <Loader2 className="h-5 w-5 animate-spin self-center text-muted-foreground" />
                      )}
                      {slugStatus === "ok" && slugInput.trim() && (
                        <Check className="h-5 w-5 text-emerald-600 self-center" />
                      )}
                      {slugStatus === "bad" && slugInput.trim() && (
                        <X className="h-5 w-5 text-red-600 self-center" />
                      )}
                    </div>
                    {slugMessage && (
                      <p
                        className={`text-xs ${slugStatus === "bad" ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {slugMessage}
                      </p>
                    )}
                    <p className="text-xs font-mono break-all text-muted-foreground">{storeUrl}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full">
                    <div className="w-full sm:w-auto">
                      <Label>Accent color</Label>
                      <Input
                        type="color"
                        className="h-11 w-full sm:w-24 cursor-pointer"
                        value={profile.primary_color || "#3B82F6"}
                        onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                      />
                    </div>
                    <div
                      className="h-11 flex-1 rounded-lg border min-w-0"
                      style={{ backgroundColor: profile.primary_color || "#3B82F6" }}
                    />
                  </div>
                  <div className="w-full">
                    <Label>WhatsApp</Label>
                    <Input
                      className="w-full"
                      value={profile.whatsapp_number || ""}
                      onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Phone</Label>
                    <Input
                      className="w-full"
                      value={profile.phone_number || ""}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="w-full">
                    <Label>WhatsApp channel / group link</Label>
                    <Input
                      className="w-full"
                      placeholder="https://whatsapp.com/channel/..."
                      value={profile.whatsapp_channel_url || ""}
                      onChange={(e) => setProfile({ ...profile, whatsapp_channel_url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Shown in a popup on your public store (after 3 seconds) when enabled below.
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <Label>Show WhatsApp channel popup on storefront</Label>
                      <p className="text-xs text-muted-foreground">Visitors can join your channel</p>
                    </div>
                    <Switch
                      checked={profile.show_whatsapp_popup}
                      onCheckedChange={(v) => setProfile({ ...profile, show_whatsapp_popup: v })}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Business bio</Label>
                    <Textarea
                      className="w-full"
                      rows={4}
                      value={profile.business_info || ""}
                      onChange={(e) => setProfile({ ...profile, business_info: e.target.value })}
                    />
                  </div>
                  <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="mt-4">
              {agent?.id && <MarketplaceMyListingsSection agentId={agent.id} />}
            </TabsContent>

            <TabsContent value="farmers-friend" className="mt-4">
              {agent?.id && <FarmersFriendHub agentId={agent.id} />}
            </TabsContent>

            <TabsContent value="marketplace" className="mt-4">
              {agent?.id && (
                <MarketplaceSubTabs
                  defaultSubTab={
                    marketplaceTabFromUrl === "real-estate"
                      ? "real-estate"
                      : marketplaceTabFromUrl === "influencers"
                        ? "influencers"
                        : "bundles"
                  }
                  bundles={
                    <MarketplaceBundlesSection
                      agentId={agent.id}
                      settings={settings}
                      savedBundles={savedBundles}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  services={
                    <MarketplaceServicesSection
                      agentId={agent.id}
                      settings={settings}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  wholesale={
                    <MarketplaceWholesaleSection
                      agentId={agent.id}
                      settings={settings}
                      savedProducts={savedWholesale}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  compliance={
                    <MarketplaceComplianceSection
                      agentId={agent.id}
                      settings={settings}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  advertising={
                    <MarketplaceAdvertisingSection
                      agentId={agent.id}
                      settings={settings}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  writing={
                    <MarketplaceWritingSection
                      agentId={agent.id}
                      settings={settings}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  realEstate={
                    <MarketplaceRealEstateSection
                      agentId={agent.id}
                      settings={settings}
                      onSettingsChange={() => loadSettings(agent.id)}
                    />
                  }
                  influencers={<MarketplaceInfluencersSection agentId={agent.id} />}
                />
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              {agent?.id && (
                <StorefrontOrdersSection
                  agentId={agent.id}
                  commissionBalance={commissionBalance}
                  onBalanceChange={() => loadSettings(agent.id)}
                />
              )}
            </TabsContent>

            <TabsContent value="qr" className="mt-4 space-y-4">
              <StorefrontQrCard
                agentId={agent.id}
                storeSlug={profile.store_slug}
                storeName={profile.store_name || agent.full_name}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {!loading && agent?.id && (
        <ReferralHubEarningsTip agentId={agent.id} onLearnMore={scrollToReferralServices} />
      )}
    </div>
  )
}
