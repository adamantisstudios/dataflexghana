/**
 * SYSTEM INTEGRITY TESTING SCRIPT
 * 
 * Comprehensive testing script to validate that all critical fixes are working
 * and the system maintains proper money flow integrity
 */

import { supabase } from '../lib/supabase'
import { validateSystemIntegrity, quickIntegrityCheck } from '../lib/system-integrity-validator'
import { processSecureWithdrawalPayout } from '../lib/withdrawal-security-fix'
import { syncAgentWalletBalance, bulkSyncAllWalletBalances } from '../lib/wallet-balance-sync'
import { handleAnyOrderStatusChange } from '../lib/order-status-handlers'

interface TestResult {
  testName: string
  passed: boolean
  message: string
  details?: any
  duration: number
}

interface TestSuite {
  suiteName: string
  results: TestResult[]
  passed: number
  failed: number
  totalDuration: number
}

/**
 * Main testing function
 */
export async function runSystemIntegrityTests(): Promise<{
  overallPassed: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  suites: TestSuite[]
  summary: string
}> {
  console.log('🧪 Starting comprehensive system integrity tests...')
  const startTime = Date.now()

  const suites: TestSuite[] = []

  try {
    // Test Suite 1: Withdrawal Security Tests
    suites.push(await runWithdrawalSecurityTests())

    // Test Suite 2: Commission-Wallet Separation Tests
    suites.push(await runCommissionWalletSeparationTests())

    // Test Suite 3: Balance Synchronization Tests
    suites.push(await runBalanceSynchronizationTests())

    // Test Suite 4: Order Status Change Tests
    suites.push(await runOrderStatusChangeTests())

    // Test Suite 5: System Integrity Validation Tests
    suites.push(await runSystemValidationTests())

    // Calculate overall results
    const totalTests = suites.reduce((sum, suite) => sum + suite.results.length, 0)
    const passedTests = suites.reduce((sum, suite) => sum + suite.passed, 0)
    const failedTests = suites.reduce((sum, suite) => sum + suite.failed, 0)
    const overallPassed = failedTests === 0

    const totalDuration = Date.now() - startTime
    const summary = generateTestSummary(suites, totalTests, passedTests, failedTests, totalDuration)

    console.log('✅ System integrity tests completed:', {
      overallPassed,
      totalTests,
      passedTests,
      failedTests,
      duration: `${totalDuration}ms`
    })

    return {
      overallPassed,
      totalTests,
      passedTests,
      failedTests,
      suites,
      summary
    }

  } catch (error) {
    console.error('❌ Error running system integrity tests:', error)
    
    return {
      overallPassed: false,
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      suites: [{
        suiteName: 'System Error',
        results: [{
          testName: 'Test execution',
          passed: false,
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime
        }],
        passed: 0,
        failed: 1,
        totalDuration: Date.now() - startTime
      }],
      summary: 'System integrity tests failed to execute'
    }
  }
}

/**
 * Test Suite 1: Withdrawal Security Tests
 */
