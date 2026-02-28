/**
 * Wallet Transaction Types and Validation
 *
 * This file defines the valid transaction types for wallet transactions
 * and provides validation functions to ensure data integrity.
 */

// Valid transaction types that match the database enum
export const VALID_TRANSACTION_TYPES = [
  "topup",
  "deduction",
  "refund",
  "commission", // FIXED: Changed from "commission_deposit" to "commission"
  "commission_deposit", // ADDED: Keep for backward compatibility
  "withdrawal_deduction",
  "admin_reversal",
  "admin_adjustment",
] as const

export type ValidTransactionType = (typeof VALID_TRANSACTION_TYPES)[number]

// Valid transaction statuses
export const VALID_TRANSACTION_STATUSES = ["pending", "approved", "rejected"] as const

export type ValidTransactionStatus = (typeof VALID_TRANSACTION_STATUSES)[number]

// Valid payment methods
export const VALID_PAYMENT_METHODS = ["manual", "auto"] as const

export type ValidPaymentMethod = (typeof VALID_PAYMENT_METHODS)[number]

/**
 * Validates if a transaction type is valid
 */
export function isValidTransactionType(type: string): type is ValidTransactionType {
  return VALID_TRANSACTION_TYPES.includes(type as ValidTransactionType)
}

/**
 * Validates if a transaction status is valid
 */
export function isValidTransactionStatus(status: string): status is ValidTransactionStatus {
  return VALID_TRANSACTION_STATUSES.includes(status as ValidTransactionStatus)
}

/**
 * Validates if a payment method is valid
 */
export function isValidPaymentMethod(method: string): method is ValidPaymentMethod {
  return VALID_PAYMENT_METHODS.includes(method as ValidPaymentMethod)
}

/**
 * Validates a complete wallet transaction object before database insertion
 */
export interface WalletTransactionInput {
  agent_id: string
  transaction_type: string
  amount: number
  reference_code?: string
  description: string
  status: string
  payment_method?: string
  admin_notes?: string
  admin_id?: string
}

