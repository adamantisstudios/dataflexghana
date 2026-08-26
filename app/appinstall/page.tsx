import type { Metadata } from "next"
import AppInstallClient from "@/components/appinstall/app-install-client"

export const metadata: Metadata = {
  title: "Download Android App | DataFlex Ghana",
  description:
    "Install the DataFlex Agent Android app. Sell data, run Referral Hub, manage wallet, compliance, jobs, and more — free sideload (not on Play Store yet).",
  openGraph: {
    title: "Download DataFlex Agent for Android",
    description:
      "Official APK for DataFlex Ghana agents. Install guide and screenshots included.",
    url: "https://www.dataflexghana.com/appinstall",
  },
}

export default function AppInstallPage() {
  return <AppInstallClient />
}
