"use client"

import { useState, useCallback } from "react"
import { enhancedSupabase } from "@/lib/supabase-enhanced"
import { 
  createCommissionTransaction, 
  createRefundTransaction,
  calculateCommission,
  isCommissionAboveThreshold,
  MINIMUM_COMMISSION_THRESHOLD
} from "@/lib/wallet-transaction-types"

export interface OptimisticUpdateOptions {
  maxRetries?: number
  retryDelay?: number
  onSuccess?: () => void
  onError?: (error: any) => void
  onRetry?: (attempt: number) => void
}

/**
 * CRITICAL FIX: Enhanced optimistic update executor with improved error handling
 * FIXES APPLIED:
 * - Fixed error logging that was causing empty object display
 * - Better error serialization and parsing
 * - Improved transaction validation
 * - Enhanced retry logic with exponential backoff
 */
function useOptimisticExecutor() {
  const [isUpdating, setIsUpdating] = useState(false)

  const execute = useCallback(async (operation: () => Promise<any>, options: OptimisticUpdateOptions = {}) => {
    const { maxRetries = 2, retryDelay = 500, onSuccess, onError, onRetry } = options

    setIsUpdating(true)
    let lastError: any = null
    const attempts = Math.max(1, maxRetries)

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const result = await operation()

        // CRITICAL FIX: Better validation for null/undefined results
        if (result === null || result === undefined) {
          const validationError = new Error(
            "Operation completed but returned no data. This may indicate a validation issue or the record was not found.",
          )
          validationError.name = "ValidationError"
          throw validationError
        }

        if (onSuccess) onSuccess()
        setIsUpdating(false)
        return result
      } catch (err: any) {
        // CRITICAL FIX: Enhanced error handling with proper serialization
        let errorMessage = "Unknown error occurred"
        let errorDetails: Record<string, any> = {}

        // Better error parsing with safe serialization
        try {
          if (err instanceof Error) {
            errorMessage = err.message
            errorDetails = {
              name: err.name,
              message: err.message,
              stack: err.stack?.substring(0, 500), // Limit stack trace length
              cause: err.cause ? String(err.cause) : undefined,
            }
          } else if (typeof err === "string") {
            errorMessage = err
            errorDetails = { message: err, type: "string" }
          } else if (err && typeof err === "object") {
            // Handle Supabase error objects with safe parsing
            if (err.message) {
              errorMessage = err.message
            } else if (err.error_description) {
              errorMessage = err.error_description
            } else if (err.details) {
              errorMessage = err.details
            } else if (err.hint) {
              errorMessage = err.hint
            } else {
              errorMessage = "Unknown object error"
            }

            // Safe object serialization
            errorDetails = {
              message: errorMessage,
              code: err.code || undefined,
              details: err.details || undefined,
              hint: err.hint || undefined,
              statusCode: err.statusCode || undefined,
              statusText: err.statusText || undefined,
            }
          } else {
            errorMessage = "Unexpected error type"
            errorDetails = {
              type: typeof err,
              value: String(err),
              message: "Non-standard error object",
            }
          }
        } catch (parseError) {
          errorMessage = "Error parsing failed"
          errorDetails = {
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
            message: "Failed to parse error object",
          }
        }

        // CRITICAL FIX: Better handling of specific database constraint errors
        if (errorMessage.includes("wallet_transactions_amount_check") || errorMessage.includes("amount_check")) {
          errorMessage = "Invalid transaction amount. Amount must be positive and within valid range."
        } else if (errorMessage.includes("violates check constraint") || errorMessage.includes("check constraint")) {
          errorMessage = "Transaction validation failed. Please verify all transaction details are correct."
        } else if (errorMessage.includes("duplicate key value") || errorMessage.includes("unique constraint")) {
          errorMessage =
            "This transaction already exists or conflicts with existing data. Please refresh and try again."
        } else if (errorMessage.includes("foreign key constraint") || errorMessage.includes("violates foreign key")) {
          errorMessage = "Invalid reference data detected. Please refresh the page and try again."
        } else if (errorMessage.includes("not-null constraint") || errorMessage.includes("null value")) {
          errorMessage = "Required information is missing. Please check all required fields."
        } else if (errorMessage.includes("permission denied") || errorMessage.includes("insufficient_privilege")) {
          errorMessage = "You do not have permission to perform this action."
        } else if (
          errorMessage.includes("connection") ||
          errorMessage.includes("network") ||
          errorMessage.includes("timeout")
        ) {
          errorMessage = "Network connection issue. Please check your internet connection and try again."
        } else if (errorMessage.includes("PGRST") && errorMessage.includes("116")) {
          errorMessage = "No matching record found. The item may have been deleted or modified."
        } else if (errorMessage.includes("row-level security") || errorMessage.includes("RLS")) {
          errorMessage = "Access denied. Please ensure you are properly authenticated."
        }

        const normalized = new Error(errorMessage)
        normalized.name = "OptimisticUpdateError"
        lastError = normalized

        // CRITICAL FIX: Improved error logging with safe serialization
        console.error(`Update attempt ${attempt} failed:`, {
          attempt,
          maxAttempts: attempts,
          errorMessage,
          errorType: typeof err,
          errorConstructor: err?.constructor?.name || "Unknown",
          ...errorDetails, // Spread the safe error details
        })

        // CRITICAL FIX: Better retry logic - don't retry certain types of errors
        const shouldRetry =
          attempt < attempts &&
          !errorMessage.includes("permission denied") &&
          !errorMessage.includes("duplicate key") &&
          !errorMessage.includes("unique constraint") &&
          !errorMessage.includes("not-null constraint") &&
          !errorMessage.includes("check constraint") &&
          !errorMessage.includes("foreign key constraint")

        if (shouldRetry) {
          if (onRetry) onRetry(attempt + 1)
          // Exponential backoff with jitter
          const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 100
          await new Promise((res) => setTimeout(res, delay))
        } else {
          break // Don't retry for validation errors
        }
      }
    }

    setIsUpdating(false)
    if (onError) onError(lastError)
    throw lastError
  }, [])

  return { execute, isUpdating }
}

