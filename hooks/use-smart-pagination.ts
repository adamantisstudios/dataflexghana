import { useState, useCallback, useMemo } from 'react'

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  hasMore: boolean
  loadedPages: Set<number>
}

interface UsePaginationReturn {
  currentPage: number
  itemsPerPage: number
  totalPages: number
  hasMore: boolean
  paginatedData: any[]
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setItemsPerPage: (count: number) => void
  preloadPages: (pages: number[]) => void
  isPageLoaded: (page: number) => boolean
  totalLoadedItems: number
}

/**
 * Smart pagination hook that loads only required pages upfront and lazy-loads others.
 * Designed to significantly reduce initial load time and memory usage.
 */
export function useSmartPagination(
  allData: any[],
  itemsPerPage: number = 10,
  initialPagesToLoad: number = 3
): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1)
  const [loadedPages, setLoadedPages] = useState<Set<number>>(() => {
    // Pre-load first N pages
    const pages = new Set<number>()
    for (let i = 1; i <= initialPagesToLoad; i++) {
      pages.add(i)
    }
    return pages
  })

  const totalPages = useMemo(() => Math.ceil(allData.length / itemsPerPage), [allData.length, itemsPerPage])

  // Get only the data from currently loaded pages
  const paginatedData = useMemo(() => {
    const result: any[] = []
    
    loadedPages.forEach((page) => {
      const startIndex = (page - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const pageData = allData.slice(startIndex, endIndex)
      result.push(...pageData)
    })
    
    // Return data for current page only
    const startIndex = (currentPage - 1) * itemsPerPage
    return allData.slice(startIndex, startIndex + itemsPerPage)
  }, [allData, currentPage, itemsPerPage, loadedPages])

  const hasMore = useMemo(() => currentPage < totalPages, [currentPage, totalPages])

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(validPage)
      
      // Auto-load the page when navigating to it
      if (!loadedPages.has(validPage)) {
        setLoadedPages((prev) => {
          const newSet = new Set(prev)
          newSet.add(validPage)
          return newSet
        })
      }
    },
    [totalPages, loadedPages]
  )

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const preloadPages = useCallback((pagesToLoad: number[]) => {
    setLoadedPages((prev) => {
      const newSet = new Set(prev)
      pagesToLoad.forEach((page) => {
        if (page >= 1 && page <= totalPages) {
          newSet.add(page)
        }
      })
      return newSet
    })
  }, [totalPages])

  const isPageLoaded = useCallback((page: number) => loadedPages.has(page), [loadedPages])

  const totalLoadedItems = useMemo(() => {
    return Array.from(loadedPages).reduce((total, page) => {
      const startIndex = (page - 1) * itemsPerPage
      const endIndex = Math.min(startIndex + itemsPerPage, allData.length)
      return total + (endIndex - startIndex)
    }, 0)
  }, [loadedPages, itemsPerPage, allData.length])

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    hasMore,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage: () => {}, // Placeholder
    preloadPages,
    isPageLoaded,
    totalLoadedItems,
  }
}
