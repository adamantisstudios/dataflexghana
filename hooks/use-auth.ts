"use client"

import { useEffect, useState } from "react"
import { getCurrentSupabaseUser } from "@/lib/supabase-hybrid-auth"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchUser = async () => {
      try {
        setLoading(true)
        const currentUser = await getCurrentSupabaseUser()
        if (isMounted) {
          setUser(currentUser)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to get user"))
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      isMounted = false
    }
  }, [])

  return { user, loading, error }
}