/**
 * CRITICAL FIX: Enhanced order status update hook with better validation
 * FIXES APPLIED:
 * - Pre-validation of order status changes
 * - Better error handling and rollback logic
 * - Improved user feedback for different error types
 * - Enhanced database operation validation
 */
export function useOptimisticUpdates() {
  const { execute, isUpdating } = useOptimisticExecutor()

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: string,
      dataOrders: any[],
      setDataOrders: (orders: any[]) => void,
      setCachedData?: (orders: any[]) => void,
    ) => {
      // CRITICAL FIX: Enhanced input validation
      if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
        throw new Error("Valid Order ID is required")
      }

      if (!status || typeof status !== "string" || status.trim() === "") {
        throw new Error("Valid status is required")
      }

      if (!Array.isArray(dataOrders)) {
        throw new Error("Invalid orders data provided - expected array")
      }

      // Validate status value against allowed values
      const validStatuses = ["pending", "processing", "completed", "canceled", "cancelled"]
      const normalizedStatus = status.toLowerCase().trim()
      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(`Invalid status: "${status}". Must be one of: ${validStatuses.join(", ")}`)
      }

      const previous = [...dataOrders]

      // Find the order to update with better validation
      const orderToUpdate = previous.find((o) => o && o.id === orderId)
      if (!orderToUpdate) {
        throw new Error(`Order with ID "${orderId}" not found in current data`)
      }

      // Check if the status is actually changing
      if (orderToUpdate.status === normalizedStatus) {
        console.log(`Order ${orderId} already has status "${normalizedStatus}", skipping update`)
        return orderToUpdate // Return existing order if no change needed
      }

      // Optimistic state update
      const optimistic = previous.map((o) =>
        o && o.id === orderId ? { ...o, status: normalizedStatus, updated_at: new Date().toISOString() } : o,
      )
      setDataOrders(optimistic)
      if (setCachedData) setCachedData(optimistic)

      // Persist to database with enhanced error handling
      return execute(
        async () => {
          // CRITICAL FIX: Enhanced database update with comprehensive debugging
          try {
            console.log(`Attempting to update order ${orderId} to status ${normalizedStatus}`)

            // Check if supabase client is properly initialized
            if (!enhancedSupabase) {
              throw new Error("Supabase client not initialized")
            }

            // Check authentication status
            const {
              data: { session },
            } = await enhancedSupabase.auth.getSession()
            console.log(`Auth session exists: ${!!session}`)

            // CRITICAL FIX: Only update fields that exist in the data_orders table
            const updatePayload = {
              status: normalizedStatus,
              updated_at: new Date().toISOString(),
            }

            console.log("Update payload:", updatePayload)

            const { data, error } = await enhancedSupabase
              .from("data_orders")
              .update(updatePayload)
              .eq("id", orderId)
              .select("*")
              .maybeSingle()

            // Enhanced debugging for the response
            console.log(`Database response - Data exists: ${!!data}, Error exists: ${!!error}`)

            if (data) {
              console.log("Returned data keys:", Object.keys(data))
            }

            if (error) {
              // CRITICAL FIX: Enhanced error handling for phone_number field error
              let errorInfo = "Could not extract error information"

              try {
                // Try different ways to extract error information
                if (typeof error === "string") {
                  errorInfo = error
                } else if (error && typeof error === "object") {
                  // Try to extract any available information
                  const extractedInfo = []

                  // Check common error properties
                  if ("message" in error && error.message) extractedInfo.push(`message: ${error.message}`)
                  if ("code" in error && error.code) extractedInfo.push(`code: ${error.code}`)
                  if ("details" in error && error.details) extractedInfo.push(`details: ${error.details}`)
                  if ("hint" in error && error.hint) extractedInfo.push(`hint: ${error.hint}`)
                  if ("statusCode" in error && error.statusCode) extractedInfo.push(`statusCode: ${error.statusCode}`)
                  if ("statusText" in error && error.statusText) extractedInfo.push(`statusText: ${error.statusText}`)

                  // Try to get all enumerable properties
                  try {
                    const keys = Object.keys(error)
                    if (keys.length > 0) {
                      extractedInfo.push(`keys: [${keys.join(", ")}]`)
                      keys.forEach((key) => {
                        try {
                          const value = error[key]
                          if (value !== null && value !== undefined) {
                            extractedInfo.push(`${key}: ${String(value).substring(0, 100)}`)
                          }
                        } catch (e) {
                          extractedInfo.push(`${key}: [could not access]`)
                        }
                      })
                    }
                  } catch (e) {
                    extractedInfo.push("Could not enumerate error properties")
                  }

                  errorInfo = extractedInfo.length > 0 ? extractedInfo.join(", ") : `Raw error: ${String(error)}`
                } else {
                  errorInfo = `Non-object error: ${String(error)} (type: ${typeof error})`
                }
              } catch (inspectionError) {
                errorInfo = `Error inspection failed: ${String(inspectionError)}, Original: ${String(error)}`
              }

              console.error("Database update error details:", errorInfo)
              console.error("Error occurred for order:", orderId, "with status:", normalizedStatus)

              // CRITICAL FIX: Better error message with specific handling for phone_number error
              let userMessage = "Failed to update order status"

              try {
                if (typeof error === "string") {
                  userMessage = `Database error: ${error}`
                } else if (error && typeof error === "object") {
                  // Try multiple properties to get error message
                  const errorMsg = error.message || error.details || error.hint || error.error_description || error.msg
                  const errorCode = error.code || error.error_code || error.status

                  if (errorCode === "PGRST116") {
                    userMessage = "Order not found - it may have been deleted"
                  } else if (errorMsg && errorMsg.includes('phone_number')) {
                    // CRITICAL FIX: Handle the specific phone_number field error
                    userMessage = "Database schema error detected. This appears to be a database trigger or constraint issue. Please contact system administrator."
                    console.error("CRITICAL: phone_number field error detected - this suggests a database trigger is trying to access a non-existent field")
                  } else if (errorMsg) {
                    userMessage = `Database error: ${errorMsg}`
                  } else if (errorCode) {
                    userMessage = `Database error (code ${errorCode})`
                  } else {
                    userMessage = `Database error: ${String(error)}`
                  }
                } else {
                  userMessage = `Database error: ${String(error)}`
                }
              } catch (msgError) {
                userMessage = `Database error (could not parse): ${String(error)}`
              }

              const dbError = new Error(userMessage)
              dbError.name = "DatabaseError"
              throw dbError
            }

            if (!data) {
              const noDataError = new Error(
                "Update operation completed but no order data was returned. The order may have been deleted.",
              )
              noDataError.name = "NoDataError"
              throw noDataError
            }

            // CRITICAL FIX: Validate the returned data
            if (!data.id || data.id !== orderId) {
              const validationError = new Error(
                "Update operation returned unexpected data. Please refresh and try again.",
              )
              validationError.name = "ValidationError"
              throw validationError
            }

            // CRITICAL FIX: Separate order status update from commission/refund creation
            // Order status update is now complete - handle transactions asynchronously

            // Reconcile with server response FIRST
            const reconciled = optimistic.map((o) => (o && o.id === orderId ? {...o, ...data } : o))
            setDataOrders(reconciled)
            if (setCachedData) setCachedData(reconciled)

            console.log(`Successfully updated order ${orderId} to status "${normalizedStatus}"`)

            // CRITICAL FIX: Non-blocking commission/refund creation using wallet_transactions
            // These operations run in the background and don't affect order status
            if (normalizedStatus === "completed") {
              // Create commission transaction asynchronously
              setTimeout(async () => {
                try {
                  console.log("Creating commission transaction for completed order:", orderId)

                  // CRITICAL FIX: Enhanced commission calculation with proper validation
                  let bundlePrice = 0
                  let commissionRate = 0

                  // Extract bundle price with multiple fallbacks
                  if (orderToUpdate.data_bundles?.price) {
                    bundlePrice = Number(orderToUpdate.data_bundles.price)
                  } else if (orderToUpdate.total_amount) {
                    bundlePrice = Number(orderToUpdate.total_amount)
                  } else if (orderToUpdate.amount) {
                    bundlePrice = Number(orderToUpdate.amount)
                  } else {
                    console.warn("No bundle price found for order:", orderId)
                    return // Skip commission creation if no price
                  }

                  // Extract commission rate with validation
                  if (orderToUpdate.data_bundles?.commission_rate) {
                    commissionRate = Number(orderToUpdate.data_bundles.commission_rate)
                  } else if (orderToUpdate.commission_rate) {
                    commissionRate = Number(orderToUpdate.commission_rate)
                  } else {
                    // Use a default commission rate if none specified
                    commissionRate = 0.10 // 10% default
                    console.log("Using default commission rate of 10% for order:", orderId)
                  }

                  // CRITICAL FIX: Validate inputs before calculation
                  if (isNaN(bundlePrice) || bundlePrice <= 0) {
                    console.warn("Invalid bundle price for commission calculation:", bundlePrice)
                    return
                  }

                  if (isNaN(commissionRate) || commissionRate <= 0) {
                    console.warn("Invalid commission rate for calculation:", commissionRate)
                    return
                  }

                  // Calculate commission amount with proper rounding
                  // If commission_rate is already a percentage (e.g., 10), use it directly
                  // If it's a decimal (e.g., 0.10), convert to percentage
                  let calculatedCommission
                  if (commissionRate > 1) {
                    // Rate is already a percentage (e.g., 10 for 10%)
                    calculatedCommission = (bundlePrice * commissionRate) / 100
                  } else {
                    // Rate is a decimal (e.g., 0.10 for 10%)
                    calculatedCommission = bundlePrice * commissionRate
                  }

                  // Round to 2 decimal places and ensure minimum threshold
                  const commissionAmount = Math.round(calculatedCommission * 100) / 100

                  console.log("Commission calculation:", {
                    orderId,
                    bundlePrice,
                    commissionRate,
                    calculatedCommission,
                    finalAmount: commissionAmount
                  })

                  // CRITICAL FIX: Only create commission if above minimum threshold (0.01)
                  if (commissionAmount < 0.01) {
                    console.log("Commission amount below minimum threshold (0.01), skipping creation:", commissionAmount)
                    return
                  }

                  // CRITICAL FIX: Create wallet transaction directly instead of using commissions table
                  const commissionTransaction = {
                    agent_id: orderToUpdate.agent_id,
                    transaction_type: 'commission_deposit',
                    amount: commissionAmount,
                    description: `Data order commission - Order #${orderId.substring(0, 8)}`,
                    status: 'approved',
                    payment_method: 'auto',
                    reference_code: `COMM-${orderId.substring(0, 8)}-${Date.now()}`,
                    admin_notes: `Auto-generated commission for completed order ${orderId}. Rate: ${commissionRate > 1 ? commissionRate + '%' : (commissionRate * 100) + '%'}, Bundle: GH₵${bundlePrice.toFixed(2)}`,
                  }

                  console.log("Creating commission transaction:", commissionTransaction)

                  // Insert the commission transaction into wallet_transactions
                  const { data: txData, error: txError } = await enhancedSupabase
                    .from("wallet_transactions")
                    .insert([commissionTransaction])
                    .select()

                  if (txError) {
                    console.error("Commission transaction database error:", {
                      error: txError.message || txError,
                      code: txError.code,
                      details: txError.details,
                      orderId,
                      transaction: commissionTransaction
                    })
                    // Don't throw error - just log it so order status update continues
                  } else {
                    console.log("Commission transaction created successfully:", txData)
                  }
                } catch (error) {
                  // Log error but don't affect order status
                  console.error("Background commission creation failed:", {
                    error: error instanceof Error ? error.message : String(error),
                    orderId,
                    agentId: orderToUpdate.agent_id
                  })
                }
              }, 100) // Small delay to ensure order update completes first
            }

            if (normalizedStatus === "canceled" || normalizedStatus === "cancelled") {
              // Create refund transaction asynchronously
              setTimeout(async () => {
                try {
                  console.log("Creating refund transaction for cancelled order:", orderId)

                  // Extract refund amount
                  let refundAmount = 0

                  if (orderToUpdate.total_amount) {
                    refundAmount = Number(orderToUpdate.total_amount)
                  } else if (orderToUpdate.amount) {
                    refundAmount = Number(orderToUpdate.amount)
                  } else if (orderToUpdate.data_bundles?.price) {
                    refundAmount = Number(orderToUpdate.data_bundles.price)
                  } else {
                    refundAmount = 10.0 // Fallback
                  }

                  // Round to 2 decimal places
                  const roundedRefund = Math.round(refundAmount * 100) / 100

                  // CRITICAL FIX: Create wallet transaction directly
                  const refundTransaction = {
                    agent_id: orderToUpdate.agent_id,
                    transaction_type: 'refund',
                    amount: roundedRefund,
                    description: `Data order refund - Order #${orderId}`,
                    status: 'approved',
                    reference_code: `REFUND-${orderId}-${Date.now()}`,
                    admin_notes: `Auto-generated refund for cancelled order ${orderId}`,
                    source_type: 'data_order',
                    source_id: orderId
                  }

                  // Insert the refund transaction into wallet_transactions
                  const { data: txData, error: txError } = await enhancedSupabase
                    .from("wallet_transactions")
                    .insert([refundTransaction])
                    .select()

                  if (txError) {
                    console.error("Refund transaction database error:", {
                      error: txError,
                      orderId,
                      transaction: refundTransaction
                    })
                  } else {
                    console.log("Refund transaction created successfully:", txData)
                  }
                } catch (error) {
                  // Log error but don't affect order status
                  console.error("Background refund creation failed:", {
                    error: error instanceof Error ? error.message : String(error),
                    orderId,
                    agentId: orderToUpdate.agent_id
                  })
                }
              }, 100) // Small delay to ensure order update completes first
            }

            return data
          } catch (operationError) {
            // Re-throw with better context
            if (operationError instanceof Error) {
              throw operationError
            } else {
              const wrappedError = new Error(`Database operation failed: ${String(operationError)}`)
              wrappedError.name = "OperationError"
              throw wrappedError
            }
          }
        },
        {
          maxRetries: 2,
          retryDelay: 600,
          onError: (err) => {
            // CRITICAL FIX: Enhanced rollback and error handling
            console.error("Order status update failed, rolling back:", {
              orderId,
              status: normalizedStatus,
              error: err?.message || String(err),
              errorName: err?.name || "Unknown",
            })

            setDataOrders(previous)
            if (setCachedData) setCachedData(previous)

            // CRITICAL FIX: Better user-friendly error messages with specific actions
            let userMessage = "Failed to update order status. Please try again."

            if (err?.message) {
              const errorMsg = err.message.toLowerCase()
              if (errorMsg.includes("network") || errorMsg.includes("timeout") || errorMsg.includes("connection")) {
                userMessage =
                  "Network issue while updating status. Your changes were rolled back. Please check your connection and try again."
              } else if (
                errorMsg.includes("permission") ||
                errorMsg.includes("unauthorized") ||
                errorMsg.includes("access denied")
              ) {
                userMessage = "You do not have permission to update this order. Please contact an administrator."
              } else if (
                errorMsg.includes("not found") ||
                errorMsg.includes("deleted") ||
                errorMsg.includes("pgrst116")
              ) {
                userMessage = "This order no longer exists. The page will be refreshed automatically."
                // Trigger a page refresh after a delay
                setTimeout(() => {
                  if (typeof window !== "undefined") {
                    window.location.reload()
                  }
                }, 2000)
              } else if (
                errorMsg.includes("validation") ||
                errorMsg.includes("constraint") ||
                errorMsg.includes("check")
              ) {
                userMessage = `Order validation failed: ${err.message}. Please refresh the page and try again.`
              } else {
                userMessage = `Update failed: ${err.message}`
              }
            }

            // CRITICAL FIX: Better user notification system
            if (typeof window !== "undefined") {
              // Try to use a toast notification if available, otherwise use console
              if (window.dispatchEvent) {
                try {
                  // Dispatch a custom event for toast notifications
                  window.dispatchEvent(
                    new CustomEvent("show-error-toast", {
                      detail: { message: userMessage },
                    }),
                  )
                } catch (eventError) {
                  console.error("Failed to dispatch error event:", eventError)
                  console.error("Update failed:", userMessage)
                }
              } else {
                console.error("Update failed:", userMessage)
              }
            }
          },
        },
      )
    },
    [execute],
  )

  return { updateOrderStatus, isUpdating }
}

// Optional alias if other modules import this name
export const useOptimisticOrderUpdate = useOptimisticUpdates
