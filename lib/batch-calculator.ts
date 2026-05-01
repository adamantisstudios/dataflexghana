/**
 * Batch Calculator
 * Provides utilities for batch operations and calculations
 */

export interface BatchItem {
  id: string
  amount: number
  status: "pending" | "completed" | "failed"
  createdAt: Date
}

export interface BatchSummary {
  totalItems: number
  completedItems: number
  failedItems: number
  pendingItems: number
  totalAmount: number
  completedAmount: number
}

/**
 * Calculate batch summary statistics
 */
export function calculateBatchSummary(items: BatchItem[]): BatchSummary {
  const summary: BatchSummary = {
    totalItems: items.length,
    completedItems: 0,
    failedItems: 0,
    pendingItems: 0,
    totalAmount: 0,
    completedAmount: 0
  }

  items.forEach(item => {
    summary.totalAmount += item.amount

    switch (item.status) {
      case "completed":
        summary.completedItems++
        summary.completedAmount += item.amount
        break
      case "failed":
        summary.failedItems++
        break
      case "pending":
        summary.pendingItems++
        break
    }
  })

  return summary
}

/**
 * Calculate success rate for a batch
 */
export function calculateBatchSuccessRate(items: BatchItem[]): number {
  if (items.length === 0) return 0

  const completed = items.filter(i => i.status === "completed").length
  return Math.round((completed / items.length) * 100)
}

/**
 * Get batch statistics for display
 */
export function getBatchStatistics(items: BatchItem[]): {
  successRate: number
  averageAmount: number
  totalAmount: number
  successAmount: number
} {
  const summary = calculateBatchSummary(items)
  const successRate = calculateBatchSuccessRate(items)
  
  return {
    successRate,
    averageAmount: items.length > 0 ? summary.totalAmount / items.length : 0,
    totalAmount: summary.totalAmount,
    successAmount: summary.completedAmount
  }
}

/**
 * Process batch items in chunks
 */
export async function processBatchInChunks<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  chunkSize: number = 10
): Promise<{ successful: number; failed: number }> {
  let successful = 0
  let failed = 0

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)

    const results = await Promise.allSettled(
      chunk.map(item => processor(item))
    )

    results.forEach(result => {
      if (result.status === "fulfilled") {
        successful++
      } else {
        failed++
      }
    })
  }

  return { successful, failed }
}
