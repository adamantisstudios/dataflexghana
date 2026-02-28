"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, MessageCircle, Mail, Clock } from 'lucide-react'
import { toast } from "sonner"

interface ReferralLink {
  id: string
  agent_id: string
  agent_name: string
  referral_code: string
  referral_url: string
  total_clicks: number
  total_referrals: number
  total_earnings: number
  created_at: string
  updated_at: string
}

interface ReferralStats {
  totalClicks: number
  totalReferrals: number
  confirmedReferrals: number
  completedReferrals: number
  totalEarnings: number
  conversionRate: string
}

interface RecentReferral {
  id: string
  full_name: string
  phone_number: string
  status: string
  credit_amount: number
  credited_at: string
}

interface Props {
  agentId: string
  agentName: string
}

export function ReferralDashboard({ agentId, agentName }: Props) {
  const [referralLink, setReferralLink] = useState<string | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const generateReferralLink = async () => {
    setGenerating(true)
    try {
      console.log("[v0] Generating referral link for agent:", agentId, agentName)

      const response = await fetch("/api/agent/referral/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          agent_name: agentName,
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] API Error:", errorData)
        const errorMsg = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to generate referral link"
        toast.error(errorMsg)
        return
      }

      const result = await response.json()
      console.log("[v0] API Success:", result)

      if (result.success && result.data) {
        setReferralLink(result.data.referral_url)
        toast.success("Referral link generated successfully!")
        fetchStats()
      } else {
        toast.error("Failed to generate referral link")
      }
    } catch (error) {
      console.error("[v0] Error generating referral link:", error)
      toast.error("Failed to generate referral link")
    } finally {
      setGenerating(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/agent/referral/stats?agent_id=${agentId}`)
      const result = await response.json()

      console.log("[v0] Stats result:", result)
      if (result.recentReferrals) {
        console.log(
          "[v0] Recent referrals with statuses:",
          result.recentReferrals.map((r) => ({
            name: r.full_name,
            status: r.status,
          })),
        )
      }

      if (result.success) {
        setStats(result.stats)
        if (result.data?.referral_url) {
          setReferralLink(result.data.referral_url)
        }
        setRecentReferrals(result.recentReferrals || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching referral stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const interval = setInterval(() => {
      console.log("[v0] Auto-refreshing referral stats...")
      fetchStats()
    }, 10000)

    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [agentId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnWhatsApp = () => {
    if (referralLink) {
      const message = `Join DataFlex Ghana and earn! Use my referral link: ${referralLink}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  const shareOnFacebook = () => {
    if (referralLink) {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
        "_blank",
        "width=600,height=400",
      )
    }
  }

  const shareViaEmail = () => {
    if (referralLink) {
      const subject = "Join DataFlex Ghana - Earn with Me"
      const body = `Hi! I'm inviting you to join DataFlex Ghana. Click here to register: ${referralLink}\n\nEarn 5 GHS per successful registration!`
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
  }

  const formatCreditDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending (Awaiting Admin Confirmation)"
      case "confirmed":
        return "Confirmed"
      case "credited":
        return "Credited (Ready to Withdraw)"
      case "paid_out":
        return "Paid Out"
      default:
        return status
    }
  }

  const getSortedReferrals = (referrals: RecentReferral[]) => {
    return referrals.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        pending: 0,
        confirmed: 1,
        credited: 2,
        paid_out: 3,
      }
      return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-3 border-emerald-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-emerald-700">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-emerald-800">Referral Program</h2>
        <p className="text-xs text-gray-600">Share your link and earn 5 GHS per referral</p>
      </div>

      {!referralLink ? (
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-4">
            <Button
              onClick={generateReferralLink}
              disabled={generating}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full text-sm"
            >
              {generating ? "Generating..." : "Generate Link"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-emerald-700">Your Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="bg-emerald-50 border-emerald-200 text-emerald-800 text-xs h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralLink)}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 h-9 px-2"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  onClick={shareOnWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-xs h-8 flex-1 px-2"
                  size="sm"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
                <Button
                  onClick={shareOnFacebook}
                  className="bg-blue-600 hover:bg-blue-700 text-xs h-8 flex-1 px-2"
                  size="sm"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Facebook
                </Button>
                <Button
                  onClick={shareViaEmail}
                  className="bg-orange-600 hover:bg-orange-700 text-xs h-8 flex-1 px-2"
                  size="sm"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {stats && (
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-3">
                  <p className="text-xs text-emerald-600 font-medium">Clicks</p>
                  <p className="text-xl font-bold text-emerald-800">{stats.totalClicks}</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-3">
                  <p className="text-xs text-green-600 font-medium">Completed</p>
                  <p className="text-xl font-bold text-green-800">{stats.completedReferrals}</p>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-3">
                  <p className="text-xs text-yellow-600 font-medium">Pending</p>
                  <p className="text-xl font-bold text-yellow-800">{stats.totalReferrals - stats.completedReferrals}</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-3">
                  <p className="text-xs text-blue-600 font-medium">Earned</p>
                  <p className="text-xl font-bold text-blue-600">₵{stats.totalEarnings.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {recentReferrals && recentReferrals.length > 0 && (
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getSortedReferrals(recentReferrals).slice(0, 5).map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-emerald-800 truncate">{referral.full_name}</p>
                        <p className="text-gray-500 text-xs truncate">{referral.phone_number}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Credited: {formatCreditDate(referral.credited_at)}
                        </p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <Badge
                          className={
                            referral.status === "paid_out"
                              ? "bg-emerald-100 text-emerald-800 text-xs"
                              : referral.status === "credited"
                                ? "bg-green-100 text-green-800 text-xs"
                                : referral.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800 text-xs"
                                  : "bg-yellow-100 text-yellow-800 text-xs"
                          }
                        >
                          {getStatusDisplay(referral.status)}
                        </Badge>
                        <p className="text-emerald-600 font-semibold mt-1">₵{referral.credit_amount.toFixed(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default ReferralDashboard
