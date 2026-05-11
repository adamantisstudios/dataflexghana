"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Award, Sparkles, Users, Shield, PiggyBank, Zap, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";

export function AgentBenefitsSlideup() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldSlideUp, setShouldSlideUp] = useState(false);

  const benefits = [
    { icon: Sparkles, text: "Free sales training", color: "text-yellow-600" },
    { icon: Users, text: "10,000+ active agents", color: "text-blue-600" },
    { icon: Shield, text: "24/7 admin support", color: "text-purple-600" },
    { icon: PiggyBank, text: "Personal assistant", color: "text-orange-600" },
    { icon: Zap, text: "Instant opportunities", color: "text-red-600" },
    { icon: TrendingUp, text: "Earn within 24 hours", color: "text-green-600" },
    { icon: CreditCard, text: "Discounted service costs", color: "text-indigo-600" },
    { icon: Award, text: "Extra commission bonuses", color: "text-pink-600" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const showNotification = () => {
      setIsVisible(true);
      setShouldSlideUp(true);
    };

    // Show initially after 5 minutes, then every 5 minutes
    const initialTimer = setTimeout(showNotification, 300000);
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
      {/* Simple dark backdrop – no blur */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-500 pointer-events-none ${
          shouldSlideUp ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide‑up card – clean, no gradient header */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 sm:px-6">
        <div
          className={`pointer-events-auto mx-auto max-w-lg w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-500 ease-out ${
            shouldSlideUp ? "translate-y-0 opacity-100 mb-4" : "translate-y-full opacity-0"
          }`}
        >
          {/* Header – solid green, no pattern */}
          <div className="bg-green-700 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5" />
                <div>
                  <h3 className="font-bold text-base">Become an agent today</h3>
                  <p className="text-xs text-green-100">Unlock benefits & start earning</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Benefits – two columns, simple list */}
          <div className="px-5 py-6">
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <benefit.icon className={`h-4 w-4 ${benefit.color} shrink-0`} />
                  <span className="text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* CTA button – solid green */}
            <div className="mt-6">
              <Button
                asChild
                onClick={handleDismiss}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md"
              >
                <Link href="/agent/register">Register now – start earning →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}