import type { ReactNode } from "react"

export default function FoodAndGroceriesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap"
      />
      <div
        className="min-h-screen bg-[#F7FAF7] text-[#1F2937]"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {children}
      </div>
    </>
  )
}
