"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Users,
  Smartphone,
  Briefcase,
  Wallet,
  Settings,
  PiggyBank,
  Package,
  ChevronRight,
  Building2,
  FileText,
  BookOpen,
  Upload,
} from "lucide-react";

interface MenuCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  gradient: string;
  buttonText: string;
  onClick: () => void;
}

interface AgentMenuCardsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AgentMenuCards({ activeTab, onTabChange }: AgentMenuCardsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const demoTimerRef = useRef<number | null>(null);
  const announceTimerRef = useRef<number | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isInitialMobile, setIsInitialMobile] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState("");

  const menuCards: MenuCard[] = [
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
      id: "online-courses",
      title: "Online Courses",
      description: "Sign up to online courses today",
      icon: <BookOpen className="h-12 w-12" />,
      image: "/images/online-courses.png",
      gradient: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      buttonText: "SIGN UP NOW",
      onClick: () => handleMenuCardClick("online-courses"),
    },
    {
      id: "Channels",
      title: "Dataflex Channels",
      description: "Follow Or Join Channels",
      icon: <BookOpen className="h-12 w-12" />,
      image: "/images/teaching-platform.png",
      gradient: "linear-gradient(135deg, #3B82F6, #1E40AF)",
      buttonText: "EXPLORE CHANNELS",
      onClick: () => handleMenuCardClick("Channels"), // Fixed
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
      id: "publish-products",
      title: "Publish Products",
      description: "Upload products for wholesale",
      icon: <Upload className="h-12 w-12" />,
      image: "/images/publish-products.png",
      gradient: "linear-gradient(135deg, #1976D2, #1565C0)",
      buttonText: "PUBLISH NOW",
      onClick: () => handleMenuCardClick("publish-products"),
    },
    {
      id: "publish-properties",
      title: "Publish Properties",
      description: "List properties for sale or rent",
      icon: <Building2 className="h-12 w-12" />,
      image: "/images/publish-properties.png",
      gradient: "linear-gradient(135deg, #D97706, #B45309)",
      buttonText: "PUBLISH NOW",
      onClick: () => handleMenuCardClick("publish-properties"),
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
  ];


  function handleMenuCardClick(cardId: string) {
    onTabChange(cardId);
    setTimeout(() => {
      const selectors = [
        `[data-tab-content="${cardId}"]`,
        `[data-state="active"][data-value="${cardId}"]`,
        `[role="tabpanel"][data-state="active"]`,
        `.tab-content`,
        '[role="tabpanel"]',
      ];
      let found: HTMLElement | null = null;
      for (const s of selectors) {
        try {
          const el = document.querySelector(s) as HTMLElement | null;
          if (el && el.offsetHeight > 0) {
            found = el;
            break;
          }
        } catch {}
      }
      if (found) {
        const rect = found.getBoundingClientRect();
        const headerOffset = 100;
        const targetY = window.pageYOffset + rect.top - headerOffset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        found.classList.add("animate-pulse");
        setTimeout(() => found?.classList.remove("animate-pulse"), 1000);
      } else {
        window.scrollBy({ top: 400, behavior: "smooth" });
      }
    }, 120);
  }

  const stopAllHints = useCallback(() => {
    if (demoTimerRef.current !== null) {
      window.clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    if (announceTimerRef.current !== null) {
      window.clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
  }, []);

  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
      stopAllHints();
      setAnnounceMessage("");
    }
  }, [userInteracted, stopAllHints]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const isMobileWidth = window.innerWidth < 1024;
    setIsInitialMobile(isMobileWidth);
    if (!isMobileWidth) return;
    const DEMO_INTERVAL = 7000;
    const NUDGE_DISTANCE = Math.min(200, Math.floor(container.clientWidth * 0.35));
    const SHAKE_MS = 420;
    const runDemoSequence = () => {
      if (!container || userInteracted) return;
      setAnnounceMessage("Hint: swipe left or right to see more options.");
      if (announceTimerRef.current) {
        clearTimeout(announceTimerRef.current);
      }
      announceTimerRef.current = window.setTimeout(() => setAnnounceMessage(""), 1200);
      container.classList.add("hint-shake");
      window.setTimeout(() => container.classList.remove("hint-shake"), SHAKE_MS);
      try {
        container.scrollBy({ left: NUDGE_DISTANCE, behavior: "smooth" });
      } catch {
        container.scrollLeft = Math.min(container.scrollLeft + NUDGE_DISTANCE, container.scrollWidth - container.clientWidth);
      }
      window.setTimeout(() => {
        if (!container || userInteracted) return;
        try {
          container.scrollBy({ left: -NUDGE_DISTANCE, behavior: "smooth" });
        } catch {
          container.scrollLeft = Math.max(0, container.scrollLeft - NUDGE_DISTANCE);
        }
      }, 1400);
    };
    const firstDelay = window.setTimeout(() => {
      if (!userInteracted) runDemoSequence();
    }, 600);
    demoTimerRef.current = window.setInterval(() => {
      if (!userInteracted) runDemoSequence();
      else stopAllHints();
    }, DEMO_INTERVAL);
    return () => {
      clearTimeout(firstDelay);
      stopAllHints();
    };
  }, [userInteracted, stopAllHints]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      if (container.scrollLeft > 8) {
        handleUserInteraction();
      }
    };
    const onPointerDown = () => handleUserInteraction();
    const onTouchStart = () => handleUserInteraction();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " ", "Spacebar", "Enter"].includes(e.key)) {
        handleUserInteraction();
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleUserInteraction]);

  useEffect(() => {
    return () => stopAllHints();
  }, [stopAllHints]);

  return (
    <div className="relative mb-12">
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuCards.map((card) => (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.onClick();
              }
            }}
            className={`relative rounded-2xl p-6 h-56 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-4 ${
              activeTab === card.id ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : "shadow-xl"
            }`}
            style={{ background: card.gradient }}
            onClick={card.onClick}
            aria-pressed={activeTab === card.id}
            aria-label={`${card.title} - ${card.description}`}
          >
            <div className="flex items-start justify-between">
              <div className="text-white flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {card.icon}
                  <h3 className="font-bold text-lg">{card.title}</h3>
                </div>
                <p className="text-sm opacity-90 mb-4">{card.description}</p>
                <button
                  className="bg-white hover:bg-gray-100 transition-all duration-200 border-none px-4 py-2 rounded-lg text-sm font-semibold text-gray-900 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    card.onClick();
                  }}
                >
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
                    const t = e.target as HTMLImageElement;
                    if (t) t.style.display = "none";
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 px-4 touch-pan-x scroll-smooth" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }} role="list" aria-label="Agent menu cards">
          {menuCards.map((card) => (
            <div
              key={card.id}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  card.onClick();
                }
              }}
              className={`relative rounded-2xl p-4 h-52 w-72 flex-shrink-0 flex items-center justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl focus:outline-none ${
                activeTab === card.id ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : "shadow-xl"
              }`}
              style={{ background: card.gradient }}
              onClick={card.onClick}
              aria-pressed={activeTab === card.id}
              aria-label={`${card.title} - ${card.description}`}
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
                    e.stopPropagation();
                    card.onClick();
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
                    const t = e.target as HTMLImageElement;
                    if (t) t.style.display = "none";
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {!userInteracted && isInitialMobile && (
          <div className="pointer-events-none">
            <div className="absolute right-0 top-1/2 translate-x-6 -translate-y-1/2 z-30 flex flex-col items-center gap-1">
              <ChevronRight className="h-7 w-7 text-amber-500 hint-bounce" strokeWidth={3} />
              <ChevronRight className="h-6 w-6 text-amber-400 hint-pulse slower" strokeWidth={3} />
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-6 -translate-y-1/2 z-30 flex flex-col items-center gap-1">
              <div className="transform rotate-180">
                <ChevronRight className="h-7 w-7 text-amber-500 hint-bounce" strokeWidth={3} />
              </div>
              <div className="transform rotate-180">
                <ChevronRight className="h-6 w-6 text-amber-400 hint-pulse slower" strokeWidth={3} />
              </div>
            </div>
            <div className="absolute left-4 top-2 z-30 pointer-events-none">
              <div className="rounded-full px-3 py-1.5 shadow-md bg-amber-50/95 backdrop-blur-sm border border-amber-100 animate-flash">
                <span className="text-amber-800 font-semibold select-none">Swipe →</span>
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-14 pointer-events-none z-20">
              <div className="h-full w-full bg-gradient-to-l from-transparent to-amber-50/60 opacity-80" />
            </div>
          </div>
        )}
      </div>
      <div className="sr-only" aria-live="polite">
        {announceMessage}
      </div>
      <style jsx>{`
        .scroll-smooth::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hint-bounce {
          animation: hint-bounce 1.6s infinite;
        }
        @keyframes hint-bounce {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.95;
          }
          40% {
            transform: translateY(-10px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.95;
          }
        }
        .hint-pulse {
          animation: hint-pulse 1.3s infinite;
        }
        .hint-pulse.slower {
          animation-duration: 1.9s;
        }
        @keyframes hint-pulse {
          0% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.18);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.85;
          }
        }
        .animate-flash {
          animation: flash-text 1.6s infinite;
        }
        @keyframes flash-text {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.95;
          }
          50% {
            transform: translateY(-4px) scale(1.02);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.95;
          }
        }
        .hint-shake {
          animation: hint-shake 420ms cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes hint-shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        .pointer-events-none {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export default AgentMenuCards;
