"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Users,
  Smartphone,
  Briefcase,
  Wallet,
  Settings,
  PiggyBank,
  Package,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface MenuCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  image: string
  gradient: string
  buttonText: string
  onClick: () => void
}

interface AgentMenuCardsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AgentMenuCards({ activeTab, onTabChange }: AgentMenuCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const menuCards: MenuCard[] = [
    {
      id: "teaching",
      title: "Teaching Platform",
      description: "Learn from expert teachers",
      icon: <BookOpen className="h-12 w-12" />,
      image: "/images/teaching-platform.png",
      gradient: "linear-gradient(135deg, #3B82F6, #1E40AF)",
      buttonText: "EXPLORE CHANNELS",
      onClick: () => handleMenuCardClick("teaching"),
    },
    {
      id: "compliance",
      title: "Compliance",
      description: "Business Registration Etc",
      icon: <FileText className="h-12 w-12" />,
      image: "/images/compliance.png",
      gradient: "linear-gradient(135deg, #7C3AED, #5B21B6)",
      buttonText: "MANAGE FORMS",
      onClick: () => handleMenuCardClick("compliance"),
    },
    {
      id: "professional-writing",
      title: "Professional Writing",
      description: "Resume, CV, Etc",
      icon: <FileText className="h-12 w-12" />,
      image: "/images/professional-writing.preview.png",
      gradient: "linear-gradient(135deg, #EC4899, #BE185D)",
      buttonText: "WRITING SERVICES",
      onClick: () => handleMenuCardClick("professional-writing"),
    },
    {
      id: "properties",
      title: "Promote Properties",
      description: "Promote and earn commissions",
      icon: <Building2 className="h-12 w-12" />,
      image: "/images/properties.png",
      gradient: "linear-gradient(135deg, #059669, #047857)",
      buttonText: "VISIT PLATFORM",
      onClick: () => handleMenuCardClick("properties"),
    },
    {
      id: "referral-program",
      title: "Referral Program",
      description: "Invite & Earn Commissions",
      icon: <Users className="h-12 w-12" />,
      image: "/images/referral-program.png",
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      buttonText: "INVITE NOW",
      onClick: () => handleMenuCardClick("referral-program"),
    },
    {
      id: "services",
      title: "Referral Services",
      description: "Refer & Earn Big",
      icon: <Users className="h-12 w-12" />,
      image: "/images/referral-services.png",
      gradient: "linear-gradient(135deg, #26A69A, #1565C0)",
      buttonText: "REFER NOW",
      onClick: () => handleMenuCardClick("services"),
    },
    {
      id: "data-bundles",
      title: "Data Bundles",
      description: "Order Data Bundles",
      icon: <Smartphone className="h-12 w-12" />,
      image: "/images/data-bundles.png",
      gradient: "linear-gradient(135deg, #8E24AA, #5E35B1)",
      buttonText: "BUY DATA",
      onClick: () => handleMenuCardClick("data-bundles"),
    },
    {
      id: "jobs",
      title: "Job Opportunities",
      description: "Find and apply for jobs",
      icon: <Briefcase className="h-12 w-12" />,
      image: "/images/job-opportunities.png",
      gradient: "linear-gradient(135deg, #1E88E5, #1565C0)",
      buttonText: "FIND JOBS",
      onClick: () => handleMenuCardClick("jobs"),
    },
    {
      id: "withdrawals",
      title: "Withdrawals",
      description: "Withdraw your earnings",
      icon: <Wallet className="h-12 w-12" />,
      image: "/images/withdrawals.png",
      gradient: "linear-gradient(135deg, #E53935, #B71C1C)",
      buttonText: "WITHDRAW",
      onClick: () => handleMenuCardClick("withdrawals"),
    },
    {
      id: "savings",
      title: "Savings Plans",
      description: "Save money with our plans",
      icon: <PiggyBank className="h-12 w-12" />,
      image: "/images/savings-plans.png",
      gradient: "linear-gradient(135deg, #FF7043, #D84315)",
      buttonText: "SAVE NOW",
      onClick: () => handleMenuCardClick("savings"),
    },
    {
      id: "wholesale",
      title: "Wholesale",
      description: "Buy products in bulk",
      icon: <Package className="h-12 w-12" />,
      image: "/images/wholesale.png",
      gradient: "linear-gradient(135deg, #43A047, #2E7D32)",
      buttonText: "SHOP BULK",
      onClick: () => handleMenuCardClick("wholesale"),
    },
    {
      id: "profile",
      title: "Profile Settings",
      description: "Manage your account settings",
      icon: <Settings className="h-12 w-12" />,
      image: "/images/profile-settings.png",
      gradient: "linear-gradient(135deg, #546E7A, #37474F)",
      buttonText: "SETTINGS",
      onClick: () => handleMenuCardClick("profile"),
    },
  ]

  const handleMenuCardClick = (cardId: string) => {
    onTabChange(cardId)
    setTimeout(() => {
      const possibleSelectors = [
        `[data-tab-content="${cardId}"]`,
        `[data-state="active"][data-value="${cardId}"]`,
        `[role="tabpanel"][data-state="active"]`,
        ".tab-content",
        '[role="tabpanel"]',
        'main [data-orientation="horizontal"]',
        '.space-y-6 > div[data-state="active"]',
        '[data-state="active"]',
      ]
      let targetElement: HTMLElement | null = null
      for (const selector of possibleSelectors) {
        try {
          const element = document.querySelector(selector) as HTMLElement
          if (element && element.offsetHeight > 0) {
            targetElement = element
            break
          }
        } catch (error) {
          console.warn(`Invalid selector: ${selector}`)
          continue
        }
      }
      if (targetElement) {
        const elementRect = targetElement.getBoundingClientRect()
        const currentScrollY = window.pageYOffset
        const headerOffset = 100
        const targetScrollY = currentScrollY + elementRect.top - headerOffset
        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: "smooth",
        })
        targetElement.classList.add("animate-pulse")
        setTimeout(() => {
          targetElement.classList.remove("animate-pulse")
        }, 1000)
      } else {
        const menuContainer =
          scrollContainerRef.current?.closest(".container") || scrollContainerRef.current?.parentElement?.parentElement
        if (menuContainer) {
          const menuRect = (menuContainer as HTMLElement).getBoundingClientRect()
          const currentScrollY = window.pageYOffset
          const targetScrollY = currentScrollY + menuRect.bottom + 50
          window.scrollTo({
            top: targetScrollY,
            behavior: "smooth",
          })
        } else {
          window.scrollBy({
            top: 400,
            behavior: "smooth",
          })
        }
      }
    }, 150)
  }

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", updateScrollButtons)
      updateScrollButtons()
      return () => container.removeEventListener("scroll", updateScrollButtons)
    }
  }, [])

  return (
    <div className="relative mb-12">
      {/* Desktop View - Horizontal Grid (Larger Cards) */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuCards.map((card) => (
          <div
            key={card.id}
            className={`relative rounded-2xl p-6 h-56 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
              activeTab === card.id ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : "shadow-xl"
            }`}
            style={{ background: card.gradient }}
            onClick={card.onClick}
          >
            <div className="flex items-start justify-between">
              <div className="text-white flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {card.icon}
                  <h3 className="font-bold text-lg">{card.title}</h3>
                </div>
                <p className="text-sm opacity-90 mb-4">{card.description}</p>
                <button className="bg-white hover:bg-gray-100 transition-all duration-200 border-none px-4 py-2 rounded-lg text-sm font-semibold text-gray-900 shadow-md">
                  {card.buttonText}
                </button>
              </div>
              <div className="w-32 h-32 relative ml-2 flex-shrink-0">
                <Image
                  src={card.image || "/placeholder.svg"}
                  alt={card.title}
                  fill
                  className="object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile/Tablet View - Horizontal Scroll (Larger Cards) */}
      <div className="lg:hidden relative">
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/95 backdrop-blur-sm border-gray-300 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 hidden"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/95 backdrop-blur-sm border-gray-300 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 hidden"
            onClick={scrollRight}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {menuCards.map((card) => (
            <div
              key={card.id}
              className={`relative rounded-2xl p-4 h-52 w-72 flex-shrink-0 flex items-center justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                activeTab === card.id ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : "shadow-xl"
              }`}
              style={{ background: card.gradient }}
              onClick={card.onClick}
            >
              <div className="text-white flex-1 max-w-[60%] pr-2">
                <div className="flex items-center gap-2 mb-2">
                  {card.icon}
                  <h3 className="font-bold text-lg leading-tight">{card.title}</h3>
                </div>
                <p className="text-sm opacity-90 mb-3 line-clamp-2 leading-tight">{card.description}</p>
                <button
                  className="bg-white hover:bg-gray-100 transition-all duration-200 border-none px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-900 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    card.onClick()
                  }}
                >
                  {card.buttonText}
                </button>
              </div>
              <div className="w-32 h-32 relative flex-shrink-0 pointer-events-none">
                <Image
                  src={card.image || "/placeholder.svg"}
                  alt={card.title}
                  fill
                  className="object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
