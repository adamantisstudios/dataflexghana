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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-b border-blue-400/30 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-white hover:bg-blue-500/20 border border-blue-400/30"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Savings Progress
                </h1>
                <p className="text-sm text-blue-200">Track your savings performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-200">Agent</p>
                <p className="font-medium text-white">{agent?.full_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-200">Wallet Balance</p>
                <p className="font-medium text-white">{agent ? formatCurrency(agent.wallet_balance || 0) : '$0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ProgressTracker */}
      <main className="container mx-auto px-4 py-8">
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
