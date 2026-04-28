import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch available savings plans (public endpoint, no auth required)
export async function GET(request: NextRequest) {
  try {
    // Fetch active savings plans
    const { data: plans, error } = await supabase
      .from('savings_plans')
      .select('*')
      .eq('is_active', true)
      .order('interest_rate', { ascending: false })

    if (error) {
      console.error('Error fetching savings plans:', error)
      return NextResponse.json({ error: 'Failed to fetch savings plans' }, { status: 500 })
    }

    // Format plans for frontend consumption
    const formattedPlans = plans?.map(plan => ({
      ...plan,
      // Calculate estimated returns for display
      estimatedReturn: (plan.interest_rate / 100) * plan.minimum_amount,
      formattedMinAmount: `₵${plan.minimum_amount.toLocaleString()}`,
      formattedMaxAmount: plan.maximum_amount ? `₵${plan.maximum_amount.toLocaleString()}` : 'Unlimited',
      formattedInterestRate: `${plan.interest_rate}%`,
      durationText: `${plan.duration_months} month${plan.duration_months > 1 ? 's' : ''}`
    })) || []

    return NextResponse.json({ 
      plans: formattedPlans,
      total: formattedPlans.length 
    })
  } catch (error) {
    console.error('Error in GET /api/agent/savings/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
