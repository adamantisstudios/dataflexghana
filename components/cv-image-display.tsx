"use client"

import React from "react"
import Image from "next/image"
import { FileText } from "lucide-react"

export function CVImageDisplay() {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.style.display = "none"
    const fallback = target.parentElement?.querySelector(".image-fallback") as HTMLElement
    if (fallback) fallback.style.display = "flex"
  }

  return (
    <div className="w-full">
      {/* Container for the CV image, optimized for all screen sizes */}
      <div className="w-full aspect-[1/1.414] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
          {/* Image with responsive sizing and fallback */}
          <Image
            src="/publiccv.png"
            alt="Professional CV Template - Dataflex Ghana Agent Exclusive Service"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 595px"
            className="object-contain"
            priority
            quality={100}
            onError={handleImageError}
          />
          {/* Fallback UI for image load errors */}
          <div className="image-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 hidden">
            <div className="text-center p-4 sm:p-8">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-2 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-semibold">
                Professional CV Template
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1 sm:mt-2">
                (publiccv.png)
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
