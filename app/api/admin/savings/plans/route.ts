import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch all savings plans for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let query = supabase
      .from('savings_plans')
      .select(`
        *,
        agent_savings (
          id,
          principal_amount,
          current_balance,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: plans, error } = await query

    if (error) {
      console.error('Error fetching savings plans:', error)
      return NextResponse.json({ error: 'Failed to fetch savings plans' }, { status: 500 })
    }

    // Calculate statistics for each plan
    const plansWithStats = plans?.map(plan => {
      const savings = plan.agent_savings || []
      const activeSavings = savings.filter(s => s.status === 'active')
      const totalInvested = savings.reduce((sum, s) => sum + parseFloat(s.principal_amount), 0)
      const totalBalance = savings.reduce((sum, s) => sum + parseFloat(s.current_balance), 0)

      return {
        ...plan,
        statistics: {
          totalAccounts: savings.length,
          activeAccounts: activeSavings.length,
          totalInvested,
          totalBalance,
          totalInterestPaid: totalBalance - totalInvested
        },
        agent_savings: undefined // Remove detailed savings data from response
      }
    }) || []

    return NextResponse.json({ plans: plansWithStats })
  } catch (error) {
    console.error('Error in GET /api/admin/savings/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new savings plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      interestRate, 
      minimumAmount, 
      maximumAmount, 
      durationMonths, 
      earlyWithdrawalPenalty 
    } = body

    if (!name || !interestRate || !minimumAmount || !durationMonths) {
      return NextResponse.json({ 
        error: 'Name, interest rate, minimum amount, and duration are required' 
      }, { status: 400 })
    }

    const { data: newPlan, error } = await supabase
      .from('savings_plans')
      .insert({
        name,
        description: description || null,
        interest_rate: interestRate,
        minimum_amount: minimumAmount,
        maximum_amount: maximumAmount || null,
        duration_months: durationMonths,
        early_withdrawal_penalty: earlyWithdrawalPenalty || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating savings plan:', error)
      return NextResponse.json({ error: 'Failed to create savings plan' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Savings plan created successfully',
      plan: newPlan
    })
  } catch (error) {
    console.error('Error in POST /api/admin/savings/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update savings plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      name, 
      description, 
      interestRate, 
      minimumAmount, 
      maximumAmount, 
      durationMonths, 
      earlyWithdrawalPenalty,
      isActive
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (interestRate !== undefined) updateData.interest_rate = interestRate
    if (minimumAmount !== undefined) updateData.minimum_amount = minimumAmount
    if (maximumAmount !== undefined) updateData.maximum_amount = maximumAmount
    if (durationMonths !== undefined) updateData.duration_months = durationMonths
    if (earlyWithdrawalPenalty !== undefined) updateData.early_withdrawal_penalty = earlyWithdrawalPenalty
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: updatedPlan, error } = await supabase
      .from('savings_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating savings plan:', error)
      return NextResponse.json({ error: 'Failed to update savings plan' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Savings plan updated successfully',
      plan: updatedPlan
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/savings/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete savings plan (soft delete by setting inactive)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Check if plan has active savings accounts
    const { data: activeSavings, error: checkError } = await supabase
      .from('agent_savings')
      .select('id')
      .eq('savings_plan_id', id)
      .eq('status', 'active')

    if (checkError) {
      console.error('Error checking active savings:', checkError)
      return NextResponse.json({ error: 'Failed to check plan usage' }, { status: 500 })
    }

    if (activeSavings && activeSavings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with active savings accounts' 
      }, { status: 400 })
    }

    // Soft delete by setting inactive
    const { error } = await supabase
      .from('savings_plans')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting savings plan:', error)
      return NextResponse.json({ error: 'Failed to delete savings plan' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Savings plan deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/savings/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
