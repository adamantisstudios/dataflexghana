import { supabase } from "./supabase";
/**
 * Wallet Transaction Types and Validation
 *
 * Types must match the database CHECK constraint wallet_transactions_type_check.
 */

/** Allowed values in PostgreSQL wallet_transactions.type / transaction_type */
export const DB_TRANSACTION_TYPES = [
  "credit",
  "debit",
  "refund",
  "adjustment",
  "deduction",
  "topup",
  "withdrawal",
  "deposit",
  "penalty",
  "interest",
  "commission_deposit",
  "withdrawal_deduction",
  "payment_completed",
] as const

export type DbTransactionType = (typeof DB_TRANSACTION_TYPES)[number]

/** Legacy types still present in historical rows */
export const LEGACY_TRANSACTION_TYPES = ["admin_adjustment", "admin_reversal", "commission"] as const

export const VALID_TRANSACTION_TYPES = [...DB_TRANSACTION_TYPES, ...LEGACY_TRANSACTION_TYPES] as const

export type ValidTransactionType = (typeof VALID_TRANSACTION_TYPES)[number]

/** Types that increase spendable wallet balance */
export const WALLET_CREDIT_TYPES = [
  "topup",
  "refund",
  "adjustment",
  "credit",
  "deposit",
  "interest",
  "payment_completed",
  "admin_adjustment",
] as const

/** Types that decrease spendable wallet balance */
export const WALLET_DEBIT_TYPES = [
  "deduction",
  "withdrawal_deduction",
  "debit",
  "withdrawal",
  "penalty",
  "admin_reversal",
] as const

export function isWalletCreditType(type: string): boolean {
  return (WALLET_CREDIT_TYPES as readonly string[]).includes(type)
}

export function isWalletDebitType(type: string): boolean {
  return (WALLET_DEBIT_TYPES as readonly string[]).includes(type)
}

// Valid transaction statuses
export const VALID_TRANSACTION_STATUSES = ["pending", "approved", "rejected"] as const

export type ValidTransactionStatus = (typeof VALID_TRANSACTION_STATUSES)[number]

// Valid payment methods
export const VALID_PAYMENT_METHODS = ["manual", "auto"] as const

export type ValidPaymentMethod = (typeof VALID_PAYMENT_METHODS)[number]

/**
 * Validates if a transaction type is valid for new inserts (DB constraint only).
 */
export function isValidDbTransactionType(type: string): type is DbTransactionType {
  const normalized = type.trim().toLowerCase()
  return (DB_TRANSACTION_TYPES as readonly string[]).includes(normalized)
}

/** Throws if not a DB-allowed type; returns normalized lowercase value. */
export function assertDbTransactionType(type: string): DbTransactionType {
  const normalized = type.trim().toLowerCase()
  if (!isValidDbTransactionType(normalized)) {
    throw new Error(
      `Invalid wallet transaction type "${type}". Allowed: ${DB_TRANSACTION_TYPES.join(", ")}`,
    )
  }
  return normalized
}

/** Admin wallet credit (e.g. approval bonus, referral credit). */
export const ADMIN_WALLET_CREDIT_TYPE = "adjustment" as const satisfies DbTransactionType

/** Admin wallet debit (e.g. commission reset, manual debit). */
export const ADMIN_WALLET_DEBIT_TYPE = "debit" as const satisfies DbTransactionType

export function adminAdjustmentTransactionType(isCredit: boolean): DbTransactionType {
  return isCredit ? ADMIN_WALLET_CREDIT_TYPE : ADMIN_WALLET_DEBIT_TYPE
}

/**
 * Validates if a transaction type is valid (includes legacy values for reads/UI).
 */
