"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getCurrentUser, canAccessSavings } from '@/lib/unified-auth'
import { savingsApi, adminSavingsApi, handleApiError } from '@/lib/api-client'
import { Loader2, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react'

interface SavingsTestProps {
  className?: string
}

export default function SavingsTest({ className }: SavingsTestProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }])
  }

  const clearResults = () => {
    setResults([])
    setError('')
  }

  const testAgentSavings = async () => {
    if (!user || user.role !== 'agent') {
      addResult('Agent Savings Test', false, null, 'User is not an agent')
      return
    }

    try {
      // Test getting savings plans
      const plansResponse = await savingsApi.getSavingsPlans()
      addResult('Get Savings Plans', true, plansResponse)

      // Test getting agent's savings
      const savingsResponse = await savingsApi.getSavings()
      addResult('Get Agent Savings', true, savingsResponse)

    } catch (err) {
      const errorMessage = handleApiError(err)
      addResult('Agent Savings Test', false, null, errorMessage)
    }
  }

  const testAdminSavings = async () => {
    if (!user || user.role !== 'admin') {
      addResult('Admin Savings Test', false, null, 'User is not an admin')
      return
    }

    try {
      // Test getting all savings (admin only)
      const allSavingsResponse = await adminSavingsApi.getAllSavings()
      addResult('Get All Savings (Admin)', true, allSavingsResponse)

      // Test getting savings reports
      const reportsResponse = await adminSavingsApi.getSavingsReports()
      addResult('Get Savings Reports (Admin)', true, reportsResponse)

      // Test getting withdrawal requests
      const withdrawalsResponse = await adminSavingsApi.getWithdrawalRequests()
      addResult('Get Withdrawal Requests (Admin)', true, withdrawalsResponse)

    } catch (err) {
      const errorMessage = handleApiError(err)
      addResult('Admin Savings Test', false, null, errorMessage)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    clearResults()

    try {
      // Test authentication status
      addResult('User Authentication', !!user, user)
      addResult('Can Access Savings', canAccessSavings(user), { canAccess: canAccessSavings(user) })

      if (user?.role === 'agent') {
        await testAgentSavings()
      } else if (user?.role === 'admin') {
        await testAdminSavings()
      } else {
        addResult('Role Test', false, null, 'Unknown user role or not authenticated')
      }

    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please log in as an admin or agent to test savings functionality
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Savings System Test
        </CardTitle>
        <CardDescription>
          Test savings functionality for {user.role} user: {user.full_name || user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Run Savings Tests
              </>
            )}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.test}</span>
                </div>
                {result.error && (
                  <p className="text-sm text-red-600 ml-6">{result.error}</p>
                )}
                {result.data && (
                  <details className="ml-6 mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                      View Response Data
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>User Role:</strong> {user.role}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Can Access Savings:</strong> {canAccessSavings(user) ? 'Yes' : 'No'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
