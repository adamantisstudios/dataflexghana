"use client"
import { useEffect, useState } from "react"
import { TrendingUp, Users, Zap } from "lucide-react"

export default function VanityMetricsCompact() {
  const [visitors, setVisitors] = useState(0)

  useEffect(() => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem("dailyVisitors")
    const storedDate = localStorage.getItem("visitorDate")
    if (storedDate === today && stored) {
      setVisitors(Number.parseInt(stored))
    } else {
      const randomVisitors = Math.floor(Math.random() * (1300 - 120 + 1)) + 120
      setVisitors(randomVisitors)
      localStorage.setItem("dailyVisitors", randomVisitors.toString())
      localStorage.setItem("visitorDate", today)
    }
  }, [])

  const metrics = [
    {
      icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Active Visitors Today",
      value: visitors.toLocaleString(),
      color: "text-blue-500",
    },
    {
      icon: <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Candidates Verified",
      value: "2,847+",
      color: "text-cyan-500",
    },
    {
      icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Successful Placements",
      value: "1,256+",
      color: "text-green-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-md p-2 sm:p-3 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`flex items-center justify-center mb-1 ${metric.color}`}>{metric.icon}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 line-clamp-1">{metric.label}</p>
          <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-800">{metric.value}</p>
        </div>
      ))}
    </div>
  )
}
