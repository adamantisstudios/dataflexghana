import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Log the request for debugging
    console.log('Fetching agents data for admin:', admin.id)

    // Fetch all agents with their wallet and commission data
    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        id,
        full_name,
        momo_number,
        wallet_balance,
        commission,
        created_at,
        isapproved,
        region
      `)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Supabase error fetching agents:', error)
      return NextResponse.json(
        { 
          error: 'Database error occurred while fetching agents',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    // Validate the response
    if (!agents) {
      console.warn('Agents query returned null/undefined')
      return NextResponse.json(
        { 
          error: 'No data returned from database',
          agents: []
        },
        { status: 200 }
      )
    }

    // Log successful fetch
    console.log(`Successfully fetched ${agents.length} agents`)

    return NextResponse.json({
      success: true,
      agents: agents,
      count: agents.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error in agents API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Export named export for other HTTP methods if needed
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
