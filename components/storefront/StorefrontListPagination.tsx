"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const PER_PAGE = 12

export function paginateItems<T>(items: T[], page: number, perPage = PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * perPage
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + perPage),
    total: items.length,
    perPage,
  }
}

type PaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  perPage?: number
  onPageChange: (page: number) => void
  accentColor?: string
  className?: string
}

export function StorefrontListPagination({
  page,
  totalPages,
  totalItems,
  perPage = PER_PAGE,
  onPageChange,
  accentColor = "#3B82F6",
  className,
}: PaginationProps) {
  const [slideDirection, setSlideDirection] = useState<"up" | "down">("down")

  if (totalPages <= 1) return null

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, totalItems)

  const go = (next: number) => {
    setSlideDirection(next > page ? "down" : "up")
    onPageChange(next)
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 pt-2", className)}>
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg h-9 gap-1"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm font-medium tabular-nums min-w-[4.5rem] text-center" style={{ color: accentColor }}>
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg h-9 gap-1"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

type PageSectionProps = {
  pageKey: string | number
  slideDirection?: "up" | "down"
  children: React.ReactNode
  className?: string
}

/** Animated wrapper for paginated storefront lists. */
export function StorefrontPageSection({
  pageKey,
  slideDirection = "down",
  children,
  className,
}: PageSectionProps) {
  return (
    <div
      key={pageKey}
      className={cn(
        "animate-in fade-in duration-300 fill-mode-both",
        slideDirection === "down" ? "slide-in-from-bottom-4" : "slide-in-from-top-4",
        className,
      )}
    >
      {children}
    </div>
  )
}

export { PER_PAGE as STOREFRONT_ITEMS_PER_PAGE }