export function isValidTransactionType(type: string): type is ValidTransactionType {
  return (VALID_TRANSACTION_TYPES as readonly string[]).includes(type)
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

  if (!isValidDbTransactionType(transaction.transaction_type)) {
    errors.push(
      `Invalid transaction_type: "${transaction.transaction_type}". Valid types are: ${DB_TRANSACTION_TYPES.join(", ")}`,
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
 * Creates a safe wallet transaction object with validated fields
 */
export function createSafeWalletTransaction(input: WalletTransactionInput): WalletTransactionInput {
  const validation = validateWalletTransaction(input)

  if (!validation.isValid) {
    throw new Error(`Invalid wallet transaction: ${validation.errors.join(", ")}`)
  }

  const txType = assertDbTransactionType(input.transaction_type)

  const result: WalletTransactionInput = {
    agent_id: input.agent_id.trim(),
    transaction_type: txType,
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
 * Build a row for wallet_transactions INSERT.
 * Sets both `type` and `transaction_type` (DB check is on `type`).
 * Omits source_type unless it is itself a valid transaction type (never use e.g. admin_action).
 */
export function buildWalletTransactionInsertRow(
  input: WalletTransactionInput,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  const safe = createSafeWalletTransaction(input)
  const txType = assertDbTransactionType(safe.transaction_type)

  const row: Record<string, unknown> = {
    agent_id: safe.agent_id,
    type: txType,
    transaction_type: txType,
    amount: safe.amount,
    description: safe.description,
    status: safe.status,
  }

  if (safe.reference_code) row.reference_code = safe.reference_code
  if (safe.payment_method) row.payment_method = safe.payment_method
  if (safe.admin_notes) row.admin_notes = safe.admin_notes
  if (safe.admin_id) row.admin_id = safe.admin_id

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (key === "source_type" && typeof value === "string" && !isValidDbTransactionType(value)) {
        continue
      }
      row[key] = value
    }
  }

  return row
}

export function generateReferenceCode(transactionType: string, agentId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const agentPrefix = agentId.substring(0, 8).toUpperCase()
  const typePrefix = transactionType.substring(0, 4).toUpperCase()
  return `${typePrefix}-${agentPrefix}-${timestamp}`
}

export function generateSafeReferenceCode(_transactionType?: string, _agentId?: string): string {
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

export function createSafeWalletTransactionWithRef(input: WalletTransactionInput): Record<string, unknown> {
  const transaction = createSafeWalletTransaction(input)

  if (!transaction.reference_code) {
    transaction.reference_code = generateReferenceCode(transaction.transaction_type, transaction.agent_id)
  }

  return buildWalletTransactionInsertRow(transaction)
}

export const MINIMUM_COMMISSION_THRESHOLD = 0.01

export function calculateCommission(bundlePrice: number, commissionRate: number): number {
  const { getCalculatedCommission } = require("./commission-calculation")

  if (typeof bundlePrice !== "number" || bundlePrice <= 0) {
    throw new Error(`Invalid bundle price: ${bundlePrice}. Must be a positive number.`)
  }

  if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
    throw new Error(`Invalid commission rate: ${commissionRate}. Must be between 0 and 100.`)
  }

  const rate = commissionRate > 1 ? commissionRate / 100 : commissionRate
  return getCalculatedCommission(bundlePrice, rate)
}

export function isCommissionAboveThreshold(amount: number): boolean {
  return amount >= MINIMUM_COMMISSION_THRESHOLD
}

export function createCommissionTransaction(
  orderId: string,
  agentId: string,
  bundlePrice: number,
  commissionRate = 10,
): { success: boolean; transaction?: WalletTransactionInput; skipped?: boolean; error?: string } {
  try {
    const commissionAmount = calculateCommission(bundlePrice, commissionRate)

    if (!isCommissionAboveThreshold(commissionAmount)) {
      console.log(`Skipping commission transaction for order ${orderId} - amount too small: $${commissionAmount}`)
      return { success: true, skipped: true }
    }

    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "commission_deposit",
      amount: commissionAmount,
      description: `Order completion commission - Order #${orderId}`,
      status: "approved",
      admin_notes: `Auto-generated commission for completed order ${orderId}. Rate: ${commissionRate}%, Bundle: $${bundlePrice}`,
    }

    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating commission transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export function createRefundTransaction(
  orderId: string,
  agentId: string,
  refundAmount: number,
): { success: boolean; transaction?: WalletTransactionInput; error?: string } {
  try {
    if (typeof refundAmount !== "number" || refundAmount <= 0) {
      throw new Error(`Invalid refund amount: ${refundAmount}. Must be a positive number.`)
    }

    const roundedAmount = Math.round(refundAmount * 100) / 100

    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "refund",
      amount: roundedAmount,
      description: `Order cancellation refund - Order #${orderId}`,
      status: "approved",
      admin_notes: `Auto-generated refund for cancelled order ${orderId}`,
    }

    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating refund transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export function createWithdrawalTransaction(
  agentId: string,
  withdrawalAmount: number,
  withdrawalId: string,
  momoNumber: string,
): { success: boolean; transaction?: WalletTransactionInput; error?: string } {
  try {
    if (typeof withdrawalAmount !== "number" || withdrawalAmount <= 0) {
      throw new Error(`Invalid withdrawal amount: ${withdrawalAmount}. Must be a positive number.`)
    }

    const roundedAmount = Math.round(withdrawalAmount * 100) / 100

    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "withdrawal_deduction",
      amount: roundedAmount,
      description: `Withdrawal deduction - Request #${withdrawalId}`,
      status: "approved",
      payment_method: "manual",
      admin_notes: `Withdrawal to mobile money: ${momoNumber}. Withdrawal ID: ${withdrawalId}`,
    }

    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating withdrawal transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export function createReversalTransaction(
  agentId: string,
  originalTransactionId: string,
  reversalAmount: number,
  adminId: string,
  originalDescription?: string,
): { success: boolean; transaction?: WalletTransactionInput; error?: string } {
  try {
    if (typeof reversalAmount !== "number" || reversalAmount <= 0) {
      throw new Error(`Invalid reversal amount: ${reversalAmount}. Must be a positive number.`)
    }

    const roundedAmount = Math.round(reversalAmount * 100) / 100

    const transactionInput: WalletTransactionInput = {
      agent_id: agentId,
      transaction_type: "debit",
      amount: roundedAmount,
      description: `Reversal of transaction ${originalTransactionId}${originalDescription ? ` - Original: ${originalDescription}` : ""}`,
      status: "approved",
      payment_method: "manual",
      admin_notes: `Reversal processed by admin ${adminId}. Original transaction: ${originalTransactionId}`,
      admin_id: adminId,
    }

    const transaction = createSafeWalletTransactionWithRef(transactionInput)

    return { success: true, transaction }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error creating reversal transaction:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Calculate spendable wallet balance from approved transactions
 */
export async function calculateCorrectWalletBalance(agentId: string): Promise<{ balance: number; error?: string }> {
  try {
    const { supabase } = await import("@/lib/supabase")

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

    let balance = 0

    for (const transaction of transactions) {
      const amount = Number(transaction.amount) || 0
      const type = transaction.transaction_type

      if (type === "commission_deposit" || type === "commission") {
        continue
      }
      if (isWalletCreditType(type)) {
        balance += amount
      } else if (isWalletDebitType(type)) {
        balance -= amount
      } else {
        console.warn(`Unknown transaction type: ${type}`)
      }
    }

    balance = Math.round(balance * 100) / 100

    return { balance }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error calculating wallet balance:", errorMessage)
    return { balance: 0, error: errorMessage }
  }
}
