import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSafeWalletTransaction, generateSafeReferenceCode } from '@/lib/wallet-transaction-types'
import {
  createWholesaleOrder,
  updateProductStock,
  generateWholesaleOrderReference
} from '@/lib/wholesale'

// CRITICAL FIX: Enhanced Supabase configuration with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// CRITICAL FIX: Validate environment variables and provide clear error messages
function validateEnvironmentVariables() {
  const errors = []
  
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
  
  if (!supabaseServiceKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
  }
  
  return errors
}

// CRITICAL FIX: Create Supabase client with proper error handling
function createSupabaseClient() {
  const envErrors = validateEnvironmentVariables()
  
  if (envErrors.length > 0) {
    console.error('❌ Environment configuration errors:', envErrors)
    throw new Error(`Missing required environment variables: ${envErrors.join(', ')}`)
  }

  // Use service role key for admin operations
  const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'wholesale-checkout-api',
        'X-API-Route': 'wholesale-checkout'
      }
    }
  })

  return supabaseAdmin
}

interface CheckoutRequest {
  agent_id: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    commission_per_item: number
    selectedVariants?: Record<string, string> // Optional variant selections
  }>
  payment_method: 'wallet' | 'manual'
  payment_reference?: string
  delivery_address: string
  delivery_phone: string
  total_amount: number
  total_commission: number
}

interface OrderDataWithVariants {
  agent_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  commission_per_item: number
  commission_amount: number
  payment_method: 'wallet' | 'manual'
  payment_reference: string
  delivery_address: string
  delivery_phone: string
  status: 'pending'
  commission_paid: boolean
  variant_data?: Record<string, string> | null
}

