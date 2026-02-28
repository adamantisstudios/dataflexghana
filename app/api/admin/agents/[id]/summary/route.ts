import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle awaitable params (Next.js 16 requirement)
    const resolvedParams = await params
    const agentId = resolvedParams.id

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Verify agent exists - handle all necessary columns safely
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, full_name, phone_number, wallet_balance, created_at, can_publish_products')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Use the database function we created for comprehensive summary
    const { data: summaryResult, error: summaryError } = await supabase
      .rpc('get_agent_record_summary', {
        p_agent_id: agentId
      })

    if (summaryError) {
      console.error('Error calling get_agent_record_summary function:', summaryError)
      
      // Fallback to manual queries if function fails
      const [
        walletTransactions,
        dataOrders,
        commissions,
        withdrawals,
        referrals
      ] = await Promise.all([
        // Wallet transactions
        supabase
          .from('wallet_transactions')
          .select('id, amount, transaction_type, created_at, status')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false }),

        // Data orders
        supabase
          .from('data_orders')
          .select('id, commission_amount, status, created_at, payment_method')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false }),

        // Commissions
        supabase
          .from('commissions')
          .select('id, amount, source_type, status, earned_at, created_at')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false }),

        // Withdrawals
        supabase
          .from('withdrawals')
          .select('id, amount, status, created_at, requested_at')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false }),

        // Referrals
        supabase
          .from('referrals')
          .select('id, status, commission_paid, created_at')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
      ])

      // Get transaction date range
      const allTransactionDates = [
        ...(walletTransactions.data || []).map(t => t.created_at),
        ...(dataOrders.data || []).map(t => t.created_at),
        ...(commissions.data || []).map(t => t.created_at),
        ...(withdrawals.data || []).map(t => t.created_at),
        ...(referrals.data || []).map(t => t.created_at)
      ].filter(Boolean).sort()

      const fallbackSummary = {
        agent_info: {
          id: agent.id,
          name: agent.full_name,
          phone: agent.phone_number,
          phone_number: agent.phone_number,
          wallet_balance: agent.wallet_balance,
          commission_balance: 0, // Will be calculated from commission records
          created_at: agent.created_at
        },
        total_wallet_transactions: walletTransactions.data?.length || 0,
        total_commission_deposits: walletTransactions.data?.filter(t => t.transaction_type === 'commission_deposit').length || 0,
        total_data_orders: dataOrders.data?.length || 0,
        total_wholesale_orders: 0, // Not in current schema
        total_referrals_made: referrals.data?.length || 0,
        total_referrals_received: 0, // Would need referrer_id field
        total_withdrawals: withdrawals.data?.length || 0,
        wallet_balance: agent.wallet_balance || 0,
        commission_balance: 0, // Will be calculated from commission records
        first_transaction_date: allTransactionDates.length > 0 ? allTransactionDates[0] : null,
        last_transaction_date: allTransactionDates.length > 0 ? allTransactionDates[allTransactionDates.length - 1] : null,
        transaction_breakdown: {
          wallet_transactions: {
            total: walletTransactions.data?.length || 0,
            approved: walletTransactions.data?.filter(t => t.status === 'approved').length || 0,
            pending: walletTransactions.data?.filter(t => t.status === 'pending').length || 0,
            by_type: walletTransactions.data?.reduce((acc: any, t: any) => {
              acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1
              return acc
            }, {}) || {}
          },
          data_orders: {
            total: dataOrders.data?.length || 0,
            completed: dataOrders.data?.filter(o => o.status === 'completed').length || 0,
            pending: dataOrders.data?.filter(o => o.status === 'pending').length || 0,
            total_commission: dataOrders.data?.reduce((sum, o) => sum + (o.commission_amount || 0), 0) || 0,
            by_payment_method: dataOrders.data?.reduce((acc: any, o: any) => {
              acc[o.payment_method] = (acc[o.payment_method] || 0) + 1
              return acc
            }, {}) || {}
          },
          commissions: {
            total: commissions.data?.length || 0,
            earned: commissions.data?.filter(c => c.status === 'earned').length || 0,
            withdrawn: commissions.data?.filter(c => c.status === 'withdrawn').length || 0,
            total_amount: commissions.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
            by_source: commissions.data?.reduce((acc: any, c: any) => {
              acc[c.source_type] = (acc[c.source_type] || 0) + 1
              return acc
            }, {}) || {}
          },
          referrals: {
            total: referrals.data?.length || 0,
            completed: referrals.data?.filter(r => r.status === 'completed').length || 0,
            commission_paid: referrals.data?.filter(r => r.commission_paid === true).length || 0,
            commission_unpaid: referrals.data?.filter(r => r.commission_paid === false).length || 0
          },
          withdrawals: {
            total: withdrawals.data?.length || 0,
            paid: withdrawals.data?.filter(w => w.status === 'paid').length || 0,
            requested: withdrawals.data?.filter(w => w.status === 'requested').length || 0,
            processing: withdrawals.data?.filter(w => w.status === 'processing').length || 0,
            total_amount: withdrawals.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0
          }
        }
      }

      return NextResponse.json(fallbackSummary)
    }

    // If function succeeded, return the result
    if (summaryResult?.success) {
      return NextResponse.json({
        ...summaryResult.agent_info,
        ...summaryResult.record_counts,
        ...summaryResult.financial_summary,
        ...summaryResult.activity_summary,
        transaction_breakdown: {
          wallet_transactions: {
            total: summaryResult.record_counts?.wallet_transactions || 0
          },
          data_orders: {
            total: summaryResult.record_counts?.data_orders || 0
          },
          commissions: {
            total: summaryResult.record_counts?.commissions || 0
          },
          withdrawals: {
            total: summaryResult.record_counts?.withdrawals || 0
          },
          referrals: {
            total: summaryResult.record_counts?.referrals_made || 0
          }
        }
      })
    } else {
      return NextResponse.json(
        { error: summaryResult?.error || 'Failed to fetch agent summary' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error fetching agent summary:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch agent summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