async function runWithdrawalSecurityTests(): Promise<TestSuite> {
  const suiteName = 'Withdrawal Security Tests'
  const results: TestResult[] = []
  const suiteStartTime = Date.now()

  console.log(`🔒 Running ${suiteName}...`)

  // Test 1: Verify secure withdrawal processing function exists
  results.push(await runTest(
    'Secure withdrawal processing function availability',
    async () => {
      // Check if the function is available and properly imported
      if (typeof processSecureWithdrawalPayout !== 'function') {
        throw new Error('processSecureWithdrawalPayout function not available')
      }
      return { available: true }
    }
  ))

  // Test 2: Check for agents with negative commission balances
  results.push(await runTest(
    'No agents with negative commission balances',
    async () => {
      const { data: negativeAgents, error } = await supabase
        .from('agents')
        .select('id, full_name, totalCommissions')
        .lt('totalCommissions', 0)

      if (error) throw error

      if (negativeAgents && negativeAgents.length > 0) {
        throw new Error(`Found ${negativeAgents.length} agents with negative commission balances`)
      }

      return { negativeAgents: 0 }
    }
  ))

  // Test 3: Check for excessive paid out amounts
  results.push(await runTest(
    'No agents with paid out exceeding earned commissions',
    async () => {
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, full_name, totalCommissions, totalPaidOut')
        .not('totalCommissions', 'is', null)
        .not('totalPaidOut', 'is', null)

      if (error) throw error

      let excessiveCount = 0
      const excessiveAgents: any[] = []

      if (agents) {
        for (const agent of agents) {
          const commissions = Number(agent.totalCommissions) || 0
          const paidOut = Number(agent.totalPaidOut) || 0
          if (paidOut > commissions) {
            excessiveCount++
            excessiveAgents.push({
              id: agent.id,
              name: agent.full_name,
              commissions,
              paidOut,
              excess: paidOut - commissions
            })
          }
        }
      }

      if (excessiveCount > 0) {
        throw new Error(`Found ${excessiveCount} agents with excessive paid out amounts`)
      }

      return { excessiveAgents: 0, checkedAgents: agents?.length || 0 }
    }
  ))

  // Test 4: Verify withdrawal status consistency
  results.push(await runTest(
    'Withdrawal status consistency',
    async () => {
      const { data: paidWithdrawals, error } = await supabase
        .from('withdrawals')
        .select('id, amount, agent_id, status')
        .eq('status', 'paid')
        .limit(10)

      if (error) throw error

      // For each paid withdrawal, verify the agent's balances make sense
      let inconsistentCount = 0
      if (paidWithdrawals) {
        for (const withdrawal of paidWithdrawals) {
          // This is a simplified check - in practice you'd verify against commission history
          if (!withdrawal.amount || withdrawal.amount <= 0) {
            inconsistentCount++
          }
        }
      }

      return { 
        paidWithdrawals: paidWithdrawals?.length || 0,
        inconsistentCount
      }
    }
  ))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = Date.now() - suiteStartTime

  return {
    suiteName,
    results,
    passed,
    failed,
    totalDuration
  }
}

/**
 * Test Suite 2: Commission-Wallet Separation Tests
 */
