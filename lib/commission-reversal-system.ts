/**
 * COMMISSION REVERSAL SYSTEM
 * 
 * Handles automatic commission reversal when order status changes from completed to non-completed
 * Ensures commission integrity across the platform
 */

import { supabase } from './supabase'
import { reverseCommissionForOrderStatusChange } from './withdrawal-security-fix'

export interface CommissionReversalResult {
  success: boolean
  message: string
  reversalAmount?: number
  error?: string
}

/**
 * Monitor and handle order status changes that require commission reversal
 */
export async function handleOrderStatusChange(
  orderId: string,
  orderType: 'data_order' | 'referral' | 'wholesale_order',
  oldStatus: string,
  newStatus: string,
  adminId: string
): Promise<CommissionReversalResult> {
  try {
    console.log('🔄 Handling order status change:', {
      orderId, orderType, oldStatus, newStatus, adminId
    })

    // Check if commission reversal is needed
    const needsReversal = shouldReverseCommission(oldStatus, newStatus)
    
    if (!needsReversal) {
      return {
        success: true,
        message: 'No commission reversal needed for this status change'
      }
    }

    // Process the commission reversal
    const reversalResult = await reverseCommissionForOrderStatusChange(
      orderId, orderType, oldStatus, newStatus, adminId
    )

    if (reversalResult.success) {
      // Log the reversal for audit trail
      await logCommissionReversal(orderId, orderType, oldStatus, newStatus, adminId)
      
      return {
        success: true,
        message: reversalResult.message,
        reversalAmount: await getCommissionAmount(orderId, orderType)
      }
    } else {
      return {
        success: false,
        message: reversalResult.message || 'Failed to reverse commission',
        error: reversalResult.error
      }
    }

  } catch (error) {
    console.error('❌ Error handling order status change:', error)
    return {
      success: false,
      message: 'System error occurred while handling order status change',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Determine if commission reversal is needed based on status change
 */
function shouldReverseCommission(oldStatus: string, newStatus: string): boolean {
  // Commission should be reversed if:
  // 1. Old status was 'completed' or 'delivered' (commission was earned)
  // 2. New status is NOT 'completed' or 'delivered' (commission should be removed)
  
  const completedStatuses = ['completed', 'delivered']
  const wasCompleted = completedStatuses.includes(oldStatus)
  const isStillCompleted = completedStatuses.includes(newStatus)
  
  return wasCompleted && !isStillCompleted
}

/**
 * Get commission amount for an order
 */
async function getCommissionAmount(orderId: string, orderType: 'data_order' | 'referral' | 'wholesale_order'): Promise<number> {
  try {
    switch (orderType) {
      case 'data_order':
        const { data: dataOrder } = await supabase
          .from('data_orders')
          .select('commission_amount')
          .eq('id', orderId)
          .single()
        return Number(dataOrder?.commission_amount) || 0

      case 'referral':
        const { data: referral } = await supabase
          .from('referrals')
          .select('services(commission_amount)')
          .eq('id', orderId)
          .single()
        return Number(referral?.services?.commission_amount) || 0

      case 'wholesale_order':
        const { data: wholesaleOrder } = await supabase
          .from('wholesale_orders')
          .select('commission_amount')
          .eq('id', orderId)
          .single()
        return Number(wholesaleOrder?.commission_amount) || 0

      default:
        return 0
    }
  } catch (error) {
    console.error('❌ Error getting commission amount:', error)
    return 0
  }
}

/**
 * Log commission reversal for audit trail
 */
async function logCommissionReversal(
  orderId: string,
  orderType: string,
  oldStatus: string,
  newStatus: string,
  adminId: string
): Promise<void> {
  try {
    const commissionAmount = await getCommissionAmount(orderId, orderType as any)
    
    await supabase
      .from('commission_reversal_log')
      .insert({
        order_id: orderId,
        order_type: orderType,
        old_status: oldStatus,
        new_status: newStatus,
        commission_amount: commissionAmount,
        admin_id: adminId,
        reversal_reason: `Status changed from ${oldStatus} to ${newStatus}`,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.warn('⚠️ Failed to log commission reversal (non-critical):', error)
  }
}

/**
 * Bulk commission reversal for multiple orders (admin utility)
 */
export async function bulkReverseCommissions(
  orders: Array<{
    orderId: string
    orderType: 'data_order' | 'referral' | 'wholesale_order'
    oldStatus: string
    newStatus: string
  }>,
  adminId: string
): Promise<{
  successful: number
  failed: number
  totalReversed: number
  errors: string[]
}> {
  let successful = 0
  let failed = 0
  let totalReversed = 0
  const errors: string[] = []

  for (const order of orders) {
    try {
      const result = await handleOrderStatusChange(
        order.orderId,
        order.orderType,
        order.oldStatus,
        order.newStatus,
        adminId
      )

      if (result.success) {
        successful++
        totalReversed += result.reversalAmount || 0
      } else {
        failed++
        errors.push(`${order.orderType} ${order.orderId}: ${result.error || result.message}`)
      }
    } catch (error) {
      failed++
      errors.push(`${order.orderType} ${order.orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    successful,
    failed,
    totalReversed,
    errors
  }
}

/**
 * Validate commission integrity across all orders
 */
export async function validateCommissionIntegrity(): Promise<{
  isValid: boolean
  issues: Array<{
    orderId: string
    orderType: string
    issue: string
    recommendedAction: string
  }>
  summary: {
    totalOrders: number
    validOrders: number
    issuesFound: number
  }
}> {
  const issues: Array<{
    orderId: string
    orderType: string
    issue: string
    recommendedAction: string
  }> = []

  try {
    // Check data orders
    const { data: dataOrders } = await supabase
      .from('data_orders')
      .select('id, status, commission_amount, agent_id')

    if (dataOrders) {
      for (const order of dataOrders) {
        if (order.status === 'completed' && (!order.commission_amount || order.commission_amount <= 0)) {
          issues.push({
            orderId: order.id,
            orderType: 'data_order',
            issue: 'Completed order has no commission amount',
            recommendedAction: 'Calculate and set correct commission amount'
          })
        }
        
        if (order.status !== 'completed' && order.commission_amount > 0) {
          // Check if agent still has this commission in their balance
          const { data: agent } = await supabase
            .from('agents')
            .select('totalCommissions')
            .eq('id', order.agent_id)
            .single()
            
          if (agent && agent.totalCommissions > 0) {
            issues.push({
              orderId: order.id,
              orderType: 'data_order',
              issue: 'Non-completed order still has commission in agent balance',
              recommendedAction: 'Reverse commission from agent balance'
            })
          }
        }
      }
    }

    // Check referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        id, 
        status, 
        agent_id,
        services(commission_amount)
      `)

    if (referrals) {
      for (const referral of referrals) {
        const commissionAmount = Number(referral.services?.commission_amount) || 0
        
        if (referral.status === 'completed' && commissionAmount <= 0) {
          issues.push({
            orderId: referral.id,
            orderType: 'referral',
            issue: 'Completed referral has no commission amount',
            recommendedAction: 'Set correct commission amount in services table'
          })
        }
        
        if (referral.status !== 'completed' && commissionAmount > 0) {
          issues.push({
            orderId: referral.id,
            orderType: 'referral',
            issue: 'Non-completed referral may have commission in agent balance',
            recommendedAction: 'Verify and reverse commission if needed'
          })
        }
      }
    }

    // Check wholesale orders
    const { data: wholesaleOrders } = await supabase
      .from('wholesale_orders')
      .select('id, status, commission_amount, agent_id')

    if (wholesaleOrders) {
      for (const order of wholesaleOrders) {
        if (order.status === 'delivered' && (!order.commission_amount || order.commission_amount <= 0)) {
          issues.push({
            orderId: order.id,
            orderType: 'wholesale_order',
            issue: 'Delivered order has no commission amount',
            recommendedAction: 'Calculate and set correct commission amount'
          })
        }
        
        if (order.status !== 'delivered' && order.commission_amount > 0) {
          issues.push({
            orderId: order.id,
            orderType: 'wholesale_order',
            issue: 'Non-delivered order may have commission in agent balance',
            recommendedAction: 'Verify and reverse commission if needed'
          })
        }
      }
    }

    const totalOrders = (dataOrders?.length || 0) + (referrals?.length || 0) + (wholesaleOrders?.length || 0)
    const issuesFound = issues.length
    const validOrders = totalOrders - issuesFound

    return {
      isValid: issuesFound === 0,
      issues,
      summary: {
        totalOrders,
        validOrders,
        issuesFound
      }
    }

  } catch (error) {
    console.error('❌ Error validating commission integrity:', error)
    return {
      isValid: false,
      issues: [{
        orderId: 'system',
        orderType: 'validation',
        issue: 'System error during validation',
        recommendedAction: 'Contact system administrator'
      }],
      summary: {
        totalOrders: 0,
        validOrders: 0,
        issuesFound: 1
      }
    }
  }
}
