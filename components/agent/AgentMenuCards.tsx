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

  // CRITICAL FIX: Enhanced menu card click handler with smooth scrolling
  const handleMenuCardClick = (cardId: string) => {
    // Call the parent's tab change handler
    onTabChange(cardId)

    // CRITICAL FIX: Add smooth scrolling to content section after menu click
    setTimeout(() => {
      // IMPROVED: Better content section targeting with multiple selectors
      const possibleSelectors = [
        `[data-tab-content="${cardId}"]`,
        `[data-state="active"][data-value="${cardId}"]`,
        `[role="tabpanel"][data-state="active"]`,
        ".tab-content",
        '[role="tabpanel"]',
        // Target the main content area where tabs are displayed
        'main [data-orientation="horizontal"]',
        // Target the tabs content container
        '.space-y-6 > div[data-state="active"]',
        // Fallback to any visible tab content
        '[data-state="active"]',
      ]

      let targetElement = null

      // Try each selector until we find a visible element
      for (const selector of possibleSelectors) {
        try {
          const element = document.querySelector(selector)
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
        // Calculate scroll position to show the content section
        const elementRect = targetElement.getBoundingClientRect()
        const currentScrollY = window.pageYOffset

        // FIXED: Scroll down to show the content, not up
        // Add some padding above the content for better visibility
        const headerOffset = 100 // Adjust based on your header height
        const targetScrollY = currentScrollY + elementRect.top - headerOffset

        window.scrollTo({
          top: Math.max(0, targetScrollY), // Ensure we don't scroll above the page
          behavior: "smooth",
        })

        // Add a subtle highlight animation to indicate the active section
        targetElement.classList.add("animate-pulse")
        setTimeout(() => {
          targetElement.classList.remove("animate-pulse")
        }, 1000)
      } else {
        // Enhanced fallback: scroll to a position below the menu cards
        const menuContainer =
          scrollContainerRef.current?.closest(".container") || scrollContainerRef.current?.parentElement?.parentElement

        if (menuContainer) {
          const menuRect = menuContainer.getBoundingClientRect()
          const currentScrollY = window.pageYOffset

          // FIXED: Scroll down to show content area below menu
          const targetScrollY = currentScrollY + menuRect.bottom + 50

          window.scrollTo({
            top: targetScrollY,
            behavior: "smooth",
          })
        } else {
          // Final fallback: scroll down by a reasonable amount
          window.scrollBy({
            top: 400, // Scroll down 400px to show content
            behavior: "smooth",
          })
        }
      }
    }, 150) // Slightly longer delay to ensure DOM updates and tab switching
  }

  const menuCards: MenuCard[] = [
    {
      id: "compliance",
      title: "Compliance",
      description: "Register Businesses & Earn commissions",
      icon: <FileText className="h-6 w-6" />,
      image: "/images/compliance.svg",
      gradient: "linear-gradient(135deg, #7C3AED, #5B21B6)",
      buttonText: "MANAGE FORMS",
      onClick: () => handleMenuCardClick("compliance"),
    },
    {
      id: "properties",
      title: "Promote Properties",
      description: "Promote and earn commissions",
      icon: <Building2 className="h-6 w-6" />,
      image: "/images/properties.svg",
      gradient: "linear-gradient(135deg, #059669, #047857)",
      buttonText: "VISIT PLATFORM",
      onClick: () => handleMenuCardClick("properties"),
    },
    {
      id: "services",
      title: "Referral Services",
      description: "Earn commissions from referrals",
      icon: <Users className="h-6 w-6" />,
      image: "/images/referral-services.svg",
      gradient: "linear-gradient(135deg, #26A69A, #00796B)",
      buttonText: "REFER NOW",
      onClick: () => handleMenuCardClick("services"),
    },
    {
      id: "data-bundles",
      title: "Data Bundles",
      description: "Purchase mobile data packages",
      icon: <Smartphone className="h-6 w-6" />,
      image: "/images/data-bundles.svg",
      gradient: "linear-gradient(135deg, #8E24AA, #5E35B1)",
      buttonText: "BUY DATA",
      onClick: () => handleMenuCardClick("data-bundles"),
    },
    {
      id: "jobs",
      title: "Job Opportunities",
      description: "Find and apply for jobs",
      icon: <Briefcase className="h-6 w-6" />,
      image: "/images/job-opportunities.svg",
      gradient: "linear-gradient(135deg, #1E88E5, #1565C0)",
      buttonText: "FIND JOBS",
      onClick: () => handleMenuCardClick("jobs"),
    },
    {
      id: "withdrawals",
      title: "Withdrawals",
      description: "Withdraw your earnings",
      icon: <Wallet className="h-6 w-6" />,
      image: "/images/withdrawals.svg",
      gradient: "linear-gradient(135deg, #E53935, #B71C1C)",
      buttonText: "WITHDRAW",
      onClick: () => handleMenuCardClick("withdrawals"),
    },
    {
      id: "savings",
      title: "Savings Plans",
      description: "Save money with our plans",
      icon: <PiggyBank className="h-6 w-6" />,
      image: "/images/savings-plans.svg",
      gradient: "linear-gradient(135deg, #FF7043, #D84315)",
      buttonText: "SAVE NOW",
      onClick: () => handleMenuCardClick("savings"),
    },
    {
      id: "wholesale",
      title: "Wholesale",
      description: "Buy products in bulk",
      icon: <Package className="h-6 w-6" />,
      image: "/images/wholesale.svg",
      gradient: "linear-gradient(135deg, #43A047, #2E7D32)",
      buttonText: "SHOP BULK",
      onClick: () => handleMenuCardClick("wholesale"),
    },
    {
      id: "profile",
      title: "Profile Settings",
      description: "Manage your account settings",
      icon: <Settings className="h-6 w-6" />,
      image: "/images/profile-settings.svg",
      gradient: "linear-gradient(135deg, #546E7A, #37474F)",
      buttonText: "SETTINGS",
      onClick: () => handleMenuCardClick("profile"),
    },
  ]

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
    <div className="relative mb-8">
      {/* Desktop View - Horizontal Grid */}
      <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {menuCards.map((card) => (
          <div
            key={card.id}
            className={`relative rounded-2xl p-6 h-48 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              activeTab === card.id ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : "shadow-lg"
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
              <div className="w-16 h-16 relative ml-4 flex-shrink-0">
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

      {/* Mobile/Tablet View - Horizontal Scroll */}
      <div className="lg:hidden relative">
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/95 backdrop-blur-sm border-gray-300 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        )}

        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/95 backdrop-blur-sm border-gray-300 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200"
            onClick={scrollRight}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-12"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {menuCards.map((card) => (
            <div
              key={card.id}
              className={`relative rounded-2xl p-5 h-44 w-72 flex-shrink-0 flex items-center justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                activeTab === card.id ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : "shadow-lg"
              }`}
              style={{ background: card.gradient }}
              onClick={card.onClick}
            >
              <div className="text-white flex-1 max-w-[60%] pr-2">
                <div className="flex items-center gap-2 mb-3">
                  {card.icon}
                  <h3 className="font-bold text-base leading-tight">{card.title}</h3>
                </div>
                <p className="text-sm opacity-90 mb-4 line-clamp-2 leading-tight">{card.description}</p>
                <button className="bg-white hover:bg-gray-100 transition-all duration-200 border-none px-3 py-2 rounded-lg text-xs font-semibold text-gray-900 shadow-md">
                  {card.buttonText}
                </button>
              </div>
              <div className="w-20 h-20 relative flex-shrink-0">
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