export function validateWalletTransaction(transaction: WalletTransactionInput): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate transaction type
  if (!isValidTransactionType(transaction.transaction_type)) {
    errors.push(
      `Invalid transaction_type: "${transaction.transaction_type}". Valid types are: ${VALID_TRANSACTION_TYPES.join(", ")}`,
    )
  }

  // Validate status
  if (!isValidTransactionStatus(transaction.status)) {
    errors.push(`Invalid status: "${transaction.status}". Valid statuses are: ${VALID_TRANSACTION_STATUSES.join(", ")}`)
  }

  // Validate payment method if provided
  if (transaction.payment_method && !isValidPaymentMethod(transaction.payment_method)) {
    errors.push(
      `Invalid payment_method: "${transaction.payment_method}". Valid methods are: ${VALID_PAYMENT_METHODS.join(", ")}`,
    )
  }

  // Validate required fields
  if (!transaction.agent_id?.trim()) {
    errors.push("agent_id is required")
  }

  if (!transaction.description?.trim()) {
    errors.push("description is required")
  }

  if (typeof transaction.amount !== "number" || transaction.amount <= 0) {
    errors.push("amount must be a positive number")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * FIXED: Creates a safe wallet transaction object with validated fields
 * Now properly handles reference_code and includes all necessary fields
 */
export function createSafeWalletTransaction(input: WalletTransactionInput): WalletTransactionInput {
  const validation = validateWalletTransaction(input)

  if (!validation.isValid) {
    throw new Error(`Invalid wallet transaction: ${validation.errors.join(", ")}`)
  }

  // Build result with all fields, let database handle reference_code generation if not provided
  const result: WalletTransactionInput = {
    agent_id: input.agent_id.trim(),
    transaction_type: input.transaction_type, // Keep the exact transaction_type from input
    amount: Number(input.amount),
    description: input.description.trim(),
    status: input.status as ValidTransactionStatus,
    admin_notes: input.admin_notes?.trim(),
    admin_id: input.admin_id?.trim(),
  }

  if (input.reference_code?.trim()) {
    result.reference_code = input.reference_code.trim()
  }

  if (input.payment_method?.trim()) {
    result.payment_method = input.payment_method.trim() as ValidPaymentMethod
  }

  return result
}

/**
 * ADDED: Helper function to generate a reference code if needed
 */
export function generateReferenceCode(transactionType: string, agentId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const agentPrefix = agentId.substring(0, 8).toUpperCase()
  const typePrefix = transactionType.substring(0, 4).toUpperCase()
  return `${typePrefix}-${agentPrefix}-${timestamp}`
}

/**
 * Generate a safe reference code for transactions
 * This is an alias for generateReferenceCode with additional safety checks
 * Modified to generate 5-digit numeric codes for easy memorization and reduced errors
 */
export function generateSafeReferenceCode(transactionType: string, agentId?: string): string {
  try {
    const chars = "0123456789"
    let code = ""
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  } catch (error) {
    console.error("Error generating safe reference code:", error)
    return Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")
  }
}

/**
 * ADDED: Enhanced transaction creation with automatic reference code generation
 */
export function createSafeWalletTransactionWithRef(input: WalletTransactionInput): WalletTransactionInput {
  const transaction = createSafeWalletTransaction(input)

  // Generate reference code if not provided
  if (!transaction.reference_code) {
    transaction.reference_code = generateReferenceCode(transaction.transaction_type, transaction.agent_id)
  }

  return transaction
}

/**
 * ADDED: Commission calculation utilities with proper rounding and validation
 */

// Minimum commission threshold - skip transactions below this amount
export const MINIMUM_COMMISSION_THRESHOLD = 0.01

/**
 * Calculate commission amount with proper rounding to avoid floating-point precision errors
 */
export function calculateCommission(bundlePrice: number, commissionRate: number): number {
  const { getCalculatedCommission } = require("./commission-calculation")

  // Validate inputs
  if (typeof bundlePrice !== "number" || bundlePrice <= 0) {
    throw new Error(`Invalid bundle price: ${bundlePrice}. Must be a positive number.`)
  }

  if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
    throw new Error(`Invalid commission rate: ${commissionRate}. Must be between 0 and 100.`)
  }

  // Convert percentage to decimal if rate > 1
  const rate = commissionRate > 1 ? commissionRate / 100 : commissionRate
  return getCalculatedCommission(bundlePrice, rate)
}

/**
 * Check if commission amount meets minimum threshold
 */
export function isCommissionAboveThreshold(amount: number): boolean {
  return amount >= MINIMUM_COMMISSION_THRESHOLD
}

/**
 * Create commission transaction with validation and proper error handling
 */