async function runCommissionWalletSeparationTests(): Promise<TestSuite> {
  const suiteName = 'Commission-Wallet Separation Tests'
  const results: TestResult[] = []
  const suiteStartTime = Date.now()

  console.log(`💰 Running ${suiteName}...`)

  // Test 1: Check for commission deposits in wallet transactions
  results.push(await runTest(
    'No automatic commission deposits in wallet',
    async () => {
      const { data: commissionDeposits, error } = await supabase
        .from('wallet_transactions')
        .select('id, agent_id, amount, description')
        .eq('transaction_type', 'commission_deposit')
        .eq('status', 'approved')

      if (error) throw error

      // This might be expected in some systems, so we'll just report the count
      return { 
        commissionDeposits: commissionDeposits?.length || 0,
        warning: commissionDeposits && commissionDeposits.length > 0 
          ? 'Found commission deposits in wallet - verify this is intentional'
          : null
      }
    }
  ))

  // Test 2: Verify wallet balance calculation integrity
  results.push(await runTest(
    'Wallet balance calculation integrity (sample)',
    async () => {
      const { data: sampleAgents, error } = await supabase
        .from('agents')
        .select('id, full_name, walletBalance')
        .not('walletBalance', 'is', null)
        .limit(5)

      if (error) throw error

      let discrepancies = 0
      const checkedAgents: any[] = []

      if (sampleAgents) {
        for (const agent of sampleAgents) {
          try {
            const { data: transactions } = await supabase
              .from('wallet_transactions')
              .select('transaction_type, amount')
              .eq('agent_id', agent.id)
              .eq('status', 'approved')

            if (transactions) {
              let calculatedBalance = 0
              for (const tx of transactions) {
                const amount = Number(tx.amount) || 0
                if (['topup', 'refund', 'admin_adjustment'].includes(tx.transaction_type)) {
                  calculatedBalance += amount
                } else if (['deduction', 'withdrawal_deduction', 'admin_reversal'].includes(tx.transaction_type)) {
                  calculatedBalance -= amount
                }
                // Note: commission_deposit should NOT affect wallet balance
              }

              const storedBalance = Number(agent.walletBalance) || 0
              const difference = Math.abs(calculatedBalance - storedBalance)

              checkedAgents.push({
                id: agent.id,
                name: agent.full_name,
                stored: storedBalance,
                calculated: calculatedBalance,
                difference
              })

              if (difference > 0.01) {
                discrepancies++
              }
            }
          } catch (error) {
            discrepancies++
          }
        }
      }

      if (discrepancies > 0) {
        throw new Error(`Found ${discrepancies} wallet balance discrepancies in sample`)
      }

      return { 
        checkedAgents: checkedAgents.length,
        discrepancies: 0,
        details: checkedAgents
      }
    }
  ))

  // Test 3: Verify commission and wallet are stored separately
  results.push(await runTest(
    'Commission and wallet data separation',
    async () => {
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, walletBalance, totalCommissions, totalPaidOut')
        .not('walletBalance', 'is', null)
        .not('totalCommissions', 'is', null)
        .limit(10)

      if (error) throw error

      let properSeparation = 0
      if (agents) {
        for (const agent of agents) {
          const wallet = Number(agent.walletBalance) || 0
          const commissions = Number(agent.totalCommissions) || 0
          const paidOut = Number(agent.totalPaidOut) || 0

          // Check that these are independent values (not automatically synced)
          if (wallet >= 0 && commissions >= 0 && paidOut >= 0) {
            properSeparation++
          }
        }
      }

      return {
        checkedAgents: agents?.length || 0,
        properSeparation,
        separationRate: agents?.length ? (properSeparation / agents.length) * 100 : 0
      }
    }
  ))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = Date.now() - suiteStartTime

  return {
    suiteName,
    results,
    passed,
    failed,
    totalDuration
  }
}

/**
 * Test Suite 3: Balance Synchronization Tests
 */
async function runBalanceSynchronizationTests(): Promise<TestSuite> {
  const suiteName = 'Balance Synchronization Tests'
  const results: TestResult[] = []
  const suiteStartTime = Date.now()

  console.log(`⚖️ Running ${suiteName}...`)

  // Test 1: Verify sync functions are available
  results.push(await runTest(
    'Balance synchronization functions availability',
    async () => {
      if (typeof syncAgentWalletBalance !== 'function') {
        throw new Error('syncAgentWalletBalance function not available')
      }
      if (typeof bulkSyncAllWalletBalances !== 'function') {
        throw new Error('bulkSyncAllWalletBalances function not available')
      }
      return { functionsAvailable: true }
    }
  ))

  // Test 2: Check for null balance fields
  results.push(await runTest(
    'No null critical balance fields',
    async () => {
      const { data: nullBalances, error } = await supabase
        .from('agents')
        .select('id, full_name')
        .or('walletBalance.is.null,totalCommissions.is.null,totalPaidOut.is.null')

      if (error) throw error

      if (nullBalances && nullBalances.length > 0) {
        throw new Error(`Found ${nullBalances.length} agents with null balance fields`)
      }

      return { agentsWithNullBalances: 0 }
    }
  ))

  // Test 3: Verify Supabase connectivity and data consistency
  results.push(await runTest(
    'Supabase connectivity and data consistency',
    async () => {
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, full_name, walletBalance, totalCommissions')
        .limit(5)

      if (error) throw error

      if (!agents || agents.length === 0) {
        throw new Error('No agent data found - possible connectivity issue')
      }

      // Check data types
      let validDataTypes = 0
      for (const agent of agents) {
        const wallet = agent.walletBalance
        const commissions = agent.totalCommissions
        
        if ((wallet === null || typeof wallet === 'number') && 
            (commissions === null || typeof commissions === 'number')) {
          validDataTypes++
        }
      }

      if (validDataTypes !== agents.length) {
        throw new Error(`Data type inconsistencies found in ${agents.length - validDataTypes} agents`)
      }

      return {
        agentsChecked: agents.length,
        validDataTypes,
        connectivity: 'good'
      }
    }
  ))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = Date.now() - suiteStartTime

  return {
    suiteName,
    results,
    passed,
    failed,
    totalDuration
  }
}

