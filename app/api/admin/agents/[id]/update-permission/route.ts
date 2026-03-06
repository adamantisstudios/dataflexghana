import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const agentId = id

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { can_update_products } = body

    if (typeof can_update_products !== 'boolean') {
      return NextResponse.json(
        { error: 'can_update_products must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, full_name, can_update_products')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Update update permission
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({ can_update_products })
      .eq('id', agentId)
      .select('id, full_name, can_update_products, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating agent update permission:', updateError)
      return NextResponse.json(
        { error: `Failed to update permission: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log(`[v0] ✅ Updated update permission for agent ${agentId}: ${can_update_products}`)

    return NextResponse.json({
      success: true,
      message: `Agent ${can_update_products ? 'granted' : 'revoked'} update permission`,
      agent: updatedAgent,
    })

  } catch (error) {
    console.error('Error updating agent update permission:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update permission: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update agent update permission' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const agentId = id

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, full_name, can_update_products')
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      agent,
    })

  } catch (error) {
    console.error('Error fetching agent update permission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent update permission' },
      { status: 500 }
    )
  }
}