export function createCommissionTransaction(
  orderId: string,
  agentId: string,
  bundlePrice: number,
  commissionRate = 10, // Default 10% commission rate
): { success: boolean; transaction?: WalletTransactionInput; skipped?: boolean; error?: string } {
  try {
    // Calculate commission with proper rounding
    const commissionAmount = calculateCommission(bundlePrice, commissionRate)

    // Check minimum threshold
    if (!isCommissionAboveThreshold(commissionAmount)) {
      console.log(`Skipping commission transaction for order ${orderId} - amount too small: $${commissionAmount}`)
      return { success: true, skipped: true }
    }

    // Create transaction input
    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "commission", // Use correct transaction type
      amount: commissionAmount,
      description: `Order completion commission - Order #${orderId}`,
      status: "approved",
      admin_notes: `Auto-generated commission for completed order ${orderId}. Rate: ${commissionRate}%, Bundle: $${bundlePrice}`,
    }

    // Create safe transaction with reference code
    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating commission transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Create refund transaction with validation
 */
export function createRefundTransaction(
  orderId: string,
  agentId: string,
  refundAmount: number,
): { success: boolean; transaction?: WalletTransactionInput; error?: string } {
  try {
    // Validate refund amount
    if (typeof refundAmount !== "number" || refundAmount <= 0) {
      throw new Error(`Invalid refund amount: ${refundAmount}. Must be a positive number.`)
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(refundAmount * 100) / 100

    // Create transaction input
    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "refund",
      amount: roundedAmount,
      description: `Order cancellation refund - Order #${orderId}`,
      status: "approved",
      admin_notes: `Auto-generated refund for cancelled order ${orderId}`,
    }

    // Create safe transaction with reference code
    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating refund transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Create withdrawal deduction transaction with validation
 */
export function createWithdrawalTransaction(
  agentId: string,
  withdrawalAmount: number,
  withdrawalId: string,
  momoNumber: string,
): { success: boolean; transaction?: WalletTransactionInput; error?: string } {
  try {
    // Validate withdrawal amount
    if (typeof withdrawalAmount !== "number" || withdrawalAmount <= 0) {
      throw new Error(`Invalid withdrawal amount: ${withdrawalAmount}. Must be a positive number.`)
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(withdrawalAmount * 100) / 100

    // Create transaction input
    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "withdrawal_deduction",
      amount: roundedAmount,
      description: `Withdrawal deduction - Request #${withdrawalId}`,
      status: "approved", // Immediately approve the deduction
      payment_method: "manual", // Ensure payment_method is set
      admin_notes: `Withdrawal to mobile money: ${momoNumber}. Withdrawal ID: ${withdrawalId}`,
    }

    // Create safe transaction with reference code
    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating withdrawal transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Create reversal transaction with validation
 */
export function createReversalTransaction(
  agentId: string,
  originalTransactionId: string,
  reversalAmount: number,
  adminId: string,
  originalDescription?: string,
): { success: boolean; transaction?: WalletTransactionInput; error?: string } {
  try {
    // Validate reversal amount
    if (typeof reversalAmount !== "number" || reversalAmount <= 0) {
      throw new Error(`Invalid reversal amount: ${reversalAmount}. Must be a positive number.`)
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(reversalAmount * 100) / 100

    // Create transaction input with all required fields
    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "admin_reversal", // Explicitly set to valid enum value
      amount: roundedAmount,
      description: `Reversal of transaction ${originalTransactionId}${originalDescription ? ` - Original: ${originalDescription}` : ""}`,
      status: "approved", // Immediately approve the reversal
      payment_method: "manual", // Ensure payment_method is set
      admin_notes: `Reversal processed by admin ${adminId}. Original transaction: ${originalTransactionId}`,
      admin_id: adminId,
    }

    console.log("[v0] Creating reversal transaction with input:", JSON.stringify(transactionInput, null, 2))

    // Create safe transaction with reference code
    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    console.log("[v0] Safe reversal transaction created:", JSON.stringify(transaction, null, 2))

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating reversal transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Calculate the correct wallet balance by summing all approved transactions
 */
export async function calculateCorrectWalletBalance(agentId: string): Promise<{ balance: number; error?: string }> {
  try {
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import("@/lib/supabase")

    // Get all approved transactions for this agent
    const { data: transactions, error } = await supabase
      .from("wallet_transactions")
      .select("transaction_type, amount")
      .eq("agent_id", agentId)
      .eq("status", "approved")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching wallet transactions:", error)
      return { balance: 0, error: error.message }
    }

    if (!transactions || transactions.length === 0) {
      return { balance: 0 }
    }

    // Calculate balance based on transaction types
    let balance = 0

    for (const transaction of transactions) {
      const amount = Number(transaction.amount) || 0

      switch (transaction.transaction_type) {
        case "topup":
        case "refund":
        case "commission":
        case "commission_deposit":
        case "admin_reversal":
          // Add to balance
          balance += amount
          break
        case "deduction":
        case "withdrawal_deduction":
        case "admin_adjustment":
          // Subtract from balance
          balance -= amount
          break
        default:
          console.warn(`Unknown transaction type: ${transaction.transaction_type}`)
          break
      }
    }

    // Round to 2 decimal places to avoid floating-point precision issues
    balance = Math.round(balance * 100) / 100

    return { balance }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error calculating wallet balance:", errorMessage)
    return { balance: 0, error: errorMessage }
  }
}
