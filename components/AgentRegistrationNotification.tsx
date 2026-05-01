'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AgentRegistrationNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-md mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-4 space-y-3">
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="pr-8">
            <h3 className="font-semibold text-white text-sm">Join Dataflex Ghana</h3>
            <p className="text-white/90 text-xs mt-1">Become an agent and enjoy exclusive benefits, higher commissions, and premium support.</p>
          </div>

          {/* CTA Button */}
          <Button
            asChild
            size="sm"
            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold gap-2"
          >
            <Link href="/agent/register" className="flex items-center justify-center">
              <span>Register as Agent</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>

          {/* Dismiss link */}
          <button
            onClick={() => setIsVisible(false)}
            className="w-full text-center text-white/70 hover:text-white/90 text-xs transition-colors py-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
