import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('x-agent-id')
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 12
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // 'published', 'unpublished', or ''
    const offset = (page - 1) * limit

    if (!agentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Build the query
    let query = supabase
      .from('wholesale_products')
      .select('*', { count: 'exact' })
      .eq('submitted_by_agent_id', agentId)

    // Apply search filter
    if (search) {
      query = query.ilike('product_name', `%${search}%`)
    }

    // Apply status filter
    if (status === 'published') {
      query = query.eq('is_published', true)
    } else if (status === 'unpublished') {
      query = query.eq('is_published', false)
    }

    // Sort by created_at descending
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      products: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error in my-products route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
