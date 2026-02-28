"use client"
import CandidatesSearchEngine from "@/components/public/candidates-search/CandidatesSearchEngine"
import { useState } from "react"

export default function CandidatesSearchEngineClientPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <>
      <CandidatesSearchEngine key={refreshTrigger} onRefresh={handleRefresh} />
    </>
  )
}
