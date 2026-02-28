"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, PiggyBank, Plus } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BackToTop } from '@/components/back-to-top'
import SavingsProgressTracker from '@/components/agent/savings/SavingsProgressTracker'
import { Button } from '@/components/ui/button'
import { getStoredAgent, type Agent } from '@/lib/unified-auth-system'

export default function SavingsProgressPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [activeSavings, setActiveSavings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get agent from localStorage using unified auth system
        const storedAgent = getStoredAgent()

        if (!storedAgent) {
          router.push('/agent/login')
          return
        }

        setAgent(storedAgent)

        // Load active savings using agent ID from localStorage
        const { data: savingsData } = await supabase
          .from('agent_savings')
          .select('*')
          .eq('agent_id', storedAgent.id)
          .eq('status', 'active')

        setActiveSavings(savingsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
        router.push('/agent/login')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading savings progress...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link
                href="/agent/dashboard"
                className="text-white hover:text-blue-200 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 sm:bg-white rounded-xl shadow-lg flex items-center justify-center p-1.5 flex-shrink-0">
                  <TrendingUp className="w-full h-full text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-900 sm:text-white drop-shadow-lg truncate">
                    Savings Progress
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-700 sm:text-blue-100 font-medium truncate">
                    Track your savings performance
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              <div>
                <p className="text-sm text-blue-100">Agent</p>
                <p className="font-medium text-white">{agent?.full_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Wallet Balance</p>
                <p className="font-medium text-white">{agent ? formatCurrency(agent.wallet_balance || 0) : "₵0.00"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile info card */}
      <div className="sm:hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 container mx-auto px-3 py-3">
        <div className="bg-white rounded-lg px-4 py-3 border border-blue-200 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-blue-700 font-medium">Agent</p>
              <p className="font-medium text-blue-900 truncate">{agent?.full_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700 font-medium">Wallet Balance</p>
              <p className="font-medium text-blue-900">{agent ? formatCurrency(agent.wallet_balance || 0) : "₵0.00"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ProgressTracker */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {activeSavings && activeSavings.length > 0 ? (
            <SavingsProgressTracker
              agentId={agent.id}
              savingsId={activeSavings[0].id}
            />
          ) : (
            <div className="text-center py-12">
              <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Savings</h3>
              <p className="text-gray-500 mb-6">You don't have any active savings accounts to track.</p>
              <Button asChild>
                <Link href="/agent/savings/plans">
                  <Plus className="mr-2 h-4 w-4" />
                  Start Saving
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <BackToTop />
    </div>
  )
}
