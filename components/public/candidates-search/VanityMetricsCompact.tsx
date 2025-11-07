"use client"
import { useEffect, useState } from "react"
import { TrendingUp, Users, Zap } from "lucide-react"

export default function VanityMetricsCompact() {
  const [visitors, setVisitors] = useState(0)
  const [successfulPlacements, setSuccessfulPlacements] = useState(0)

  useEffect(() => {
    const today = new Date()
    const todayString = today.toDateString()
    const isMonday = today.getDay() === 1

    // Weekly logic for "Successfully Placed"
    const storedWeekly = localStorage.getItem("weeklyPlacements")
    const storedWeekStart = localStorage.getItem("weekStartDate")

    if (isMonday || !storedWeekStart) {
      const newWeekly = Math.floor(Math.random() * (50 - 17 + 1)) + 17
      localStorage.setItem("weeklyPlacements", newWeekly.toString())
      localStorage.setItem("weekStartDate", todayString)
      setSuccessfulPlacements(newWeekly)
    } else {
      setSuccessfulPlacements(Number.parseInt(storedWeekly))
    }

    // Daily logic for "Daily Visitors Today"
    const storedDaily = localStorage.getItem("dailyVisitors")
    const storedDailyDate = localStorage.getItem("visitorDate")

    if (storedDailyDate === todayString && storedDaily) {
      setVisitors(Number.parseInt(storedDaily))
    } else {
      const randomVisitors = Math.floor(Math.random() * (1300 - 120 + 1)) + 120
      setVisitors(randomVisitors)
      localStorage.setItem("dailyVisitors", randomVisitors.toString())
      localStorage.setItem("visitorDate", todayString)
    }
  }, [])

  const metrics = [
    { icon: <Users size={16} />, label: "Daily Visitors", value: visitors.toLocaleString(), color: "text-blue-500" },
    { icon: <Zap size={16} />, label: "Verified", value: "24,847+", color: "text-cyan-500" },
    { icon: <TrendingUp size={16} />, label: "Weekly Placement", value: successfulPlacements.toLocaleString(), color: "text-green-500" },
  ]

  return (
    <div className="flex flex-row justify-between w-full gap-1">
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex-1 bg-white dark:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-center shadow-sm min-w-0">
          <div className={`flex justify-center mb-0.5 ${metric.color}`}>{metric.icon}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{metric.label}</p>
          <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-800 truncate">{metric.value}</p>
        </div>
      ))}
    </div>
  )
}
