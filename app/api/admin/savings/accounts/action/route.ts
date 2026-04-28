import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { account_id, action, reason, admin_notes } = await request.json()

    if (!account_id || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions = ['pause', 'resume', 'stop', 'delete']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Update savings plan based on action
    let updateData: any = { admin_notes }

    if (action === 'pause') {
      updateData.status = 'paused'
      updateData.paused_at = new Date().toISOString()
    } else if (action === 'resume') {
      updateData.status = 'active'
      updateData.paused_at = null
      updateData.resumed_at = new Date().toISOString()
    } else if (action === 'stop') {
      updateData.status = 'stopped'
      updateData.stopped_at = new Date().toISOString()
    } else if (action === 'delete') {
      updateData.status = 'deleted'
      updateData.deleted_at = new Date().toISOString()
      updateData.is_active = false
    }

    const { data, error } = await supabase
      .from('agent_savings')
      .update(updateData)
      .eq('id', account_id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update savings account' },
        { status: 500 }
      )
    }

    // Log the action for audit trail
    await supabase.from('admin_logs').insert({
      action: `savings_account_${action}`,
      resource_type: 'savings_account',
      resource_id: account_id,
      details: reason,
      timestamp: new Date().toISOString()
    }).catch(err => console.error('Audit log error:', err))

    return NextResponse.json({
      success: true,
      message: `Account ${action}ed successfully`,
      data: data[0]
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
