import type { Metadata } from "next"
import { DataflexTermsPage } from "@/components/terms/dataflex-terms-page"
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_LAST_UPDATED,
  PLATFORM_ENTRY_FEE_MANUAL,
} from "@/lib/terms-config"

export const metadata: Metadata = {
  title: "Terms & Policies | Dataflex Ghana - Agent Platform Documentation",
  description: `Terms, conditions, and policies for Dataflex Ghana. GH₵${PLATFORM_ENTRY_FEE_MANUAL} non-refundable platform entry fee, wallet policy, all platform services, data delivery, and agent rules. Effective ${TERMS_EFFECTIVE_DATE}.`,
  robots: "index,follow",
  keywords:
    "Dataflex Ghana terms, agent platform, GH₵47 fee, non-refundable, wallet policy, professional CV writing, Ghana data reseller, multi-service platform",
}

export default function TermsPage() {
  return <DataflexTermsPage />
}
