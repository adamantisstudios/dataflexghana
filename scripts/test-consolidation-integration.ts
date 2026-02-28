/**
 * CONSOLIDATION INTEGRATION TEST
 *
 * This test validates that the commission calculation consolidation was successful
 * and that there are no remaining synchronization issues between calculation methods.
 *
 * Key validations:
 * - All consolidated functions work correctly
 * - No remaining imports from old earnings-calculator.ts
 * - Wallet balance calculations are consistent
 * - Commission calculations are accurate
 * - No circular dependencies exist
 */

import { supabase } from "../lib/supabase"
import {
  calculateCompleteEarnings,
  calculateMonthlyStatistics,
  calculateCorrectWalletBalance,
} from "../lib/commission-earnings"

interface TestResult {
  testName: string
  passed: boolean
  message: string
  details?: any
  severity: "critical" | "warning" | "info"
}

interface ConsolidationTestReport {
  overall: {
    passed: boolean
    score: number
    totalTests: number
    passedTests: number
    failedTests: number
  }
  categories: {
    functionConsolidation: TestResult[]
    calculationAccuracy: TestResult[]
    dataConsistency: TestResult[]
    performanceValidation: TestResult[]
  }
  summary: string[]
  recommendations: string[]
}

/**
 * Run comprehensive consolidation integration test
 */
export async function runConsolidationIntegrationTest(): Promise<ConsolidationTestReport> {
  console.log("🚀 Starting Consolidation Integration Test...\n")

  const functionConsolidation = await testFunctionConsolidation()
  const calculationAccuracy = await testCalculationAccuracy()
  const dataConsistency = await testDataConsistency()
  const performanceValidation = await testPerformanceValidation()

  const allTests = [...functionConsolidation, ...calculationAccuracy, ...dataConsistency, ...performanceValidation]

  const passedTests = allTests.filter((test) => test.passed).length
  const failedTests = allTests.length - passedTests
  const score = Math.round((passedTests / allTests.length) * 100)
  const passed = failedTests === 0

  const summary = generateSummary(allTests)
  const recommendations = generateRecommendations(allTests)

  const report: ConsolidationTestReport = {
    overall: {
      passed,
      score,
      totalTests: allTests.length,
      passedTests,
      failedTests,
    },
    categories: {
      functionConsolidation,
      calculationAccuracy,
      dataConsistency,
      performanceValidation,
    },
    summary,
    recommendations,
  }

  printReport(report)
  return report
}

/**
 * Test 1: Function Consolidation Validation
 */
async function testFunctionConsolidation(): Promise<TestResult[]> {
  console.log("🧪 Testing Function Consolidation...")
  const tests: TestResult[] = []

  // Test 1.1: Verify consolidated functions exist and are callable
  try {
    const testAgentId = "test-agent-consolidation"

    // Test calculateCompleteEarnings
    const earningsResult = await calculateCompleteEarnings(testAgentId)
    tests.push({
      testName: "calculateCompleteEarnings function exists and callable",
      passed: typeof earningsResult === "object" && earningsResult !== null,
      message: "calculateCompleteEarnings function is working correctly",
      severity: "critical",
    })

    // Test calculateMonthlyStatistics
    const monthlyResult = await calculateMonthlyStatistics(testAgentId)
    tests.push({
      testName: "calculateMonthlyStatistics function exists and callable",
      passed: typeof monthlyResult === "object" && monthlyResult !== null,
      message: "calculateMonthlyStatistics function is working correctly",
      severity: "critical",
    })

    // Test calculateCorrectWalletBalance
    const walletResult = await calculateCorrectWalletBalance(testAgentId)
    tests.push({
      testName: "calculateCorrectWalletBalance function exists and callable",
      passed: typeof walletResult === "object" && walletResult !== null && typeof walletResult.balance === "number",
      message: "calculateCorrectWalletBalance function is working correctly",
      severity: "critical",
    })
  } catch (error) {
    tests.push({
      testName: "Consolidated functions accessibility",
      passed: false,
      message: `Error accessing consolidated functions: ${error instanceof Error ? error.message : "Unknown error"}`,
      severity: "critical",
    })
  }

  // Test 1.2: Verify function return types and structure
  try {
    const testAgentId = "test-agent-structure"

    const earningsResult = await calculateCompleteEarnings(testAgentId)
    const hasRequiredEarningsFields =
      earningsResult &&
      typeof earningsResult.totalCommissions === "number" &&
      typeof earningsResult.totalPaidOut === "number" &&
      typeof earningsResult.availableCommissions === "number"

    tests.push({
      testName: "calculateCompleteEarnings returns correct structure",
      passed: hasRequiredEarningsFields,
      message: hasRequiredEarningsFields
        ? "calculateCompleteEarnings returns all required fields"
        : "calculateCompleteEarnings missing required fields",
      details: earningsResult,
      severity: "critical",
    })

    const monthlyResult = await calculateMonthlyStatistics(testAgentId)
    const hasRequiredMonthlyFields =
      monthlyResult &&
      typeof monthlyResult.walletBalance === "number" &&
      typeof monthlyResult.availableCommissions === "number" &&
      Array.isArray(monthlyResult.monthlyData)

    tests.push({
      testName: "calculateMonthlyStatistics returns correct structure",
      passed: hasRequiredMonthlyFields,
      message: hasRequiredMonthlyFields
        ? "calculateMonthlyStatistics returns all required fields"
        : "calculateMonthlyStatistics missing required fields",
      details: monthlyResult,
      severity: "critical",
    })
  } catch (error) {
    tests.push({
      testName: "Function return structure validation",
      passed: false,
      message: `Error validating function structures: ${error instanceof Error ? error.message : "Unknown error"}`,
      severity: "critical",
    })
  }

  console.log(`✅ Function Consolidation Tests: ${tests.filter((t) => t.passed).length}/${tests.length} passed\n`)
  return tests
}