// CRITICAL FIX: Enhanced error response function that always returns JSON
function createErrorResponse(message: string, status: number = 500, details?: any) {
  console.error(`❌ API Error (${status}):`, message, details ? { details } : '')
  
  return NextResponse.json(
    { 
      success: false,
      error: message,
      ...(details && { details })
    },
    { 
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

// CRITICAL FIX: Enhanced success response function
function createSuccessResponse(data: any, message?: string) {
  console.log('✅ API Success:', message || 'Operation completed successfully')
  
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      ...data
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

export async function POST(request: NextRequest) {
  let supabaseClient: any = null
  
  try {
    console.log('🛒 Wholesale checkout API called')
    
    // CRITICAL FIX: Initialize Supabase client with proper error handling
    try {
      supabaseClient = createSupabaseClient()
      console.log('✅ Supabase client initialized successfully')
    } catch (envError) {
      return createErrorResponse(
        'Server configuration error. Please contact support.',
        500,
        { configError: envError instanceof Error ? envError.message : 'Unknown configuration error' }
      )
    }

    // CRITICAL FIX: Parse request body with proper error handling
    let body: CheckoutRequest
    try {
      body = await request.json()
      console.log('📦 Request parsed:', {
        agent_id: body.agent_id,
        items_count: body.items?.length,
        payment_method: body.payment_method,
        total_amount: body.total_amount
      })
    } catch (parseError) {
      return createErrorResponse(
        'Invalid request format. Please check your data and try again.',
        400,
        { parseError: parseError instanceof Error ? parseError.message : 'JSON parse error' }
      )
    }

    // CRITICAL FIX: Enhanced input validation
    const validationErrors = []
    
    if (!body.agent_id?.trim()) {
      validationErrors.push('Agent ID is required')
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      validationErrors.push('At least one item is required')
    }
    
    if (!body.delivery_address?.trim()) {
      validationErrors.push('Delivery address is required')
    }
    
    if (!body.delivery_phone?.trim()) {
      validationErrors.push('Delivery phone is required')
    }
    
    if (!body.payment_method || !['wallet', 'manual'].includes(body.payment_method)) {
      validationErrors.push('Valid payment method is required (wallet or manual)')
    }
    
    if (body.payment_method === 'manual' && !body.payment_reference?.trim()) {
      validationErrors.push('Payment reference is required for manual payments')
    }
    
    if (!body.total_amount || body.total_amount <= 0) {
      validationErrors.push('Valid total amount is required')
    }

    // Validate individual items
    if (body.items && Array.isArray(body.items)) {
      body.items.forEach((item, index) => {
        if (!item.product_id?.trim()) {
          validationErrors.push(`Item ${index + 1}: Product ID is required`)
        }
        if (!item.quantity || item.quantity <= 0) {
          validationErrors.push(`Item ${index + 1}: Valid quantity is required`)
        }
        if (!item.unit_price || item.unit_price <= 0) {
          validationErrors.push(`Item ${index + 1}: Valid unit price is required`)
        }
        if (item.commission_per_item < 0) {
          validationErrors.push(`Item ${index + 1}: Commission per item cannot be negative`)
        }
      })
    }

    if (validationErrors.length > 0) {
      return createErrorResponse(
        'Validation failed',
        400,
        { validationErrors }
      )
    }

    // CRITICAL FIX: Get agent details with proper error handling
    console.log('👤 Looking up agent:', body.agent_id)
    let agent
    try {
      const { data: agentData, error: agentError } = await supabaseClient
        .from('agents')
        .select('wallet_balance, full_name, phone_number')
        .eq('id', body.agent_id)
        .single()

      if (agentError) {
        console.error('❌ Agent lookup error:', agentError)
        if (agentError.code === 'PGRST116') {
          return createErrorResponse('Agent not found', 404)
        }
        return createErrorResponse(
          'Failed to verify agent information',
          500,
          { dbError: agentError.message }
        )
      }

      if (!agentData) {
        return createErrorResponse('Agent not found', 404)
      }

      agent = agentData
      console.log('✅ Agent found:', {
        name: agent.full_name,
        wallet_balance: agent.wallet_balance
      })
    } catch (agentFetchError) {
      console.error('❌ Unexpected error fetching agent:', agentFetchError)
      return createErrorResponse(
        'Failed to verify agent information',
        500,
        { fetchError: agentFetchError instanceof Error ? agentFetchError.message : 'Unknown error' }
      )
    }

    // CRITICAL FIX: Validate wallet balance for wallet payments
    if (body.payment_method === 'wallet') {
      const walletBalance = agent.wallet_balance || 0
      if (walletBalance < body.total_amount) {
        return createErrorResponse(
          'Insufficient wallet balance',
          400,
          {
            required_amount: body.total_amount,
            current_balance: walletBalance,
            shortfall: body.total_amount - walletBalance
          }
        )
      }
    }

    // CRITICAL FIX: Process each item with comprehensive error handling
    const orderPromises = body.items.map(async (item, index) => {
      try {
        console.log(`📦 Processing item ${index + 1}:`, {
          product_id: item.product_id,
          quantity: item.quantity
        })

        // Validate product and stock
        const { data: product, error: productError } = await supabaseClient
          .from('wholesale_products')
          .select('quantity, is_active, commission_value, name, price')
          .eq('id', item.product_id)
          .single()

        if (productError) {
          console.error(`❌ Product lookup error for item ${index + 1}:`, productError)
          throw new Error(`Product ${item.product_id} not found`)
        }

        if (!product) {
          throw new Error(`Product ${item.product_id} not found`)
        }

        if (!product.is_active) {
          throw new Error(`Product "${product.name}" is not available`)
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`)
        }

        // Calculate commission
        const commissionPerItem = product.commission_value || item.commission_per_item || 0
        const totalCommissionForThisOrder = commissionPerItem * item.quantity

        // Create order data with variant information
        const orderData: OrderDataWithVariants = {
          agent_id: body.agent_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.unit_price * item.quantity,
          commission_per_item: commissionPerItem,
          commission_amount: totalCommissionForThisOrder,
          payment_method: body.payment_method,
          payment_reference: body.payment_reference || generateWholesaleOrderReference(),
          delivery_address: body.delivery_address,
          delivery_phone: body.delivery_phone,
          status: 'pending' as const,
          commission_paid: false,
          variant_data: item.selectedVariants && Object.keys(item.selectedVariants).length > 0 ? item.selectedVariants : null,
        }
        
        console.log(`📝 Order variant data:`, orderData.variant_data)

        console.log(`📝 Creating order for item ${index + 1}:`, {
          product_name: product.name,
          quantity: orderData.quantity,
          total_amount: orderData.total_amount,
          commission_amount: orderData.commission_amount
        })

        // Create order
        const { data: order, error: orderError } = await supabaseClient
          .from('wholesale_orders')
          .insert(orderData)
          .select(`
            *,
            variant_data,
            agents(full_name, phone_number, momo_number),
            wholesale_products(name, price, image_urls, category)
          `)
          .single()

        if (orderError) {
          console.error(`❌ Order creation error for item ${index + 1}:`, orderError)
          throw new Error(`Failed to create order for "${product.name}": ${orderError.message}`)
        }

        if (!order) {
          throw new Error(`No order data returned for "${product.name}"`)
        }

        console.log(`✅ Order created for item ${index + 1}:`, order.id)

        // Update product stock
        const newQuantity = product.quantity - item.quantity
        const { error: stockError } = await supabaseClient
          .from('wholesale_products')
          .update({ quantity: newQuantity })
          .eq('id', item.product_id)

        if (stockError) {
          console.error(`❌ Stock update error for item ${index + 1}:`, stockError)
          throw new Error(`Failed to update stock for "${product.name}": ${stockError.message}`)
        }

        console.log(`📦 Stock updated for item ${index + 1}:`, {
          product_name: product.name,
          old_quantity: product.quantity,
          new_quantity: newQuantity
        })

        return order
      } catch (itemError) {
        console.error(`❌ Error processing item ${index + 1}:`, itemError)
        throw itemError
      }
    })

    // CRITICAL FIX: Wait for all orders to be processed
    let orders
    try {
      orders = await Promise.all(orderPromises)
      console.log(`✅ All ${orders.length} orders created successfully`)
    } catch (orderProcessingError) {
      console.error('❌ Error processing orders:', orderProcessingError)
      return createErrorResponse(
        orderProcessingError instanceof Error ? orderProcessingError.message : 'Failed to process orders',
        500
      )
    }

    // CRITICAL FIX: Handle wallet payment with proper error handling
    if (body.payment_method === 'wallet') {
      try {
        const newBalance = agent.wallet_balance - body.total_amount

        const { error: balanceError } = await supabaseClient
          .from('agents')
          .update({ wallet_balance: newBalance })
          .eq('id', body.agent_id)

        if (balanceError) {
          console.error('❌ Wallet balance update error:', balanceError)
          return createErrorResponse(
            'Failed to process wallet payment. Please try again.',
            500,
            { balanceError: balanceError.message }
          )
        }

        console.log('💰 Wallet balance updated:', {
          agent_id: body.agent_id,
          old_balance: agent.wallet_balance,
          new_balance: newBalance,
          deducted: body.total_amount
        })

        // Create wallet transaction record
        try {
          await supabaseClient
            .from('wallet_transactions')
            .insert(createSafeWalletTransaction({
              agent_id: body.agent_id,
              transaction_type: 'deduction',
              amount: body.total_amount,
              description: `Wholesale order payment - ${orders.length} items`,
              reference_code: body.payment_reference || generateSafeReferenceCode('WHOLESALE'),
              status: 'approved'
            }))
          
          console.log('📝 Wallet transaction recorded')
        } catch (transactionError) {
          console.error('⚠️ Warning: Failed to create wallet transaction record:', transactionError)
          // Don't fail the entire request for transaction logging issues
        }
      } catch (walletError) {
        console.error('❌ Wallet payment processing error:', walletError)
        return createErrorResponse(
          'Failed to process wallet payment',
          500,
          { walletError: walletError instanceof Error ? walletError.message : 'Unknown wallet error' }
        )
      }
    }

    console.log('🎉 Checkout completed successfully:', {
      orders_created: orders.length,
      total_amount: body.total_amount,
      payment_method: body.payment_method
    })

    return createSuccessResponse(
      {
        orders,
        summary: {
          orders_created: orders.length,
          total_amount: body.total_amount,
          payment_method: body.payment_method
        }
      },
      `Successfully created ${orders.length} orders`
    )

  } catch (error) {
    console.error('💥 Unexpected error in checkout API:', error)
    
    // CRITICAL FIX: Always return JSON, never let HTML error pages through
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    )
  }
}
