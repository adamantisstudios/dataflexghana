"use client"

import {
  BookOpen,
  Users,
  MessageSquare,
  HelpCircle,
  FileText,
  Play,
  Rss,
  Video,
  CreditCard,
  Headphones,
} from "lucide-react"
import { teachingHubTabListClass, teachingHubTabTriggerClass } from "@/components/teaching/teaching-hub-ui"
import { cn } from "@/lib/utils"

interface ChannelMenuBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: "feeds", label: "Feeds", icon: Rss },
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "members", label: "Members", icon: Users },
  { id: "requests", label: "Requests", icon: MessageSquare },
  { id: "lesson-notes", label: "Notes", icon: FileText },
  { id: "qa", label: "Quizzes", icon: HelpCircle },
  { id: "videos", label: "Videos", icon: Play },
  { id: "audio-lectures", label: "Audio", icon: Headphones },
  { id: "youtube-videos", label: "YouTube", icon: Video },
  { id: "subscriptions", label: "Billing", icon: CreditCard },
]

export function ChannelMenuBar({ activeTab, onTabChange }: ChannelMenuBarProps) {
  return (
    <div className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className={cn(teachingHubTabListClass, "mx-4 my-3 sm:mx-6 lg:mx-8 border-0 shadow-none bg-slate-50")}>
        <div className="flex w-full gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  teachingHubTabTriggerClass,
                  "inline-flex shrink-0 items-center gap-1.5",
                  isActive
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