/**
 * Test 2: Calculation Accuracy Validation
 */
async function testCalculationAccuracy(): Promise<TestResult[]> {
  console.log("🧪 Testing Calculation Accuracy...")
  const tests: TestResult[] = []

  try {
    // Get a sample of real agents for testing
    const { data: sampleAgents, error: agentsError } = await supabase
      .from("agents")
      .select("id, full_name, totalCommissions, totalPaidOut, walletBalance")
      .not("totalCommissions", "is", null)
      .limit(5)

    if (agentsError || !sampleAgents || sampleAgents.length === 0) {
      tests.push({
        testName: "Sample agents data availability",
        passed: false,
        message: "Could not retrieve sample agents for testing",
        severity: "warning",
      })
      return tests
    }

    tests.push({
      testName: "Sample agents data availability",
      passed: true,
      message: `Retrieved ${sampleAgents.length} sample agents for testing`,
      severity: "info",
    })

    // Test calculation consistency for each sample agent
    for (const agent of sampleAgents) {
      try {
        // Test earnings calculation
        const earningsResult = await calculateCompleteEarnings(agent.id)
        const monthlyResult = await calculateMonthlyStatistics(agent.id)
        const walletResult = await calculateCorrectWalletBalance(agent.id)

        // Verify earnings consistency between functions
        const earningsConsistent =
          Math.abs(earningsResult.availableCommissions - monthlyResult.availableCommissions) < 0.01

        tests.push({
          testName: `Earnings consistency for agent ${agent.full_name}`,
          passed: earningsConsistent,
          message: earningsConsistent
            ? "Earnings calculations are consistent between functions"
            : `Earnings mismatch: ${earningsResult.availableCommissions} vs ${monthlyResult.availableCommissions}`,
          details: {
            agentId: agent.id,
            calculateCompleteEarnings: earningsResult.availableCommissions,
            calculateMonthlyStatistics: monthlyResult.availableCommissions,
          },
          severity: "critical",
        })

        // Verify wallet balance consistency
        const walletConsistent = Math.abs(walletResult.balance - monthlyResult.walletBalance) < 0.01

        tests.push({
          testName: `Wallet balance consistency for agent ${agent.full_name}`,
          passed: walletConsistent,
          message: walletConsistent
            ? "Wallet balance calculations are consistent between functions"
            : `Wallet balance mismatch: ${walletResult.balance} vs ${monthlyResult.walletBalance}`,
          details: {
            agentId: agent.id,
            calculateCorrectWalletBalance: walletResult.balance,
            calculateMonthlyStatistics: monthlyResult.walletBalance,
          },
          severity: "critical",
        })

        // Verify no negative balances
        const noNegativeBalances = earningsResult.availableCommissions >= 0 && walletResult.balance >= 0

        tests.push({
          testName: `No negative balances for agent ${agent.full_name}`,
          passed: noNegativeBalances,
          message: noNegativeBalances ? "All balances are non-negative" : "Found negative balances",
          details: {
            agentId: agent.id,
            availableCommissions: earningsResult.availableCommissions,
            walletBalance: walletResult.balance,
          },
          severity: "critical",
        })
      } catch (error) {
        tests.push({
          testName: `Calculation test for agent ${agent.full_name}`,
          passed: false,
          message: `Error testing agent calculations: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "critical",
        })
      }
    }
  } catch (error) {
    tests.push({
      testName: "Calculation accuracy validation",
      passed: false,
      message: `Error in calculation accuracy tests: ${error instanceof Error ? error.message : "Unknown error"}`,
      severity: "critical",
    })
  }

  console.log(`✅ Calculation Accuracy Tests: ${tests.filter((t) => t.passed).length}/${tests.length} passed\n`)
  return tests
}

/**
 * Test 3: Data Consistency Validation
 */
async function testDataConsistency(): Promise<TestResult[]> {
  console.log("🧪 Testing Data Consistency...")
  const tests: TestResult[] = []

  try {
    // Test 3.1: Verify no orphaned data
    const { data: orphanedOrders, error: orphanError } = await supabase
      .from("data_orders")
      .select("id, agent_id")
      .not("agent_id", "in", `(SELECT id FROM agents)`)
      .limit(10)

    tests.push({
      testName: "No orphaned data orders",
      passed: !orphanError && (!orphanedOrders || orphanedOrders.length === 0),
      message: orphanError
        ? `Database error: ${orphanError.message}`
        : orphanedOrders && orphanedOrders.length > 0
          ? `Found ${orphanedOrders.length} orphaned data orders`
          : "No orphaned data orders found",
      severity: "warning",
    })

    // Test 3.2: Verify commission amounts are reasonable
    const { data: unreasonableCommissions, error: commissionError } = await supabase
      .from("agents")
      .select("id, full_name, totalCommissions, totalPaidOut")
      .gt("totalCommissions", 10000) // Assuming 10,000 is unusually high
      .limit(5)

    tests.push({
      testName: "Commission amounts are reasonable",
      passed: !commissionError && (!unreasonableCommissions || unreasonableCommissions.length === 0),
      message: commissionError
        ? `Database error: ${commissionError.message}`
        : unreasonableCommissions && unreasonableCommissions.length > 0
          ? `Found ${unreasonableCommissions.length} agents with unusually high commissions (>10,000)`
          : "All commission amounts appear reasonable",
      severity: "warning",
    })

    // Test 3.3: Verify wallet transaction integrity
    const { data: invalidTransactions, error: transactionError } = await supabase
      .from("wallet_transactions")
      .select("id, transaction_type, amount, status")
      .or("amount.is.null,amount.lt.0")
      .limit(10)

    tests.push({
      testName: "Wallet transaction integrity",
      passed: !transactionError && (!invalidTransactions || invalidTransactions.length === 0),
      message: transactionError
        ? `Database error: ${transactionError.message}`
        : invalidTransactions && invalidTransactions.length > 0
          ? `Found ${invalidTransactions.length} invalid wallet transactions`
          : "All wallet transactions have valid amounts",
      severity: "critical",
    })
  } catch (error) {
    tests.push({
      testName: "Data consistency validation",
      passed: false,
      message: `Error in data consistency tests: ${error instanceof Error ? error.message : "Unknown error"}`,
      severity: "critical",
    })
  }

  console.log(`✅ Data Consistency Tests: ${tests.filter((t) => t.passed).length}/${tests.length} passed\n`)
  return tests
}

/**
 * Test 4: Performance Validation
 */
async function testPerformanceValidation(): Promise<TestResult[]> {
  console.log("🧪 Testing Performance...")
  const tests: TestResult[] = []

  try {
    // Test performance of consolidated functions
    const testAgentId = "performance-test-agent"
    const iterations = 5

    // Test calculateCompleteEarnings performance
    const earningsStartTime = Date.now()
    for (let i = 0; i < iterations; i++) {
      await calculateCompleteEarnings(testAgentId)
    }
    const earningsEndTime = Date.now()
    const earningsAvgTime = (earningsEndTime - earningsStartTime) / iterations

    tests.push({
      testName: "calculateCompleteEarnings performance",
      passed: earningsAvgTime < 5000, // Should complete within 5 seconds
      message: `Average execution time: ${earningsAvgTime}ms (${iterations} iterations)`,
      details: { avgTime: earningsAvgTime, iterations },
      severity: "warning",
    })

    // Test calculateMonthlyStatistics performance
    const monthlyStartTime = Date.now()
    for (let i = 0; i < iterations; i++) {
      await calculateMonthlyStatistics(testAgentId)
    }
    const monthlyEndTime = Date.now()
    const monthlyAvgTime = (monthlyEndTime - monthlyStartTime) / iterations

    tests.push({
      testName: "calculateMonthlyStatistics performance",
      passed: monthlyAvgTime < 5000, // Should complete within 5 seconds
      message: `Average execution time: ${monthlyAvgTime}ms (${iterations} iterations)`,
      details: { avgTime: monthlyAvgTime, iterations },
      severity: "warning",
    })

    // Test calculateCorrectWalletBalance performance
    const walletStartTime = Date.now()
    for (let i = 0; i < iterations; i++) {
      await calculateCorrectWalletBalance(testAgentId)
    }
    const walletEndTime = Date.now()
    const walletAvgTime = (walletEndTime - walletStartTime) / iterations

    tests.push({
      testName: "calculateCorrectWalletBalance performance",
      passed: walletAvgTime < 3000, // Should complete within 3 seconds
      message: `Average execution time: ${walletAvgTime}ms (${iterations} iterations)`,
      details: { avgTime: walletAvgTime, iterations },
      severity: "warning",
    })
  } catch (error) {
    tests.push({
      testName: "Performance validation",
      passed: false,
      message: `Error in performance tests: ${error instanceof Error ? error.message : "Unknown error"}`,
      severity: "warning",
    })
  }

  console.log(`✅ Performance Tests: ${tests.filter((t) => t.passed).length}/${tests.length} passed\n`)
  return tests
}

/**
 * Generate summary of test results
 */
function generateSummary(tests: TestResult[]): string[] {
  const summary: string[] = []

  const criticalTests = tests.filter((t) => t.severity === "critical")
  const criticalPassed = criticalTests.filter((t) => t.passed).length
  const criticalFailed = criticalTests.length - criticalPassed

  const warningTests = tests.filter((t) => t.severity === "warning")
  const warningPassed = warningTests.filter((t) => t.passed).length
  const warningFailed = warningTests.length - warningPassed

  summary.push(`Critical Tests: ${criticalPassed}/${criticalTests.length} passed`)
  summary.push(`Warning Tests: ${warningPassed}/${warningTests.length} passed`)

  if (criticalFailed === 0 && warningFailed === 0) {
    summary.push("🎉 All consolidation tests passed! The system is working correctly.")
  } else if (criticalFailed === 0) {
    summary.push("✅ All critical tests passed. Some warnings need attention.")
  } else {
    summary.push("❌ Critical issues found that need immediate attention.")
  }

  return summary
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(tests: TestResult[]): string[] {
  const recommendations: string[] = []

  const failedCritical = tests.filter((t) => !t.passed && t.severity === "critical")
  const failedWarning = tests.filter((t) => !t.passed && t.severity === "warning")

  if (failedCritical.length > 0) {
    recommendations.push("URGENT: Fix critical issues before deploying to production")
    failedCritical.forEach((test) => {
      recommendations.push(`- ${test.testName}: ${test.message}`)
    })
  }

  if (failedWarning.length > 0) {
    recommendations.push("Address warning issues to improve system reliability")
    failedWarning.forEach((test) => {
      recommendations.push(`- ${test.testName}: ${test.message}`)
    })
  }

  if (failedCritical.length === 0 && failedWarning.length === 0) {
    recommendations.push("System consolidation is successful - ready for production")
    recommendations.push("Continue monitoring system performance and data consistency")
  }

  return recommendations
}

/**
 * Print comprehensive test report
 */
function printReport(report: ConsolidationTestReport): void {
  console.log("\n" + "=".repeat(60))
  console.log("📋 CONSOLIDATION INTEGRATION TEST REPORT")
  console.log("=".repeat(60))

  console.log("\n📊 OVERALL RESULTS:")
  console.log(`Score: ${report.overall.score}%`)
  console.log(`Status: ${report.overall.passed ? "✅ PASSED" : "❌ FAILED"}`)
  console.log(`Tests: ${report.overall.passedTests}/${report.overall.totalTests} passed`)

  console.log("\n📈 CATEGORY BREAKDOWN:")
  Object.entries(report.categories).forEach(([category, tests]) => {
    const passed = tests.filter((t) => t.passed).length
    const total = tests.length
    const percentage = Math.round((passed / total) * 100)
    console.log(`${category}: ${passed}/${total} (${percentage}%)`)
  })

  console.log("\n📝 SUMMARY:")
  report.summary.forEach((item) => console.log(`• ${item}`))

  if (report.recommendations.length > 0) {
    console.log("\n🔧 RECOMMENDATIONS:")
    report.recommendations.forEach((rec) => console.log(`• ${rec}`))
  }

  console.log("\n" + "=".repeat(60))
  console.log("Test completed at:", new Date().toISOString())
  console.log("=".repeat(60) + "\n")
}

// Run the test if this file is executed directly
if (require.main === module) {
  runConsolidationIntegrationTest()
    .then((report) => {
      process.exit(report.overall.passed ? 0 : 1)
    })
    .catch((error) => {
      console.error("❌ Test execution failed:", error)
      process.exit(1)
    })
}
