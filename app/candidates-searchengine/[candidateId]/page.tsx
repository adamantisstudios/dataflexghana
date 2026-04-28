import type { Metadata } from "next"
import CandidateDetailPage from "@/components/public/candidates-search/CandidateDetailPage"

export const metadata: Metadata = {
  title: "Candidate Profile | DataFlex Candidates Search Engine",
  description: "View detailed candidate profile and their job requirements.",
  robots: "index, follow",
}

interface Props {
  params: Promise<{
    candidateId: string
  }>
}

export default async function CandidateDetailPageWrapper({ params }: Props) {
  const { candidateId } = await params
  return <CandidateDetailPage candidateId={candidateId} />
}
