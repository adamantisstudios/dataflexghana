import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withUnifiedAuth } from '@/lib/auth-middleware'

// POST - Request withdrawal from savings account
export const POST = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const {
      agentId,
      savingsId,
      amount,
      withdrawalType,
      mobileMoneyNumber,
      mobileMoneyNetwork,
      reason
    } = body

    // Verify agent can only create withdrawals for themselves (unless admin)
    if (user.role === 'agent' && agentId && agentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use authenticated user's ID if no agentId provided, or allow admin to specify
    const targetAgentId = agentId || user.id

    if (!targetAgentId || !savingsId || !amount || !withdrawalType || !mobileMoneyNumber || !mobileMoneyNetwork) {
      return NextResponse.json({
        error: 'All fields are required: savingsId, amount, withdrawalType, mobileMoneyNumber, mobileMoneyNetwork'
      }, { status: 400 })
    }

    // Validate withdrawal type
    if (!['full', 'partial', 'early'].includes(withdrawalType)) {
      return NextResponse.json({
        error: 'Invalid withdrawal type. Must be: full, partial, or early'
      }, { status: 400 })
    }

    // Validate mobile money network
    if (!['MTN', 'Vodafone', 'AirtelTigo'].includes(mobileMoneyNetwork)) {
      return NextResponse.json({
        error: 'Invalid mobile money network. Must be: MTN, Vodafone, or AirtelTigo'
      }, { status: 400 })
    }

    // Get savings account details
    const { data: savings, error: savingsError } = await supabase
      .from('agent_savings')
      .select(`
        *,
        savings_plans (
          name,
          interest_rate,
          duration_months,
          early_withdrawal_penalty
        )
      `)
      .eq('id', savingsId)
      .eq('agent_id', targetAgentId)
      .single()

    if (savingsError || !savings) {
      return NextResponse.json({ error: 'Savings account not found' }, { status: 404 })
    }

    // Check if savings account is active
    if (savings.status !== 'active') {
      return NextResponse.json({
        error: `Cannot withdraw from ${savings.status} savings account`
      }, { status: 400 })
    }

    // Validate withdrawal amount
    if (amount <= 0) {
      return NextResponse.json({ error: 'Withdrawal amount must be positive' }, { status: 400 })
    }

    if (amount > savings.current_balance) {
      return NextResponse.json({
        error: `Insufficient balance. Available: ₵${savings.current_balance}`
      }, { status: 400 })
    }

    // Check for early withdrawal
    const currentDate = new Date()
    const maturityDate = new Date(savings.maturity_date)
    const isEarlyWithdrawal = currentDate < maturityDate

    if (isEarlyWithdrawal && withdrawalType !== 'early') {
      return NextResponse.json({
        error: 'This savings account has not matured yet. Use withdrawalType: "early" for early withdrawal.'
      }, { status: 400 })
    }

    // Calculate penalty for early withdrawal
    let penaltyAmount = 0
    if (isEarlyWithdrawal && savings.savings_plans?.early_withdrawal_penalty) {
      penaltyAmount = (amount * savings.savings_plans.early_withdrawal_penalty) / 100
    }

    const netAmount = amount - penaltyAmount

    // CRITICAL FIX: Enhanced validation to prevent duplicate withdrawals
    // Check for existing withdrawal requests (including paid ones)
    const { data: existingRequests, error: requestError } = await supabase
      .from('withdrawal_requests')
      .select('id, status, is_locked, paid_at')
      .eq('agent_savings_id', savingsId)
      .in('status', ['pending', 'approved', 'processed', 'paid'])

    if (requestError) {
      console.error('Error checking existing requests:', requestError)
      return NextResponse.json({ error: 'Failed to process withdrawal request' }, { status: 500 })
    }

    if (existingRequests && existingRequests.length > 0) {
      // Check for any active or paid withdrawals
      const activeRequest = existingRequests.find(req => 
        req.status === 'pending' || req.status === 'approved' || req.status === 'processed'
      )
      
      const paidRequest = existingRequests.find(req => 
        req.status === 'paid' || req.is_locked === true
      )

      if (activeRequest) {
        return NextResponse.json({
          error: 'You already have a pending withdrawal request for this savings account'
        }, { status: 400 })
      }

      if (paidRequest) {
        return NextResponse.json({
          error: 'This savings account has already been withdrawn from and is locked. No further withdrawals are allowed.'
        }, { status: 400 })
      }
    }

    // CRITICAL FIX: Check if this specific amount has already been paid out
    // This prevents agents from requesting the same withdrawal amount again
    const { data: duplicateAmountCheck, error: duplicateError } = await supabase
      .from('withdrawal_requests')
      .select('id, status, requested_amount, paid_at')
      .eq('agent_id', targetAgentId)
      .eq('agent_savings_id', savingsId)
      .eq('requested_amount', amount)
      .eq('status', 'paid')

    if (duplicateError) {
      console.error('Error checking duplicate amounts:', duplicateError)
      return NextResponse.json({ error: 'Failed to validate withdrawal request' }, { status: 500 })
    }

    if (duplicateAmountCheck && duplicateAmountCheck.length > 0) {
      return NextResponse.json({
        error: `A withdrawal of ₵${amount} from this savings account has already been paid out. Cannot request the same amount again.`
      }, { status: 400 })
    }

    // Create withdrawal request
    const { data: withdrawalRequest, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        agent_savings_id: savingsId,
        agent_id: targetAgentId,
        requested_amount: amount,
        withdrawal_type: withdrawalType,
        mobile_money_number: mobileMoneyNumber,
        mobile_money_network: mobileMoneyNetwork,
        reason: reason || null,
        status: 'pending',
        is_locked: false // Explicitly set to false for new requests
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError)
      
      // Handle specific database constraint violations
      if (withdrawalError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          error: 'A withdrawal request for this savings account is already active. Please wait for it to be processed.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    // CRITICAL FIX: Create commission tracking record
    // This links the withdrawal to specific commission sources
    const { error: commissionTrackingError } = await supabase
      .from('withdrawal_commission_items')
      .insert({
        withdrawal_request_id: withdrawalRequest.id,
        commission_source_type: 'savings_interest',
        commission_source_id: savingsId,
        commission_amount: amount,
        is_paid: false
      })

    if (commissionTrackingError) {
      console.error('Error creating commission tracking:', commissionTrackingError)
      // Don't fail the request, but log the error
    }

    // Create transaction record for the withdrawal request
    const { error: transactionError } = await supabase
      .from('savings_transactions')
      .insert({
        agent_savings_id: savingsId,
        transaction_type: 'withdrawal',
        amount: -amount, // Negative amount for withdrawal
        balance_after: savings.current_balance, // Balance remains same until approved
        description: `Withdrawal request: ${withdrawalType} withdrawal of ₵${amount}${penaltyAmount > 0 ? ` (Penalty: ₵${penaltyAmount.toFixed(2)})` : ''}`,
        reference_number: `WDR-${Date.now()}-${withdrawalRequest.id.slice(0, 8)}`
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      // Don't fail the request if transaction recording fails
    }

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawalRequest: {
        ...withdrawalRequest,
        penaltyAmount,
        netAmount,
        isEarlyWithdrawal
      }
    })
  } catch (error) {
    console.error('Error in POST /api/agent/savings/withdraw:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// GET - Fetch withdrawal requests for an agent
export const GET = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify agent can only access their own data (unless admin)
    if (user.role === 'agent' && agentId && agentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use authenticated user's ID if no agentId provided, or allow admin to specify
    const targetAgentId = agentId || user.id

    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        agent_savings (
          principal_amount,
          current_balance,
          savings_plans (
            name
          )
        )
      `)
      .eq('agent_id', targetAgentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: withdrawalRequests, error } = await query

    if (error) {
      console.error('Error fetching withdrawal requests:', error)
      return NextResponse.json({ error: 'Failed to fetch withdrawal requests' }, { status: 500 })
    }

    // Format withdrawal requests for display
    const formattedRequests = withdrawalRequests?.map(request => ({
      ...request,
      formattedAmount: `₵${request.requested_amount.toFixed(2)}`,
      formattedDate: new Date(request.created_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      statusLabel: {
        'pending': 'Pending Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'processed': 'Processed'
      }[request.status] || request.status,
      typeLabel: {
        'full': 'Full Withdrawal',
        'partial': 'Partial Withdrawal',
        'early': 'Early Withdrawal'
      }[request.withdrawal_type] || request.withdrawal_type
    })) || []

    return NextResponse.json({ withdrawalRequests: formattedRequests })
  } catch (error) {
    console.error('Error in GET /api/agent/savings/withdraw:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
