/**
 * Wallet Reversal Utilities
 * Provides functions for reversing transactions and managing wallet corrections
 */

export interface WalletTransaction {
  id: string
  agentId: string
  amount: number
  type: "debit" | "credit"
  status: "completed" | "reversed" | "pending"
  description: string
  createdAt: Date
  reversedAt?: Date
  reversalReason?: string
}

export interface ReversalRequest {
  transactionId: string
  reason: string
  adminId: string
  notes?: string
}

export interface ReversalResult {
  success: boolean
  message: string
  reversalId?: string
  previousBalance?: number
  newBalance?: number
}

/**
 * Check if a transaction can be reversed
 */
export function canReverseTransaction(transaction: WalletTransaction): boolean {
  // Cannot reverse already reversed transactions
  if (transaction.status === "reversed") {
    return false
  }

  // Cannot reverse pending transactions
  if (transaction.status === "pending") {
    return false
  }

  // Can only reverse completed transactions
  return transaction.status === "completed"
}

/**
 * Calculate reversal impact on wallet balance
 */
export function calculateReversalImpact(
  transaction: WalletTransaction,
  currentBalance: number
): {
  canReverse: boolean
  newBalance: number
  impact: number
  message: string
} {
  if (!canReverseTransaction(transaction)) {
    return {
      canReverse: false,
      newBalance: currentBalance,
      impact: 0,
      message: "This transaction cannot be reversed"
    }
  }

  const reversalAmount = transaction.type === "debit" ? transaction.amount : -transaction.amount
  const newBalance = currentBalance + reversalAmount

  return {
    canReverse: true,
    newBalance,
    impact: reversalAmount,
    message: `Reversal will adjust balance from GH₵${currentBalance.toFixed(2)} to GH₵${newBalance.toFixed(2)}`
  }
}

/**
 * Validate reversal request
 */
export function validateReversalRequest(
  request: ReversalRequest,
  transaction: WalletTransaction
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!request.transactionId || request.transactionId !== transaction.id) {
    errors.push("Transaction ID mismatch")
  }

  if (!request.reason || request.reason.trim().length === 0) {
    errors.push("Reversal reason is required")
  }

  if (!request.adminId || request.adminId.trim().length === 0) {
    errors.push("Admin ID is required")
  }

  if (!canReverseTransaction(transaction)) {
    errors.push("Transaction cannot be reversed")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get transaction history with reversals
 */
export function getTransactionHistoryWithReversals(
  transactions: WalletTransaction[]
): {
  original: WalletTransaction[]
  reversals: WalletTransaction[]
  netAmount: number
} {
  const original = transactions.filter(t => t.status !== "reversed")
  const reversals = transactions.filter(t => t.status === "reversed")

  const netAmount = original.reduce((sum, t) => {
    return t.type === "credit" ? sum + t.amount : sum - t.amount
  }, 0)

  return {
    original,
    reversals,
    netAmount
  }
}

/**
 * Audit reversal activity
 */
export interface ReversalAudit {
  transactionId: string
  originalAmount: number
  reversalAmount: number
  reversalReason: string
  reversedBy: string
  reversedAt: Date
  adminNotes?: string
}

export function createReversalAudit(
  transaction: WalletTransaction,
  request: ReversalRequest
): ReversalAudit {
  return {
    transactionId: transaction.id,
    originalAmount: transaction.amount,
    reversalAmount: transaction.type === "debit" ? transaction.amount : -transaction.amount,
    reversalReason: request.reason,
    reversedBy: request.adminId,
    reversedAt: new Date(),
    adminNotes: request.notes
  }
}
