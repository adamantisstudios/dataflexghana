import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withUnifiedAuth } from '@/lib/auth-middleware'

// GET - Fetch savings transactions for an agent
export const GET = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const savingsId = searchParams.get('savingsId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify agent can only access their own data (unless admin)
    if (user.role === 'agent' && agentId && agentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use authenticated user's ID if no agentId provided, or allow admin to specify
    const targetAgentId = agentId || user.id

    let query = supabase
      .from('savings_transactions')
      .select(`
        *,
        agent_savings!inner (
          agent_id,
          savings_plans (
            name
          )
        )
      `)
      .eq('agent_savings.agent_id', targetAgentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by specific savings account if provided
    if (savingsId) {
      query = query.eq('agent_savings_id', savingsId)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Format transactions for display
    const formattedTransactions = transactions?.map(transaction => ({
      ...transaction,
      formattedAmount: `₵${transaction.amount.toFixed(2)}`,
      formattedBalance: `₵${transaction.balance_after.toFixed(2)}`,
      formattedDate: new Date(transaction.created_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      typeLabel: {
        'deposit': 'Deposit',
        'interest': 'Interest Earned',
        'withdrawal': 'Withdrawal',
        'penalty': 'Penalty'
      }[transaction.transaction_type] || transaction.transaction_type
    })) || []

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error) {
    console.error('Error in GET /api/agent/savings/transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
