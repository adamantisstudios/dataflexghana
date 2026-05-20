"use client"

import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { cn } from "@/lib/utils"

type Props = {
  src: string | null | undefined
  alt: string
  className?: string
  onClick?: () => void
}

/** Square product image — matches agent /wholesale ProductBrowser cards. */
export function WholesaleProductThumb({ src, alt, className, onClick }: Props) {
  const imageUrl = src?.trim() || "/placeholder-product.jpg"

  return (
    <div
      className={cn(
        "aspect-square w-full bg-gray-100 overflow-hidden relative",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <ImageWithFallback
        src={imageUrl}
        alt={alt}
        className={cn(
          "w-full h-full object-cover",
          onClick && "hover:scale-105 transition-transform duration-200",
        )}
        fallbackSrc="/placeholder-product.jpg"
      />
    </div>
  )
}
