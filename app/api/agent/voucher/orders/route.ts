import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check agent authentication from Authorization header (localStorage data)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Agent access required' },
        { status: 401 }
      )
    }

    let agentUser
    try {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      agentUser = JSON.parse(atob(token)) // Decode base64 token
      if (!agentUser || !agentUser.id) {
        throw new Error('Invalid agent session')
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid agent session' },
        { status: 401 }
      )
    }

    // Verify agent exists and is approved
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id, phone_number, isapproved, full_name')
      .eq('id', agentUser.id)
      .eq('isapproved', true)
      .single()

    if (agentError || !agentData) {
      return NextResponse.json(
        { error: 'Agent not found or not approved' },
        { status: 401 }
      )
    }

    // Fetch orders for this specific agent
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
      .eq('agent_id', agentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data with null checks
    const transformedOrders = (data || []).map(order => ({
      ...order,
      product_title: order.e_products?.title || 'Unknown Product',
      product_image_url: order.e_products?.image_url || null,
      unit_price: order.e_products?.price || 0,
      agent_name: order.agent_name || agentData.full_name || 'Unknown Agent'
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check agent authentication from Authorization header (localStorage data)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Agent access required' },
        { status: 401 }
      )
    }

    let agentUser
    try {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      agentUser = JSON.parse(atob(token)) // Decode base64 token
      if (!agentUser || !agentUser.id) {
        throw new Error('Invalid agent session')
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid agent session' },
        { status: 401 }
      )
    }

    // Verify agent exists and is approved
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id, phone_number, isapproved, full_name')
      .eq('id', agentUser.id)
      .eq('isapproved', true)
      .single()

    if (agentError || !agentData) {
      return NextResponse.json(
        { error: 'Agent not found or not approved' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      product_id,
      quantity,
      payment_reference,
      payment_number,
      delivery_method,
      delivery_contact
    } = body

    // Validate required fields
    if (!product_id || !quantity || !payment_reference || !delivery_method || !delivery_contact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate quantity
    const numQuantity = parseInt(quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer' },
        { status: 400 }
      )
    }

    // Validate delivery method
    if (!['email', 'whatsapp'].includes(delivery_method)) {
      return NextResponse.json(
        { error: 'Invalid delivery method' },
        { status: 400 }
      )
    }

    // Get product details and check availability
    const { data: product, error: productError } = await supabase
      .from('e_products')
      .select('*')
      .eq('id', product_id)
      .eq('status', 'published')
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    if (product.quantity < numQuantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available' },
        { status: 400 }
      )
    }

    // Calculate total cost
    const totalCost = product.price * numQuantity

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('e_orders')
      .insert({
        agent_id: agentUser.id,
        agent_name: agentData.full_name || agentData.phone_number,
        product_id,
        quantity: numQuantity,
        total_cost: totalCost,
        payment_reference,
        payment_number: payment_number || '0557943392',
        delivery_method,
        delivery_contact,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      )
    }

    // Update product quantity
    const { error: updateError } = await supabase
      .from('e_products')
      .update({ quantity: product.quantity - numQuantity })
      .eq('id', product_id)

    if (updateError) {
      console.error('Error updating product quantity:', updateError)
      // Note: In a production system, you'd want to implement proper transaction handling
      // For now, we'll log the error but not fail the order
    }

    return NextResponse.json({
      success: true,
      order: orderData,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
