"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getStoredAgent } from '@/lib/agent-auth'
import { getStoredAdmin } from '@/app/admin/layout'
import { savingsApi, adminSavingsApi } from '@/lib/api-client-enhanced'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function SavingsAuthTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    // Check current user
    const agent = getStoredAgent()
    const admin = getStoredAdmin()
    
    if (agent) {
      setUserInfo({ type: 'agent', data: agent })
    } else if (admin) {
      setUserInfo({ type: 'admin', data: admin })
    }
  }, [])

  const addResult = (test: string, status: 'success' | 'error', message: string, data?: any) => {
    setResults(prev => [...prev, { test, status, message, data }])
  }

  const runTests = async () => {
    setLoading(true)
    setResults([])

    try {
      // Test 1: Get savings plans (public endpoint)
      addResult('Get Savings Plans', 'pending', 'Testing...')
      try {
        const plansResponse = await fetch('/api/agent/savings/plans')
        const plansData = await plansResponse.json()
        
        if (plansResponse.ok) {
          addResult('Get Savings Plans', 'success', `Found ${plansData.plans?.length || 0} plans`, plansData)
        } else {
          addResult('Get Savings Plans', 'error', plansData.error || 'Failed to fetch plans')
        }
      } catch (error) {
        addResult('Get Savings Plans', 'error', `Network error: ${error}`)
      }

      // Test 2: Get user's savings accounts
      if (userInfo) {
        addResult('Get User Savings', 'pending', 'Testing...')
        try {
          let savingsData
          if (userInfo.type === 'agent') {
            savingsData = await savingsApi.getSavings()
          } else {
            savingsData = await adminSavingsApi.getAllSavings()
          }
          
          addResult('Get User Savings', 'success', `Found ${savingsData.savings?.length || 0} savings accounts`, savingsData)
        } catch (error) {
          addResult('Get User Savings', 'error', `Error: ${error}`)
        }

        // Test 3: Get savings transactions
        addResult('Get Savings Transactions', 'pending', 'Testing...')
        try {
          const transactionsResponse = await fetch(`/api/agent/savings/transactions?agentId=${userInfo.data.id}`)
          const transactionsData = await transactionsResponse.json()
          
          if (transactionsResponse.ok) {
            addResult('Get Savings Transactions', 'success', `Found ${transactionsData.transactions?.length || 0} transactions`, transactionsData)
          } else {
            addResult('Get Savings Transactions', 'error', transactionsData.error || 'Failed to fetch transactions')
          }
        } catch (error) {
          addResult('Get Savings Transactions', 'error', `Network error: ${error}`)
        }

        // Test 4: Get withdrawal requests
        addResult('Get Withdrawal Requests', 'pending', 'Testing...')
        try {
          const withdrawalResponse = await fetch(`/api/agent/savings/withdraw?agentId=${userInfo.data.id}`)
          const withdrawalData = await withdrawalResponse.json()
          
          if (withdrawalResponse.ok) {
            addResult('Get Withdrawal Requests', 'success', `Found ${withdrawalData.withdrawalRequests?.length || 0} withdrawal requests`, withdrawalData)
          } else {
            addResult('Get Withdrawal Requests', 'error', withdrawalData.error || 'Failed to fetch withdrawal requests')
          }
        } catch (error) {
          addResult('Get Withdrawal Requests', 'error', `Network error: ${error}`)
        }
      } else {
        addResult('Authentication Check', 'error', 'No user logged in - please login as agent or admin first')
      }

    } catch (error) {
      addResult('Test Suite', 'error', `Unexpected error: ${error}`)
    }

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Savings Authentication Test</CardTitle>
          <CardDescription>
            Test the savings system integration with the unified authentication system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          {userInfo ? (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <strong>Logged in as:</strong> {userInfo.type} - {userInfo.data.full_name || userInfo.data.email} (ID: {userInfo.data.id})
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription>
                <strong>Not logged in:</strong> Please login as an agent or admin to test authenticated endpoints
              </AlertDescription>
            </Alert>
          )}

          {/* Test Button */}
          <Button 
            onClick={runTests} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Tests...' : 'Run Savings API Tests'}
          </Button>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              {results.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.test}</span>
                    <span className="text-sm uppercase font-bold">{result.status}</span>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:underline">View Response Data</summary>
                      <pre className="text-xs mt-1 p-2 bg-white rounded border overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {results.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Test Summary:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div>Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div>Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {results.length}
                  </div>
                  <div>Total</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
