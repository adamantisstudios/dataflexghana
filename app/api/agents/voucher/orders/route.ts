import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('e_orders')
      .select(`
        *,
        e_products (
          title,
          image_url,
          price
        )
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Transform the data to flatten product information
    const transformedOrders = (data || []).map(order => ({
      ...order,
      product_title: order.e_products?.title,
      product_image_url: order.e_products?.image_url,
      unit_price: order.e_products?.price
    }))

    return NextResponse.json({
      orders: transformedOrders
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agent_id,
      agent_name,
      product_id,
      quantity,
      delivery_method,
      delivery_contact
    } = body

    // Validate required fields
    if (!agent_id || !agent_name || !product_id || !quantity || !delivery_method || !delivery_contact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the create_voucher_order function
    const { data, error } = await supabase.rpc('create_voucher_order', {
      p_agent_id: agent_id,
      p_agent_name: agent_name,
      p_product_id: product_id,
      p_quantity: quantity,
      p_delivery_method: delivery_method,
      p_delivery_contact: delivery_contact
    })

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
