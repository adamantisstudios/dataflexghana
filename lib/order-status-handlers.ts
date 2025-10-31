/**
 * ORDER STATUS CHANGE HANDLERS
 *
 * Automatically handles commission creation and reversal when order statuses change
 * Ensures commission integrity across all order types
 */

import { supabase } from "./supabase"
import { handleOrderStatusChange } from "./commission-reversal-system"

export interface OrderStatusChangeResult {
  success: boolean
  message: string
  commissionChange?: {
    action: "created" | "reversed" | "none"
    amount: number
    newCommissionBalance: number
  }
  error?: string
}

/**
 * Handle data order status changes with automatic commission management
 */
export async function handleDataOrderStatusChange(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    console.log("📱 Handling data order status change:", { orderId, oldStatus, newStatus })

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("data_orders")
      .select(`
        id,
        agent_id,
        commission_amount,
        data_bundles (name, provider, price, commission_rate)
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return {
        success: false,
        message: "Data order not found",
        error: "Order not found in database",
      }
    }

    // Determine commission action needed
    const wasCompleted = oldStatus === "completed"
    const isNowCompleted = newStatus === "completed"

    if (!wasCompleted && isNowCompleted) {
      // Order completed - create commission
      return await createDataOrderCommission(order, adminId)
    } else if (wasCompleted && !isNowCompleted) {
      // Order no longer completed - reverse commission
      return await reverseDataOrderCommission(order, oldStatus, newStatus, adminId)
    } else {
      // No commission change needed
      return {
        success: true,
        message: "No commission change needed for this status transition",
      }
    }
  } catch (error) {
    console.error("❌ Error handling data order status change:", error)
    return {
      success: false,
      message: "System error occurred while handling status change",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Handle referral status changes with automatic commission management
 */
export async function handleReferralStatusChange(
  referralId: string,
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    console.log("👥 Handling referral status change:", { referralId, oldStatus, newStatus })

    // Get referral details
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select(`
        id,
        agent_id,
        client_name,
        services (title, commission_amount)
      `)
      .eq("id", referralId)
      .single()

    if (referralError || !referral) {
      return {
        success: false,
        message: "Referral not found",
        error: "Referral not found in database",
      }
    }

    // Determine commission action needed
    const wasCompleted = oldStatus === "completed"
    const isNowCompleted = newStatus === "completed"

    if (!wasCompleted && isNowCompleted) {
      // Referral completed - create commission
      return await createReferralCommission(referral, adminId)
    } else if (wasCompleted && !isNowCompleted) {
      // Referral no longer completed - reverse commission
      return await reverseReferralCommission(referral, oldStatus, newStatus, adminId)
    } else {
      // No commission change needed
      return {
        success: true,
        message: "No commission change needed for this status transition",
      }
    }
  } catch (error) {
    console.error("❌ Error handling referral status change:", error)
    return {
      success: false,
      message: "System error occurred while handling status change",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Handle wholesale order status changes with automatic commission management
 */
export async function handleWholesaleOrderStatusChange(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    console.log("🛒 Handling wholesale order status change:", { orderId, oldStatus, newStatus })

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("wholesale_orders")
      .select(`
        id,
        agent_id,
        commission_amount,
        quantity,
        wholesale_products (name, commission_value)
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return {
        success: false,
        message: "Wholesale order not found",
        error: "Order not found in database",
      }
    }

    const wasCompleted = oldStatus === "completed" || oldStatus === "delivered"
    const isNowCompleted = newStatus === "completed" || newStatus === "delivered"

    if (!wasCompleted && isNowCompleted) {
      // Order completed or delivered - create commission
      return await createWholesaleOrderCommission(order, adminId)
    } else if (wasCompleted && !isNowCompleted) {
      // Order no longer completed/delivered - reverse commission
      return await reverseWholesaleOrderCommission(order, oldStatus, newStatus, adminId)
    } else {
      // No commission change needed
      return {
        success: true,
        message: "No commission change needed for this status transition",
      }
    }
  } catch (error) {
    console.error("❌ Error handling wholesale order status change:", error)
    return {
      success: false,
      message: "System error occurred while handling status change",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Helper functions for commission creation

async function createDataOrderCommission(order: any, adminId: string): Promise<OrderStatusChangeResult> {
  try {
    const commissionAmount = Number(order.commission_amount) || 0

    if (commissionAmount <= 0) {
      return {
        success: false,
        message: "Cannot create commission - invalid commission amount",
        error: "Commission amount is zero or negative",
      }
    }

    const { data: commissionRecord, error: commissionError } = await supabase
      .from("commissions")
      .insert([
        {
          agent_id: order.agent_id,
          source_type: "data_order",
          source_id: order.id,
          amount: commissionAmount,
          status: "earned",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (commissionError) {
      console.error("❌ Error creating commission record:", commissionError)
      return {
        success: false,
        message: "Failed to create commission record",
        error: commissionError.message,
      }
    }

    // Add commission to agent's totalCommissions (legacy support)
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("totalCommissions")
      .eq("id", order.agent_id)
      .single()

    if (agentError || !agent) {
      return {
        success: false,
        message: "Agent not found",
        error: "Could not find agent to credit commission",
      }
    }

    const currentCommissions = Number(agent.totalCommissions) || 0
    const newCommissionBalance = currentCommissions + commissionAmount

    const { error: updateError } = await supabase
      .from("agents")
      .update({
        totalCommissions: newCommissionBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.agent_id)

    if (updateError) {
      console.error("❌ Error updating agent commission balance:", updateError)
      return {
        success: false,
        message: "Failed to update agent commission balance",
        error: updateError.message,
      }
    }

    console.log("✅ Data order commission created:", {
      orderId: order.id,
      agentId: order.agent_id,
      commissionAmount,
      newBalance: newCommissionBalance,
      commissionRecordId: commissionRecord.id,
    })

    return {
      success: true,
      message: `Commission of ${commissionAmount} created for data order completion`,
      commissionChange: {
        action: "created",
        amount: commissionAmount,
        newCommissionBalance,
      },
    }
  } catch (error) {
    console.error("❌ Error creating data order commission:", error)
    return {
      success: false,
      message: "System error occurred while creating commission",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function createReferralCommission(referral: any, adminId: string): Promise<OrderStatusChangeResult> {
  try {
    let commissionAmount = 0

    if (referral.services && referral.services.commission_amount) {
      commissionAmount = Number(referral.services.commission_amount)
    } else {
      // Fallback: fetch service details if not included in referral query
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("commission_amount")
        .eq("id", referral.service_id)
        .single()

      if (serviceError || !service) {
        console.error("❌ Error fetching service for referral commission:", serviceError)
        return {
          success: false,
          message: "Cannot create commission - service not found",
          error: "Service data missing for commission calculation",
        }
      }

      commissionAmount = Number(service.commission_amount) || 0
    }

    if (commissionAmount <= 0) {
      return {
        success: false,
        message: "Cannot create commission - invalid commission amount",
        error: "Commission amount is zero or negative",
      }
    }

    const { data: commissionRecord, error: commissionError } = await supabase
      .from("commissions")
      .insert([
        {
          agent_id: referral.agent_id,
          source_type: "referral",
          source_id: referral.id,
          amount: commissionAmount,
          status: "earned",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (commissionError) {
      console.error("❌ Error creating commission record:", commissionError)
      return {
        success: false,
        message: "Failed to create commission record",
        error: commissionError.message,
      }
    }

    // Add commission to agent's totalCommissions (legacy support)
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("totalCommissions")
      .eq("id", referral.agent_id)
      .single()

    if (agentError || !agent) {
      return {
        success: false,
        message: "Agent not found",
        error: "Could not find agent to credit commission",
      }
    }

    const currentCommissions = Number(agent.totalCommissions) || 0
    const newCommissionBalance = currentCommissions + commissionAmount

    const { error: updateError } = await supabase
      .from("agents")
      .update({
        totalCommissions: newCommissionBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referral.agent_id)

    if (updateError) {
      console.error("❌ Error updating agent commission balance:", updateError)
      return {
        success: false,
        message: "Failed to update agent commission balance",
        error: updateError.message,
      }
    }

    console.log("✅ Referral commission created:", {
      referralId: referral.id,
      agentId: referral.agent_id,
      commissionAmount,
      newBalance: newCommissionBalance,
      commissionRecordId: commissionRecord.id,
    })

    return {
      success: true,
      message: `Commission of ${commissionAmount} created for referral completion`,
      commissionChange: {
        action: "created",
        amount: commissionAmount,
        newCommissionBalance,
      },
    }
  } catch (error) {
    console.error("❌ Error creating referral commission:", error)
    return {
      success: false,
      message: "System error occurred while creating commission",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function createWholesaleOrderCommission(order: any, adminId: string): Promise<OrderStatusChangeResult> {
  try {
    const commissionAmount = Number(order.commission_amount) || 0

    if (commissionAmount <= 0) {
      return {
        success: false,
        message: "Cannot create commission - invalid commission amount",
        error: "Commission amount is zero or negative",
      }
    }

    const validStatuses = ["pending", "earned", "pending_withdrawal", "withdrawn"]
    const commissionStatus = "earned"

    if (!validStatuses.includes(commissionStatus)) {
      console.error("❌ Invalid commission status:", commissionStatus)
      return {
        success: false,
        message: "Failed to create commission record - invalid status",
        error: `Status '${commissionStatus}' is not valid. Must be one of: ${validStatuses.join(", ")}`,
      }
    }

    console.log("[v0] Creating commission with validated status:", {
      orderId: order.id,
      agentId: order.agent_id,
      amount: commissionAmount,
      status: commissionStatus,
    })

    const { data: commissionRecord, error: commissionError } = await supabase
      .from("commissions")
      .insert([
        {
          agent_id: order.agent_id,
          source_type: "wholesale_order",
          source_id: order.id,
          amount: commissionAmount,
          status: commissionStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (commissionError) {
      console.error("❌ Error creating commission record:", commissionError)
      console.error("❌ Error details:", {
        code: commissionError.code,
        message: commissionError.message,
        details: commissionError.details,
        hint: commissionError.hint,
      })
      return {
        success: false,
        message: "Failed to create commission record",
        error: `${commissionError.message} (Code: ${commissionError.code})`,
      }
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("totalCommissions")
      .eq("id", order.agent_id)
      .single()

    if (agentError || !agent) {
      return {
        success: false,
        message: "Agent not found",
        error: "Could not find agent to credit commission",
      }
    }

    const currentCommissions = Number(agent.totalCommissions) || 0
    const newCommissionBalance = currentCommissions + commissionAmount

    const { error: updateError } = await supabase
      .from("agents")
      .update({
        totalCommissions: newCommissionBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.agent_id)

    if (updateError) {
      console.error("❌ Error updating agent commission balance:", updateError)
      return {
        success: false,
        message: "Failed to update agent commission balance",
        error: updateError.message,
      }
    }

    console.log("✅ Wholesale order commission created:", {
      orderId: order.id,
      agentId: order.agent_id,
      commissionAmount,
      newBalance: newCommissionBalance,
      commissionRecordId: commissionRecord.id,
    })

    return {
      success: true,
      message: `Commission of ${commissionAmount} created for wholesale order completion`,
      commissionChange: {
        action: "created",
        amount: commissionAmount,
        newCommissionBalance,
      },
    }
  } catch (error) {
    console.error("❌ Error creating wholesale order commission:", error)
    return {
      success: false,
      message: "System error occurred while creating commission",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Helper functions for commission reversal

async function reverseDataOrderCommission(
  order: any,
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    const result = await handleOrderStatusChange(order.id, "data_order", oldStatus, newStatus, adminId)

    if (result.success) {
      return {
        success: true,
        message: result.message,
        commissionChange: {
          action: "reversed",
          amount: result.reversalAmount || 0,
          newCommissionBalance: 0, // Will be calculated by the reversal function
        },
      }
    } else {
      return {
        success: false,
        message: result.message,
        error: result.error,
      }
    }
  } catch (error) {
    console.error("❌ Error reversing data order commission:", error)
    return {
      success: false,
      message: "System error occurred while reversing commission",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function reverseReferralCommission(
  referral: any,
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    const result = await handleOrderStatusChange(referral.id, "referral", oldStatus, newStatus, adminId)

    if (result.success) {
      return {
        success: true,
        message: result.message,
        commissionChange: {
          action: "reversed",
          amount: result.reversalAmount || 0,
          newCommissionBalance: 0, // Will be calculated by the reversal function
        },
      }
    } else {
      return {
        success: false,
        message: result.message,
        error: result.error,
      }
    }
  } catch (error) {
    console.error("❌ Error reversing referral commission:", error)
    return {
      success: false,
      message: "System error occurred while reversing commission",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function reverseWholesaleOrderCommission(
  order: any,
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    const result = await handleOrderStatusChange(order.id, "wholesale_order", oldStatus, newStatus, adminId)

    if (result.success) {
      return {
        success: true,
        message: result.message,
        commissionChange: {
          action: "reversed",
          amount: result.reversalAmount || 0,
          newCommissionBalance: 0, // Will be calculated by the reversal function
        },
      }
    } else {
      return {
        success: false,
        message: result.message,
        error: result.error,
      }
    }
  } catch (error) {
    console.error("❌ Error reversing wholesale order commission:", error)
    return {
      success: false,
      message: "System error occurred while reversing commission",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Wrapper function to handle any order status change
 */
export async function handleAnyOrderStatusChange(
  orderId: string,
  orderType: "data_order" | "referral" | "wholesale_order",
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<OrderStatusChangeResult> {
  try {
    switch (orderType) {
      case "data_order":
        return await handleDataOrderStatusChange(orderId, oldStatus, newStatus, adminId)

      case "referral":
        return await handleReferralStatusChange(orderId, oldStatus, newStatus, adminId)

      case "wholesale_order":
        return await handleWholesaleOrderStatusChange(orderId, oldStatus, newStatus, adminId)

      default:
        return {
          success: false,
          message: "Unknown order type",
          error: `Unsupported order type: ${orderType}`,
        }
    }
  } catch (error) {
    console.error("❌ Error handling order status change:", error)
    return {
      success: false,
      message: "System error occurred while handling order status change",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Bulk process order status changes (for admin utilities)
 */
export async function bulkHandleOrderStatusChanges(
  changes: Array<{
    orderId: string
    orderType: "data_order" | "referral" | "wholesale_order"
    oldStatus: string
    newStatus: string
  }>,
  adminId: string,
): Promise<{
  successful: number
  failed: number
  totalCommissionChange: number
  results: OrderStatusChangeResult[]
  errors: string[]
}> {
  let successful = 0
  let failed = 0
  let totalCommissionChange = 0
  const results: OrderStatusChangeResult[] = []
  const errors: string[] = []

  for (const change of changes) {
    try {
      const result = await handleAnyOrderStatusChange(
        change.orderId,
        change.orderType,
        change.oldStatus,
        change.newStatus,
        adminId,
      )

      results.push(result)

      if (result.success) {
        successful++
        if (result.commissionChange) {
          const changeAmount =
            result.commissionChange.action === "created"
              ? result.commissionChange.amount
              : -result.commissionChange.amount
          totalCommissionChange += changeAmount
        }
      } else {
        failed++
        errors.push(`${change.orderType} ${change.orderId}: ${result.error || result.message}`)
      }
    } catch (error) {
      failed++
      const errorMessage = `${change.orderType} ${change.orderId}: ${error instanceof Error ? error.message : "Unknown error"}`
      errors.push(errorMessage)
      results.push({
        success: false,
        message: errorMessage,
        error: errorMessage,
      })
    }
  }

  return {
    successful,
    failed,
    totalCommissionChange,
    results,
    errors,
  }
}