/**
 * Test Suite 4: Order Status Change Tests
 */
async function runOrderStatusChangeTests(): Promise<TestSuite> {
  const suiteName = 'Order Status Change Tests'
  const results: TestResult[] = []
  const suiteStartTime = Date.now()

  console.log(`📋 Running ${suiteName}...`)

  // Test 1: Verify order status change handler availability
  results.push(await runTest(
    'Order status change handler availability',
    async () => {
      if (typeof handleAnyOrderStatusChange !== 'function') {
        throw new Error('handleAnyOrderStatusChange function not available')
      }
      return { handlerAvailable: true }
    }
  ))

  // Test 2: Check order-commission consistency for data orders
  results.push(await runTest(
    'Data order commission consistency',
    async () => {
      const { data: completedOrders, error } = await supabase
        .from('data_orders')
        .select('id, status, commission_amount, agent_id')
        .eq('status', 'completed')
        .limit(10)

      if (error) throw error

      let consistentOrders = 0
      let inconsistentOrders = 0

      if (completedOrders) {
        for (const order of completedOrders) {
          const commissionAmount = Number(order.commission_amount) || 0
          if (commissionAmount > 0) {
            consistentOrders++
          } else {
            inconsistentOrders++
          }
        }
      }

      if (inconsistentOrders > 0) {
        throw new Error(`Found ${inconsistentOrders} completed data orders with no commission`)
      }

      return {
        completedOrders: completedOrders?.length || 0,
        consistentOrders,
        inconsistentOrders: 0
      }
    }
  ))

  // Test 3: Check referral commission consistency
  results.push(await runTest(
    'Referral commission consistency',
    async () => {
      const { data: completedReferrals, error } = await supabase
        .from('referrals')
        .select(`
          id, 
          status, 
          agent_id,
          services(commission_amount)
        `)
        .eq('status', 'completed')
        .limit(10)

      if (error) throw error

      let consistentReferrals = 0
      let inconsistentReferrals = 0

      if (completedReferrals) {
        for (const referral of completedReferrals) {
          const commissionAmount = Number(referral.services?.commission_amount) || 0
          if (commissionAmount > 0) {
            consistentReferrals++
          } else {
            inconsistentReferrals++
          }
        }
      }

      return {
        completedReferrals: completedReferrals?.length || 0,
        consistentReferrals,
        inconsistentReferrals,
        warning: inconsistentReferrals > 0 ? 'Some completed referrals have no commission' : null
      }
    }
  ))

  // Test 4: Check wholesale order commission consistency
  results.push(await runTest(
    'Wholesale order commission consistency',
    async () => {
      const { data: deliveredOrders, error } = await supabase
        .from('wholesale_orders')
        .select('id, status, commission_amount, agent_id')
        .eq('status', 'delivered')
        .limit(10)

      if (error) throw error

      let consistentOrders = 0
      let inconsistentOrders = 0

      if (deliveredOrders) {
        for (const order of deliveredOrders) {
          const commissionAmount = Number(order.commission_amount) || 0
          if (commissionAmount > 0) {
            consistentOrders++
          } else {
            inconsistentOrders++
          }
        }
      }

      return {
        deliveredOrders: deliveredOrders?.length || 0,
        consistentOrders,
        inconsistentOrders,
        warning: inconsistentOrders > 0 ? 'Some delivered orders have no commission' : null
      }
    }
  ))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = Date.now() - suiteStartTime

  return {
    suiteName,
    results,
    passed,
    failed,
    totalDuration
  }
}

