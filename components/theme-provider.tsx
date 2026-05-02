"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Always render NextThemesProvider, but use suppressHydrationWarning during initial render
  return (
    <NextThemesProvider {...props} suppressHydrationWarning>
      {mounted ? children : <div suppressHydrationWarning>{children}</div>}
    </NextThemesProvider>
  )
}
