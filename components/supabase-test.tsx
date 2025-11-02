"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function SupabaseTest() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test the connection by trying to fetch from a table
        const { data, error } = await supabase.from("agents").select("count").limit(1)

        if (error) {
          throw error
        }

        setStatus("connected")
      } catch (err: any) {
        setStatus("error")
        setError(err.message || "Connection failed")
      }
    }

    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
          {status === "connected" && <CheckCircle className="h-5 w-5 text-green-600" />}
          {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
          Supabase Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Testing connection...</Badge>
          </div>
        )}
        {status === "connected" && (
          <div className="space-y-2">
            <Badge className="bg-green-100 text-green-800">Connected Successfully</Badge>
            <p className="text-sm text-gray-600">Database is ready for TrustReach operations</p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-2">
            <Badge variant="destructive">Connection Failed</Badge>
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-gray-500">
              Make sure your Supabase project is active and the database tables are created.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