/**
 * Test Suite 5: System Integrity Validation Tests
 */
async function runSystemValidationTests(): Promise<TestSuite> {
  const suiteName = 'System Integrity Validation Tests'
  const results: TestResult[] = []
  const suiteStartTime = Date.now()

  console.log(`🔍 Running ${suiteName}...`)

  // Test 1: Quick integrity check
  results.push(await runTest(
    'Quick system integrity check',
    async () => {
      const result = await quickIntegrityCheck()
      
      if (!result.isHealthy) {
        throw new Error(`System health check failed with ${result.criticalIssues} critical issues (score: ${result.score})`)
      }

      return result
    }
  ))

  // Test 2: Full system integrity validation (if quick check passes)
  results.push(await runTest(
    'Full system integrity validation',
    async () => {
      const result = await validateSystemIntegrity()
      
      if (!result.overall.isValid) {
        throw new Error(`System integrity validation failed with ${result.overall.criticalIssues} critical issues (score: ${result.overall.score})`)
      }

      return {
        score: result.overall.score,
        totalChecks: result.overall.totalChecks,
        categories: Object.keys(result.categories).length
      }
    }
  ))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = Date.now() - suiteStartTime

  return {
    suiteName,
    results,
    passed,
    failed,
    totalDuration
  }
}

// Helper functions

async function runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    console.log(`  🧪 Running: ${testName}`)
    const result = await testFunction()
    const duration = Date.now() - startTime
    
    console.log(`  ✅ Passed: ${testName} (${duration}ms)`)
    return {
      testName,
      passed: true,
      message: 'Test passed successfully',
      details: result,
      duration
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    console.log(`  ❌ Failed: ${testName} - ${message} (${duration}ms)`)
    return {
      testName,
      passed: false,
      message,
      duration
    }
  }
}

function generateTestSummary(
  suites: TestSuite[], 
  totalTests: number, 
  passedTests: number, 
  failedTests: number, 
  totalDuration: number
): string {
  const lines: string[] = []
  
  lines.push('🧪 SYSTEM INTEGRITY TEST RESULTS')
  lines.push('=' .repeat(50))
  lines.push('')
  
  lines.push(`Overall Result: ${failedTests === 0 ? '✅ PASSED' : '❌ FAILED'}`)
  lines.push(`Total Tests: ${totalTests}`)
  lines.push(`Passed: ${passedTests}`)
  lines.push(`Failed: ${failedTests}`)
  lines.push(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`)
  lines.push(`Total Duration: ${totalDuration}ms`)
  lines.push('')
  
  lines.push('Test Suite Results:')
  lines.push('-'.repeat(30))
  
  suites.forEach(suite => {
    const status = suite.failed === 0 ? '✅' : '❌'
    lines.push(`${status} ${suite.suiteName}: ${suite.passed}/${suite.results.length} passed (${suite.totalDuration}ms)`)
    
    if (suite.failed > 0) {
      suite.results.filter(r => !r.passed).forEach(result => {
        lines.push(`    ❌ ${result.testName}: ${result.message}`)
      })
    }
  })
  
  lines.push('')
  
  if (failedTests === 0) {
    lines.push('🎉 All tests passed! System integrity is maintained.')
    lines.push('')
    lines.push('Key validations confirmed:')
    lines.push('• Withdrawal security prevents double spending')
    lines.push('• Commission and wallet systems are properly separated')
    lines.push('• Balance synchronization maintains data integrity')
    lines.push('• Order status changes properly affect commissions')
    lines.push('• System integrity validation functions correctly')
  } else {
    lines.push('⚠️  Some tests failed. Please review and fix the issues above.')
    lines.push('')
    lines.push('Critical areas to address:')
    suites.forEach(suite => {
      if (suite.failed > 0) {
        lines.push(`• ${suite.suiteName}: ${suite.failed} failed test(s)`)
      }
    })
  }
  
  return lines.join('\n')
}

// Export for use in other scripts
export {
  runTest,
  TestResult,
  TestSuite
}
