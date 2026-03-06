"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Award,
  Sparkles,
  Users,
  Shield,
  PiggyBank,
  Zap,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export function AgentBenefitsSlideup() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldSlideUp, setShouldSlideUp] = useState(false);

  const benefits = [
    { icon: Sparkles, text: "Free Sales Training", color: "text-yellow-600" },
    { icon: Users, text: "10,000+ Active Agents", color: "text-blue-600" },
    { icon: Shield, text: "24/7 Admin Support", color: "text-purple-600" },
    { icon: PiggyBank, text: "Personal Assistant", color: "text-orange-600" },
    { icon: Zap, text: "Instant Opportunities", color: "text-red-600" },
    { icon: TrendingUp, text: "Earn in 24 Hours", color: "text-green-600" },
    { icon: CreditCard, text: "Discounted Costs", color: "text-indigo-600" },
    { icon: Award, text: "Extra Commissions", color: "text-pink-600" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const showNotification = () => {
      setIsVisible(true);
      setShouldSlideUp(true);
    };

    // Show initially after 5 minutes (300,000 ms)
    const initialTimer = setTimeout(showNotification, 300000);
    // Then show every 5 minutes
    const intervalTimer = setInterval(showNotification, 300000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const handleDismiss = () => {
    setShouldSlideUp(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop – fades in with the card */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 pointer-events-none ${
          shouldSlideUp ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide‑up card */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 sm:px-6">
        <div
          className={`pointer-events-auto mx-auto max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-500 ease-out ${
            shouldSlideUp
              ? "translate-y-0 opacity-100 mb-4"
              : "translate-y-full opacity-0"
          }`}
        >
          {/* Header with gradient and handle */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-4">
            {/* Subtle decorative pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent)]" />

            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-white/20 p-2 rounded-full">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg truncate">
                    Become an Agent Today
                  </h3>
                  <p className="text-xs sm:text-sm text-green-100 truncate">
                    Unlock exclusive benefits & start earning
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors ml-3 flex-shrink-0"
                aria-label="Close notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drag handle (visual only) */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-12 h-1 bg-white/40 rounded-full" />
          </div>

          {/* Benefits grid */}
          <div className="px-5 py-6 bg-gray-50/50">
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className={`${benefit.color} bg-gray-50 p-2 rounded-lg`}>
                    <benefit.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-gray-800 text-xs sm:text-sm leading-tight">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-6">
              <Button
                asChild
                onClick={handleDismiss}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-sm sm:text-base rounded-xl shadow-md"
              >
                <Link href="/agent/register">Register Now & Start Earning</Link>
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="text-center text-xs text-gray-400 mt-4">
              ⚡ Join 10,000+ agents already earning
            </p>
          </div>
        </div>
      </div>
    </>
  );
}