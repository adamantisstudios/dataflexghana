"use client"
import { BookOpen, Users, MessageSquare, HelpCircle, FileText, Play, Rss, Video, CreditCard } from 'lucide-react'
import { useRef } from "react"

interface ChannelMenuBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ChannelMenuBar({ activeTab, onTabChange }: ChannelMenuBarProps) {
  const menuItems = [
    { id: "feeds", label: "Feeds", icon: Rss, color: "bg-emerald-500", hoverColor: "hover:bg-emerald-600" },
    { id: "overview", label: "Overview", icon: BookOpen, color: "bg-blue-500", hoverColor: "hover:bg-blue-600" },
    { id: "members", label: "Members", icon: Users, color: "bg-purple-500", hoverColor: "hover:bg-purple-600" },
    { id: "requests", label: "Requests", icon: MessageSquare, color: "bg-amber-500", hoverColor: "hover:bg-amber-600" },
    {
      id: "lesson-notes",
      label: "Lesson Notes",
      icon: FileText,
      color: "bg-cyan-500",
      hoverColor: "hover:bg-cyan-600",
    },
    { id: "qa", label: "Q&A", icon: HelpCircle, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600" },
    { id: "videos", label: "Videos", icon: Play, color: "bg-red-500", hoverColor: "hover:bg-red-600" },
    { id: "youtube-videos", label: "YouTube", icon: Video, color: "bg-rose-500", hoverColor: "hover:bg-rose-600" },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard, color: "bg-green-500", hoverColor: "hover:bg-green-600" },
  ]

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: "smooth" })
    }
  }

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-sm relative">
      {/* Scroll buttons (visible only on mobile) */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-1 z-10 md:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Scrollable menu container */}
      <div ref={scrollContainerRef} className="flex overflow-x-auto scroll-smooth py-2.5 px-1 gap-1 no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-3 rounded-lg transition-all duration-200 flex-shrink-0 min-w-[90px] ${
                isActive
                  ? `${item.color} text-white shadow-md ring-2 ring-offset-2 ring-opacity-50`
                  : `${item.color}/10 text-gray-700 hover:${item.hoverColor} hover:text-white hover:shadow-sm`
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Scroll buttons (visible only on mobile) */}
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-1 z-10 md:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
