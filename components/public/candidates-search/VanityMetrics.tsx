"use client"
import { useEffect, useState } from "react"
import { Eye, TrendingUp } from "lucide-react"

export default function VanityMetrics() {
  const [metrics, setMetrics] = useState({
    dailyVisits: 0,
    weeklyTrend: 0,
  })

  useEffect(() => {
    const getMetricsForDay = () => {
      const today = new Date().toDateString()
      const storedDate = localStorage.getItem("metricsDate")
      const storedMetrics = localStorage.getItem("metricsData")
      if (storedDate === today && storedMetrics) {
        return JSON.parse(storedMetrics)
      }
      const dailyVisits = Math.floor(Math.random() * (1300 - 120 + 1)) + 120
      const weeklyTrend = Math.floor(Math.random() * (1200 - 800 + 1)) + 800
      const newMetrics = { dailyVisits, weeklyTrend }
      localStorage.setItem("metricsDate", today)
      localStorage.setItem("metricsData", JSON.stringify(newMetrics))
      return newMetrics
    }
    setMetrics(getMetricsForDay())
  }, [])

  return (
    <div className="bg-white dark:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-md p-4 shadow-sm hover:shadow-md transition-shadow w-full max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-800">
          Page Activity
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-600">
            Visitors today
          </span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-slate-900 dark:text-slate-800">
              {metrics.dailyVisits}
            </span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-1000"
            style={{ width: `${(metrics.dailyVisits / 1300) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-600 mt-2">
          Active searches this week: {metrics.weeklyTrend}
        </p>
      </div>
    </div>
  )
}
