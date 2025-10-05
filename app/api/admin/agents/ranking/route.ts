import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d' // '7d' or '30d'
    const limit = parseInt(searchParams.get('limit') || '5')

    // Validate timeframe
    if (!['7d', '30d'].includes(timeframe)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid timeframe. Use "7d" or "30d"'
      }, { status: 400 })
    }

    console.log(`🔄 Calculating agent rankings for ${timeframe} with limit ${limit}`)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    if (timeframe === '7d') {
      startDate.setDate(endDate.getDate() - 7)
    } else {
      startDate.setDate(endDate.getDate() - 30)
    }

    // Get all approved agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, full_name, phone_number')
      .eq('isapproved', true)

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch agents'
      }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          agents: [],
          timeframe: timeframe,
          total_count: 0,
          last_updated: new Date().toISOString()
        }
      })
    }

    // Calculate activity scores for each agent
    const agentActivities = await Promise.all(
      agents.map(async (agent) => {
        try {
          let totalActivity = 0

          // Count referrals in timeframe
          const { data: referrals, error: refError } = await supabase
            .from('referrals')
            .select('id', { count: 'exact' })
            .eq('agent_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          if (!refError && referrals) {
            totalActivity += referrals.length || 0
          }

          // Count data orders in timeframe
          const { data: dataOrders, error: dataError } = await supabase
            .from('data_orders')
            .select('id', { count: 'exact' })
            .eq('agent_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          if (!dataError && dataOrders) {
            totalActivity += dataOrders.length || 0
          }

          // Count wholesale orders in timeframe
          const { data: wholesaleOrders, error: wholesaleError } = await supabase
            .from('wholesale_orders')
            .select('id', { count: 'exact' })
            .eq('agent_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          if (!wholesaleError && wholesaleOrders) {
            totalActivity += wholesaleOrders.length || 0
          }

          // Count voucher orders in timeframe
          const { data: voucherOrders, error: voucherError } = await supabase
            .from('e_orders')
            .select('id', { count: 'exact' })
            .eq('agent_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          if (!voucherError && voucherOrders) {
            totalActivity += voucherOrders.length || 0
          }

          return {
            agent_id: agent.id,
            agent_name: agent.full_name || agent.phone_number || 'Unknown Agent',
            total_activity: totalActivity
          }
        } catch (error) {
          console.error(`Error calculating activity for agent ${agent.id}:`, error)
          return {
            agent_id: agent.id,
            agent_name: agent.full_name || agent.phone_number || 'Unknown Agent',
            total_activity: 0
          }
        }
      })
    )

    // Sort by activity (highest first) and assign ranks
    const sortedAgents = agentActivities
      .sort((a, b) => b.total_activity - a.total_activity)
      .slice(0, limit) // Take only the top N agents
      .map((agent, index) => ({
        name: agent.agent_name,
        activity: agent.total_activity,
        rank: index + 1
      }))

    console.log(`✅ Successfully calculated rankings for ${sortedAgents.length} agents`)

    return NextResponse.json({
      success: true,
      data: {
        agents: sortedAgents,
        timeframe: timeframe,
        total_count: sortedAgents.length,
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Agent ranking API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Optional: Add a POST endpoint to manually trigger ranking updates
export async function POST(request: NextRequest) {
  try {
    // This endpoint can be used to trigger manual ranking calculations
    // For now, it just returns success since we calculate rankings on-demand
    return NextResponse.json({
      success: true,
      message: 'Rankings are calculated on-demand',
      updated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in ranking update:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
