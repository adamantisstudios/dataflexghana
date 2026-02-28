"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Share2,
  Copy,
  Check,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Facebook,
  MessageCircle,
  Mail,
  LinkIcon,
} from "lucide-react"

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

interface ReferralTracking {
  id: string
  referral_code: string
  status: string
  referred_agent_id: string | null
  referral_earnings: number
  clicked_at: string
  confirmed_at: string | null
}

interface Props {
  agentId: string
  agentName: string
}

export function ReferralDashboard({ agentId, agentName }: Props) {
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [recentReferrals, setRecentReferrals] = useState<ReferralTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Generate or fetch referral link
  const generateReferralLink = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/agent/referral/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          agent_name: agentName,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setReferralLink(result.data)
      }
    } catch (error) {
      console.error("Error generating referral link:", error)
    } finally {
      setGenerating(false)
    }
  }

  // Fetch referral stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/agent/referral/stats?agent_id=${agentId}`)
      const result = await response.json()

      if (result.success && result.data) {
        setStats(result.data.stats)
        setReferralLink(result.data.link)
        setRecentReferrals(result.data.recentReferrals)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [agentId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnWhatsApp = () => {
    if (referralLink) {
      const message = `Join DataFlex Ghana! Use my referral link to start earning: ${referralLink.referral_url}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  const shareOnFacebook = () => {
    if (referralLink) {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink.referral_url)}`,
        "_blank",
        "width=600,height=400",
      )
    }
  }

  const shareViaEmail = () => {
    if (referralLink) {
      const subject = "Join DataFlex Ghana - Earn with My Referral Link"
      const body = `Hi!\n\nI'm inviting you to join DataFlex Ghana and start earning with me. Click here: ${referralLink.referral_url}\n\nLooking forward to seeing you on the platform!`
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
  }

  const formatReferralDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
        <span className="ml-3 text-emerald-700">Loading referral dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Section */}
      {!referralLink ? (
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-emerald-800">Generate Your Referral Link</CardTitle>
            <CardDescription className="text-emerald-600">
              Create a unique referral link to share with friends and start earning commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateReferralLink}
              disabled={generating}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
            >
              {generating ? "Generating..." : "Generate Referral Link"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Referral Link Card */}
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Share2 className="h-5 w-5" />
                Your Referral Link
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Share this link to earn 5% commission on every new referral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Referral Code Display */}
              <div className="space-y-2">
                <Label className="text-emerald-700">Referral Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={referralLink.referral_code}
                    readOnly
                    className="bg-emerald-50 border-emerald-200 text-emerald-800 font-mono font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(referralLink.referral_code)}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Referral URL Display */}
              <div className="space-y-2">
                <Label className="text-emerald-700">Referral URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={referralLink.referral_url}
                    readOnly
                    className="bg-emerald-50 border-emerald-200 text-emerald-800 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(referralLink.referral_url)}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="space-y-2">
                <Label className="text-emerald-700">Share On</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button onClick={shareOnWhatsApp} className="bg-green-600 hover:bg-green-700" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button onClick={shareOnFacebook} className="bg-blue-600 hover:bg-blue-700" size="sm">
                    <Facebook className="h-4 w-4 mr-1" />
                    Facebook
                  </Button>
                  <Button onClick={shareViaEmail} className="bg-orange-600 hover:bg-orange-700" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(referralLink.referral_url)}
                    variant="outline"
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    size="sm"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Total Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-800">{stats.totalClicks}</div>
                  <p className="text-xs text-emerald-600 mt-1">People who clicked your link</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-800">{stats.totalReferrals}</div>
                  <p className="text-xs text-emerald-600 mt-1">Confirmed referrals</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-800">{stats.conversionRate}%</div>
                  <p className="text-xs text-emerald-600 mt-1">Click to referral rate</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">GH₵ {stats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs text-emerald-600 mt-1">Total referral earnings</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Referrals Table */}
          {recentReferrals && recentReferrals.length > 0 && (
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <TrendingUp className="h-5 w-5" />
                  Recent Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-emerald-800">
                          {referral.referred_agent_id ? `Agent: ${referral.referred_agent_id}` : "Pending Signup"}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          Clicked: {formatReferralDate(referral.clicked_at)}
                        </p>
                        {referral.confirmed_at && (
                          <p className="text-xs text-emerald-600">
                            Confirmed: {formatReferralDate(referral.confirmed_at)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            referral.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : referral.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                          }
                        >
                          {referral.status}
                        </Badge>
                        {referral.referral_earnings > 0 && (
                          <p className="text-xs font-semibold text-green-600 mt-1">
                            +GH₵ {referral.referral_earnings.toFixed(2)}
                          </p>
                        )}
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
