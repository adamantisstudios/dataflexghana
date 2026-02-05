"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SavingsTab from '@/components/admin/tabs/SavingsTab'

export default function AdminSavingsPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session?.user) {
          router.push('/admin/login')
          return
        }

        setLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading savings management...</p>
        </div>
      </div>
    )
  }

  return <SavingsTab />
}
