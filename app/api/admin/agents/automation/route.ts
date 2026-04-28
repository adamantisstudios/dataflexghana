import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action, agentId, adminNotes } = await request.json()

    // Validate request body
    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'run_automation':
        try {
          // Test database connection first
          const { error: connectionError } = await supabase
            .from("agents")
            .select("count", { count: "exact", head: true })

          if (connectionError) {
            throw new Error(`Database connection failed: ${connectionError.message}`)
          }

          const { data: automationResult, error: automationError } = await supabase.rpc(
            'run_agent_deactivation_automation',
            { p_run_type: 'manual' }
          )

          if (automationError) {
            console.error('Automation RPC error:', automationError)
            
            // Handle specific RPC errors gracefully
            if (automationError.code === 'PGRST202') {
              return NextResponse.json({
                success: false,
                message: 'Automation function not found. Please check if the database function exists.',
                error_code: 'FUNCTION_NOT_FOUND'
              }, { status: 404 })
            } else if (automationError.code === 'PGRST301') {
              return NextResponse.json({
                success: false,
                message: 'Automation function execution failed. Please check function permissions.',
                error_code: 'FUNCTION_EXECUTION_FAILED'
              }, { status: 500 })
            } else {
              throw automationError
            }
          }

          // Handle successful response
          let result = {
            success: true,
            message: 'Automation completed successfully',
            data: automationResult || {},
            processed_agents: 0,
            deactivated_agents: 0
          }

          if (automationResult && typeof automationResult === 'object') {
            result = {
              ...result,
              message: automationResult.message || result.message,
              processed_agents: automationResult.processed_agents || 0,
              deactivated_agents: automationResult.deactivated_agents || 0,
              data: automationResult
            }
          }

          return NextResponse.json(result)
        } catch (error) {
          console.error('Automation execution error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown automation error'
          return NextResponse.json({
            success: false,
            message: `Automation failed: ${errorMessage}`,
            error_code: 'AUTOMATION_FAILED'
          }, { status: 500 })
        }

      case 'reactivate_agent':
        if (!agentId) {
          return NextResponse.json(
            { success: false, message: 'Agent ID is required' },
            { status: 400 }
          )
        }

        try {
          const { data: reactivateResult, error: reactivateError } = await supabase.rpc(
            'reactivate_agent',
            {
              p_agent_id: agentId,
              p_admin_notes: adminNotes || `Manually reactivated by admin on ${new Date().toISOString()}`
            }
          )

          if (reactivateError) {
            console.error('Reactivation RPC error:', reactivateError)
            
            // Handle specific RPC errors gracefully
            if (reactivateError.code === 'PGRST202') {
              return NextResponse.json({
                success: false,
                message: 'Reactivation function not found. Please check if the database function exists.',
                error_code: 'FUNCTION_NOT_FOUND'
              }, { status: 404 })
            } else if (reactivateError.code === 'PGRST301') {
              return NextResponse.json({
                success: false,
                message: 'Reactivation function execution failed. Please check function permissions.',
                error_code: 'FUNCTION_EXECUTION_FAILED'
              }, { status: 500 })
            } else {
              throw reactivateError
            }
          }

          return NextResponse.json({
            success: true,
            message: 'Agent reactivated successfully',
            data: reactivateResult
          })
        } catch (error) {
          console.error('Agent reactivation error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown reactivation error'
          return NextResponse.json({
            success: false,
            message: `Agent reactivation failed: ${errorMessage}`,
            error_code: 'REACTIVATION_FAILED'
          }, { status: 500 })
        }

      case 'get_stats':
        try {
          const { data: statsData, error: statsError } = await supabase.rpc(
            'get_automation_statistics',
            { p_days_back: 30 }
          )

          if (statsError) {
            console.error('Stats RPC error:', statsError)
            
            // Handle specific RPC errors gracefully
            if (statsError.code === 'PGRST202') {
              return NextResponse.json({
                success: true,
                data: {
                  total_runs: 0,
                  successful_runs: 0,
                  failed_runs: 0,
                  total_agents_processed: 0,
                  total_agents_deactivated: 0,
                  avg_execution_time_ms: 0,
                  last_run_at: null,
                  next_recommended_run: null
                },
                message: 'Statistics function not available, using default values'
              })
            } else {
              throw statsError
            }
          }

          return NextResponse.json({
            success: true,
            data: statsData?.[0] || null
          })
        } catch (error) {
          console.error('Stats fetch error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown stats error'
          return NextResponse.json({
            success: false,
            message: `Failed to fetch statistics: ${errorMessage}`,
            error_code: 'STATS_FETCH_FAILED'
          }, { status: 500 })
        }

      case 'get_at_risk':
        try {
          const { data: atRiskData, error: atRiskError } = await supabase.rpc('get_agents_at_risk')

          if (atRiskError) {
            console.error('At-risk RPC error:', atRiskError)
            
            // Handle specific RPC errors gracefully
            if (atRiskError.code === 'PGRST202') {
              return NextResponse.json({
                success: true,
                data: [],
                message: 'At-risk function not available, using empty array'
              })
            } else {
              throw atRiskError
            }
          }

          return NextResponse.json({
            success: true,
            data: atRiskData || []
          })
        } catch (error) {
          console.error('At-risk fetch error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown at-risk error'
          return NextResponse.json({
            success: false,
            message: `Failed to fetch agents at risk: ${errorMessage}`,
            error_code: 'AT_RISK_FETCH_FAILED'
          }, { status: 500 })
        }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action', error_code: 'INVALID_ACTION' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Automation API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${errorMessage}`, 
        error_code: 'INTERNAL_SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json(
        { success: false, message: 'Type parameter is required', error_code: 'MISSING_TYPE' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'stats':
        try {
          const { data: statsData, error: statsError } = await supabase.rpc(
            'get_automation_statistics',
            { p_days_back: 30 }
          )

          if (statsError) {
            console.error('Stats RPC error:', statsError)
            
            // Handle specific RPC errors gracefully
            if (statsError.code === 'PGRST202') {
              return NextResponse.json({
                success: true,
                data: {
                  total_runs: 0,
                  successful_runs: 0,
                  failed_runs: 0,
                  total_agents_processed: 0,
                  total_agents_deactivated: 0,
                  avg_execution_time_ms: 0,
                  last_run_at: null,
                  next_recommended_run: null
                },
                message: 'Statistics function not available, using default values'
              })
            } else {
              throw statsError
            }
          }

          return NextResponse.json({
            success: true,
            data: statsData?.[0] || null
          })
        } catch (error) {
          console.error('Stats fetch error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown stats error'
          return NextResponse.json({
            success: false,
            message: `Failed to fetch statistics: ${errorMessage}`,
            error_code: 'STATS_FETCH_FAILED'
          }, { status: 500 })
        }

      case 'at-risk':
        try {
          const { data: atRiskData, error: atRiskError } = await supabase.rpc('get_agents_at_risk')

          if (atRiskError) {
            console.error('At-risk RPC error:', atRiskError)
            
            // Handle specific RPC errors gracefully
            if (atRiskError.code === 'PGRST202') {
              return NextResponse.json({
                success: true,
                data: [],
                message: 'At-risk function not available, using empty array'
              })
            } else {
              throw atRiskError
            }
          }

          return NextResponse.json({
            success: true,
            data: atRiskData || []
          })
        } catch (error) {
          console.error('At-risk fetch error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown at-risk error'
          return NextResponse.json({
            success: false,
            message: `Failed to fetch agents at risk: ${errorMessage}`,
            error_code: 'AT_RISK_FETCH_FAILED'
          }, { status: 500 })
        }

      case 'activity-summary':
        try {
          const { data: summaryData, error: summaryError } = await supabase
            .from('agent_activity_summary')
            .select('*')
            .order('last_activity_at', { ascending: false })
            .limit(100)

          if (summaryError) {
            console.error('Activity summary error:', summaryError)
            throw summaryError
          }

          return NextResponse.json({
            success: true,
            data: summaryData || []
          })
        } catch (error) {
          console.error('Activity summary fetch error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown activity summary error'
          return NextResponse.json({
            success: false,
            message: `Failed to fetch activity summary: ${errorMessage}`,
            error_code: 'ACTIVITY_SUMMARY_FETCH_FAILED'
          }, { status: 500 })
        }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid type parameter', error_code: 'INVALID_TYPE' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Automation API GET error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${errorMessage}`, 
        error_code: 'INTERNAL_SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}
