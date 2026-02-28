"use client"

import { useState } from "react"
import { Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlatformSneakPeakButtonProps {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "outline"
}

export function PlatformSneakPeakButton({ size = "sm", variant = "outline" }: PlatformSneakPeakButtonProps) {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <>
      {/* Button */}
      <div className="flex flex-col items-center gap-1 w-full">
        <Button
          onClick={() => setShowVideo(true)}
          variant={variant}
          size={size}
          className={`${
            variant === "outline"
              ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          } gap-2 font-medium transition-all hover:shadow-md w-full sm:w-auto`}
        >
          <Play className="h-4 w-4 fill-current flex-shrink-0" />
          <span>Platform Sneak Peak</span>
        </Button>
        <p className="text-xs text-gray-500 text-center">See what's inside</p>
      </div>

      {/* Video Modal - TikTok Style Vertical */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-[320px] sm:max-w-[380px] h-screen sm:h-auto sm:max-h-[90vh] mx-auto">
            {/* Modal Container - Vertical Aspect Ratio */}
            <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl h-full sm:h-auto flex flex-col">
              {/* Close Button - Top Right */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowVideo(false)}
                  className="bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 transition-colors backdrop-blur-sm"
                  aria-label="Close video"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Video Container - TikTok Vertical (9:16) */}
              <div className="relative bg-black h-full sm:h-[600px] overflow-hidden flex-1">
                <video autoPlay controls className="w-full h-full object-cover" src="/sneakpeak.mp4">
                  Your browser does not support the video tag.
                </video>

                {/* Video Gradient Overlay (bottom) */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Footer Info */}
              <div className="bg-gradient-to-t from-gray-900 to-gray-800 px-5 sm:px-6 py-4 border-t border-gray-700 flex flex-col gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-white font-bold text-base sm:text-lg">Platform Tour</h3>
                  <p className="text-emerald-300 text-xs sm:text-sm">Watch how to earn with DataFlex Ghana</p>
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-lg text-sm sm:text-base py-2 sm:py-2.5"
                >
                  <a href="/agent/register">Ready to Join?</a>
                </Button>

                {/* Close Button */}
                <Button
                  onClick={() => setShowVideo(false)}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent text-sm sm:text-base py-2 sm:py-2.5"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
