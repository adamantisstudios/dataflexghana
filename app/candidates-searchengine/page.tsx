import type { Metadata } from "next"
import CandidatesSearchEngineClientPage from "@/components/public/candidates-search/CandidatesSearchEngineClientPage"

export const metadata: Metadata = {
  title: "Job Candidates Search Engine in Ghana | Find Qualified Professionals",
  description:
    "Search for qualified job candidates in Ghana. Find marketing executives, IT professionals, business managers, and more. Connect with pre-vetted candidates ready to work.",
  keywords: [
    "job candidates Ghana",
    "find candidates Ghana",
    "marketing executives Ghana",
    "IT professionals Ghana",
    "business managers Ghana",
    "qualified candidates Ghana",
    "candidate search Ghana",
    "recruitment Ghana",
    "hiring Ghana",
    "job seekers Ghana",
    "qualified professionals",
  ].join(", "),
  authors: [{ name: "DataFlex Ghana Candidates" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Candidates Search Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com/candidates-searchengine",
    siteName: "DataFlex Candidates Search Engine - Find Qualified Professionals in Ghana",
    title: "Job Candidates Search Engine in Ghana | Find Qualified Professionals",
    description:
      "Search for qualified candidates across Ghana. Find marketing executives, IT professionals, business managers, and more. Pre-vetted professionals ready to work.",
    images: [
      {
        url: "https://dataflexghana.com/images/candidates-search-showcase.jpg",
        width: 1200,
        height: 630,
        alt: "Job Candidates Search Engine in Ghana - Find Qualified Professionals",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title: "🔍 Find Job Candidates in Ghana | Qualified Professionals",
    description:
      "🎯 Marketing Executives ✅ IT Professionals ✅ Business Managers ✅ Find Pre-vetted Candidates ✅ Hire Now! 🇬🇭 #JobCandidatesGhana #RecruitmentGhana #HiringGhana",
    images: [
      {
        url: "https://dataflexghana.com/images/candidates-search-showcase.jpg",
        alt: "Job Candidates Search Engine - Find Qualified Professionals in Ghana",
      },
    ],
  },
  alternates: {
    canonical: "https://dataflexghana.com/candidates-searchengine",
  },
}

export default function CandidatesSearchEnginePage() {
  return (
    <>
      <CandidatesSearchEngineClientPage />
    </>
  )
}
