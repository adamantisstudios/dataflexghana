/**
 * COMMISSION SYNCHRONIZATION SYSTEM - COMPREHENSIVE FIX
 *
 * This system ensures that commissions are properly calculated and synchronized
 * when data orders are marked as completed. It handles:
 * - Automatic commission calculation using exact rates
 * - Commission deposit to wallet transactions
 * - Proper error handling and validation
 * - Commission display synchronization
 */

import { supabase } from "./supabase"
import { getDisplayCommission, calculateCorrectCommission } from "./commission-calculator"
import { createCommissionTransaction } from "./wallet-transaction-types"

export interface CommissionSyncResult {
  success: boolean
  commissionAmount: number
  transactionId?: string
  error?: string
  skipped?: boolean
  commissionRecordId?: string
}

/**
 * CRITICAL FIX: Synchronize commission for a completed data order
 * This function is called when a data order status changes to 'completed'
 */
export async function syncDataOrderCommission(
  orderId: string,
  agentId: string,
  bundleId: string,
  forceRecalculate = false,
): Promise<CommissionSyncResult> {
  try {
    console.log("Starting commission sync for data order:", { orderId, agentId, bundleId })

    // Get the data order with bundle information
    const { data: orderData, error: orderError } = await supabase
      .from("data_orders")
      .select(`
        *,
        data_bundles!fk_data_orders_bundle_id (
          id,
          name,
          provider,
          size_gb,
          price,
          commission_rate
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !orderData) {
      throw new Error(`Failed to fetch order data: ${orderError?.message || "Order not found"}`)
    }

    // Validate order status
    if (orderData.status !== "completed") {
      return {
        success: true,
        commissionAmount: 0,
        skipped: true,
        error: "Order is not completed, skipping commission sync",
      }
    }

    // Get bundle information
    const bundle = orderData.data_bundles
    if (!bundle || !bundle.price || !bundle.commission_rate) {
      throw new Error("Bundle information is incomplete - missing price or commission rate")
    }

    const displayCommission = calculateCorrectCommission(bundle.price, bundle.commission_rate)

    console.log("Commission calculation:", {
      bundlePrice: bundle.price,
      commissionRate: bundle.commission_rate,
      calculatedCommission: displayCommission,
    })

    // Check if commission has already been processed (unless forcing recalculation)
    if (!forceRecalculate) {
      const { data: existingTransaction, error: checkError } = await supabase
        .from("wallet_transactions")
        .select("id, amount")
        .eq("agent_id", agentId)
        .eq("transaction_type", "commission_deposit")
        .eq("source_id", orderId)
        .single()

      if (!checkError && existingTransaction) {
        console.log("Commission already processed for this order:", existingTransaction.id)
        return {
          success: true,
          commissionAmount: existingTransaction.amount,
          transactionId: existingTransaction.id,
          skipped: true,
        }
      }
    }

    // Update the data order with calculated commission amount
    const { error: updateError } = await supabase
      .from("data_orders")
      .update({
        commission_amount: displayCommission,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      console.warn("Failed to update order commission amount:", updateError)
      // Continue with wallet transaction creation even if order update fails
    }

    // Create commission transaction in wallet
    const commissionResult = createCommissionTransaction(
      orderId,
      agentId,
      bundle.price,
      bundle.commission_rate * 100, // Convert to percentage
    )

    if (!commissionResult.success) {
      throw new Error(commissionResult.error || "Failed to create commission transaction")
    }

    if (commissionResult.skipped) {
      return {
        success: true,
        commissionAmount: displayCommission,
        skipped: true,
        error: "Commission amount below threshold",
      }
    }

    if (!commissionResult.transaction) {
      throw new Error("Commission transaction was not created")
    }

    // Insert the commission transaction into the database
    const { data: insertedTransaction, error: insertError } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          ...commissionResult.transaction,
          source_type: "data_order",
          source_id: orderId,
        },
      ])
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert commission transaction: ${insertError.message}`)
    }

    if (displayCommission <= 0) {
      console.log(`Skipping commission record insert for order ${orderId} - amount is 0 or less`)
      return {
        success: true,
        commissionAmount: displayCommission,
        transactionId: insertedTransaction.id,
        commissionRecordId: undefined,
      }
    }

    const { data: commissionRecord, error: commissionInsertError } = await supabase
      .from("commissions")
      .insert([
        {
          agent_id: agentId,
          source_type: "data_order",
          source_id: orderId,
          amount: displayCommission,
          status: "earned",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (commissionInsertError) {
      if (commissionInsertError.code === "23514" || commissionInsertError.message.includes("check constraint")) {
        console.warn("Commission insert skipped due to constraint violation:", {
          code: commissionInsertError.code,
          message: commissionInsertError.message,
          orderId,
          amount: displayCommission,
        })
        // Return success since wallet transaction was already created
        return {
          success: true,
          commissionAmount: displayCommission,
          transactionId: insertedTransaction.id,
          commissionRecordId: undefined,
        }
      }
      console.warn("Failed to create commission record:", commissionInsertError)
      // Continue execution - wallet transaction was successful
    } else {
      console.log("Commission record created:", commissionRecord.id)
    }

    console.log("Commission sync completed successfully:", {
      orderId,
      agentId,
      commissionAmount: displayCommission,
      transactionId: insertedTransaction.id,
      commissionRecordId: commissionRecord?.id,
    })

    return {
      success: true,
      commissionAmount: displayCommission,
      transactionId: insertedTransaction.id,
      commissionRecordId: commissionRecord?.id,
    }
  } catch (error) {
    console.error("Error in commission sync:", error)
    return {
      success: false,
      commissionAmount: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * CRITICAL FIX: Batch sync commissions for multiple completed orders
 * This is useful for fixing existing orders that may have missing commissions
 */
export async function batchSyncCommissions(
  agentId?: string,
  limit = 100,
): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> {
  try {
    console.log("Starting batch commission sync:", { agentId, limit })

    // Build query for completed orders without commission transactions
    let query = supabase
      .from("data_orders")
      .select(`
        id,
        agent_id,
        bundle_id,
        status,
        commission_amount,
        data_bundles!fk_data_orders_bundle_id (
          id,
          name,
          provider,
          price,
          commission_rate
        )
      `)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (agentId) {
      query = query.eq("agent_id", agentId)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    if (!orders || orders.length === 0) {
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: ["No completed orders found"],
      }
    }

    console.log(`Found ${orders.length} completed orders to process`)

    let processed = 0
    let successful = 0
    let failed = 0
    const errors: string[] = []

    // Process orders in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize)

      const batchPromises = batch.map(async (order) => {
        try {
          processed++

          const result = await syncDataOrderCommission(
            order.id,
            order.agent_id,
            order.bundle_id,
            false, // Don't force recalculation by default
          )

          if (result.success) {
            successful++
            if (!result.skipped) {
              console.log(`Commission synced for order ${order.id}: ${result.commissionAmount}`)
            }
          } else {
            failed++
            errors.push(`Order ${order.id}: ${result.error}`)
          }
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          errors.push(`Order ${order.id}: ${errorMessage}`)
          console.error(`Failed to sync commission for order ${order.id}:`, error)
        }
      })

      await Promise.all(batchPromises)

      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < orders.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log("Batch commission sync completed:", {
      processed,
      successful,
      failed,
      errorCount: errors.length,
    })

    return {
      processed,
      successful,
      failed,
      errors,
    }
  } catch (error) {
    console.error("Error in batch commission sync:", error)
    return {
      processed: 0,
      successful: 0,
      failed: 1,
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
    }
  }
}

/**
 * CRITICAL FIX: Validate and fix commission discrepancies
 * This function checks for orders where the commission_amount doesn't match
 * the calculated commission and fixes them
 */
export async function validateAndFixCommissions(
  agentId?: string,
  autoFix = false,
): Promise<{
  checked: number
  discrepancies: number
  fixed: number
  errors: string[]
}> {
  try {
    console.log("Starting commission validation:", { agentId, autoFix })

    // Get completed orders with bundle information
    let query = supabase
      .from("data_orders")
      .select(`
        id,
        agent_id,
        commission_amount,
        status,
        data_bundles!fk_data_orders_bundle_id (
          price,
          commission_rate
        )
      `)
      .eq("status", "completed")

    if (agentId) {
      query = query.eq("agent_id", agentId)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    if (!orders || orders.length === 0) {
      return {
        checked: 0,
        discrepancies: 0,
        fixed: 0,
        errors: ["No completed orders found"],
      }
    }

    let checked = 0
    let discrepancies = 0
    let fixed = 0
    const errors: string[] = []

    for (const order of orders) {
      try {
        checked++

        if (!order.data_bundles?.price || !order.data_bundles?.commission_rate) {
          errors.push(`Order ${order.id}: Missing bundle price or commission rate`)
          continue
        }

        const expectedCommission = getDisplayCommission(order.data_bundles.price, order.data_bundles.commission_rate)

        const currentCommission = order.commission_amount || 0
        const difference = Math.abs(expectedCommission - currentCommission)

        // Check for discrepancy (allow small floating point differences)
        if (difference > 0.001) {
          discrepancies++
          console.log(`Commission discrepancy found for order ${order.id}:`, {
            expected: expectedCommission,
            current: currentCommission,
            difference,
          })

          if (autoFix) {
            // Fix the commission amount in the order
            const { error: updateError } = await supabase
              .from("data_orders")
              .update({
                commission_amount: expectedCommission,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id)

            if (updateError) {
              errors.push(`Order ${order.id}: Failed to fix commission - ${updateError.message}`)
            } else {
              fixed++
              console.log(`Fixed commission for order ${order.id}: ${currentCommission} → ${expectedCommission}`)
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push(`Order ${order.id}: ${errorMessage}`)
        console.error(`Error validating order ${order.id}:`, error)
      }
    }

    console.log("Commission validation completed:", {
      checked,
      discrepancies,
      fixed,
      errorCount: errors.length,
    })

    return {
      checked,
      discrepancies,
      fixed,
      errors,
    }
  } catch (error) {
    console.error("Error in commission validation:", error)
    return {
      checked: 0,
      discrepancies: 0,
      fixed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
    }
  }
}

/**
 * CRITICAL FIX: Get commission summary for an agent
 * This provides a comprehensive view of all commission-related data
 */
export async function getAgentCommissionSummary(agentId: string): Promise<{
  totalCommissionEarned: number
  totalCommissionDeposited: number
  pendingCommissions: number
  completedOrders: number
  averageCommissionPerOrder: number
  lastCommissionDate: string | null
}> {
  try {
    // Get all completed orders with commission data
    const { data: orders, error: ordersError } = await supabase
      .from("data_orders")
      .select(`
        id,
        commission_amount,
        created_at,
        data_bundles!fk_data_orders_bundle_id (
          price,
          commission_rate
        )
      `)
      .eq("agent_id", agentId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    // Get commission deposits from wallet transactions
    const { data: commissionTransactions, error: transactionsError } = await supabase
      .from("wallet_transactions")
      .select("amount, created_at, status")
      .eq("agent_id", agentId)
      .eq("transaction_type", "commission_deposit")
      .order("created_at", { ascending: false })

    if (transactionsError) {
      console.warn("Failed to fetch commission transactions:", transactionsError)
    }

    const completedOrders = orders?.length || 0
    const totalCommissionEarned =
      orders?.reduce((sum, order) => {
        if (order.commission_amount) {
          return sum + order.commission_amount
        }
        // Fallback to calculated commission if not stored
        if (order.data_bundles?.price && order.data_bundles?.commission_rate) {
          return sum + getDisplayCommission(order.data_bundles.price, order.data_bundles.commission_rate)
        }
        return sum
      }, 0) || 0

    const totalCommissionDeposited =
      commissionTransactions?.filter((tx) => tx.status === "approved").reduce((sum, tx) => sum + tx.amount, 0) || 0

    const pendingCommissions =
      commissionTransactions?.filter((tx) => tx.status === "pending").reduce((sum, tx) => sum + tx.amount, 0) || 0

    const averageCommissionPerOrder = completedOrders > 0 ? totalCommissionEarned / completedOrders : 0

    const lastCommissionDate = orders && orders.length > 0 ? orders[0].created_at : null

    return {
      totalCommissionEarned,
      totalCommissionDeposited,
      pendingCommissions,
      completedOrders,
      averageCommissionPerOrder,
      lastCommissionDate,
    }
  } catch (error) {
    console.error("Error getting agent commission summary:", error)
    return {
      totalCommissionEarned: 0,
      totalCommissionDeposited: 0,
      pendingCommissions: 0,
      completedOrders: 0,
      averageCommissionPerOrder: 0,
      lastCommissionDate: null,
    }
  }
}
