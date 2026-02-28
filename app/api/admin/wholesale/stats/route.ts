import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all stats in parallel for better performance
    const [
      { count: totalProducts, error: productsError },
      { count: activeProducts, error: activeProductsError },
      { count: totalOrders, error: ordersError },
      { count: completedOrders, error: completedOrdersError },
      { count: pendingOrders, error: pendingOrdersError },
      { data: revenueData, error: revenueError }
    ] = await Promise.all([
      // Total products count
      supabase
        .from('wholesale_products')
        .select('*', { count: 'exact', head: true }),

      // Active products count
      supabase
        .from('wholesale_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total orders count
      supabase
        .from('wholesale_orders')
        .select('*', { count: 'exact', head: true }),

      // Completed orders count
      supabase
        .from('wholesale_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered'),

      // Pending orders count
      supabase
        .from('wholesale_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed', 'processing', 'in_transit']),

      // Total revenue from completed orders
      supabase
        .from('wholesale_orders')
        .select('total_amount')
        .eq('status', 'delivered')
    ])

    // Check for errors
    if (productsError) {
      console.error('Error fetching products count:', productsError)
    }
    if (activeProductsError) {
      console.error('Error fetching active products count:', activeProductsError)
    }
    if (ordersError) {
      console.error('Error fetching orders count:', ordersError)
    }
    if (completedOrdersError) {
      console.error('Error fetching completed orders count:', completedOrdersError)
    }
    if (pendingOrdersError) {
      console.error('Error fetching pending orders count:', pendingOrdersError)
    }
    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError)
    }

    // Calculate total revenue
    const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0

    const stats = {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalRevenue: totalRevenue
    }

    console.log('Wholesale stats:', stats) // Debug log

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching wholesale stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wholesale stats' },
      { status: 500 }
    )
  }
}
