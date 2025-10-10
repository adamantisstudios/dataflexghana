import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Check maintenance mode status
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('maintenance_mode')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching maintenance mode:', error)
      return NextResponse.json(
        { error: 'Failed to fetch maintenance mode status' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    const response = NextResponse.json({
      success: true,
      data: {
        isEnabled: data.is_enabled,
        title: data.title,
        message: data.message,
        estimatedCompletion: data.estimated_completion,
        countdownEnabled: data.countdown_enabled,
        countdownEndTime: data.countdown_end_time,
        updatedAt: data.updated_at
      }
    })

    // Add cache control headers to prevent caching issues
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Maintenance-Check', 'true')

    return response
  } catch (error) {
    console.error('Maintenance mode check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}

// POST - Update maintenance mode status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      isEnabled, 
      title, 
      message, 
      estimatedCompletion, 
      countdownEnabled, 
      countdownEndTime 
    } = body

    const { data, error } = await supabase
      .from('maintenance_mode')
      .upsert({
        is_enabled: isEnabled,
        title: title || 'System Maintenance',
        message: message || 'We are currently performing system maintenance. Please check back later.',
        estimated_completion: estimatedCompletion,
        countdown_enabled: countdownEnabled || false,
        countdown_end_time: countdownEndTime,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating maintenance mode:', error)
      return NextResponse.json(
        { error: 'Failed to update maintenance mode' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        isEnabled: data.is_enabled,
        title: data.title,
        message: data.message,
        estimatedCompletion: data.estimated_completion,
        countdownEnabled: data.countdown_enabled,
        countdownEndTime: data.countdown_end_time,
        updatedAt: data.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating maintenance mode:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance mode' },
      { status: 500 }
    )
  }
}

// PUT - Alias for POST to handle different request methods
export async function PUT(request: NextRequest) {
  return POST(request)
}
