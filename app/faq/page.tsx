"use client"

import { useState } from "react"
import { ChevronDown, MessageCircle, Mail, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    id: "general-1",
    category: "Getting Started",
    question: "What is DataFlex Ghana?",
    answer:
      "DataFlex Ghana is Ghana's premier multi-service earning platform that enables agents to generate income through multiple revenue streams. We connect individuals with opportunities in education, employment, business services, wholesale trading, and professional development. Our platform offers transparent commissions with zero agency fees, making it accessible for students, job seekers, entrepreneurs, and anyone seeking flexible side income.",
  },
  {
    id: "general-2",
    category: "Getting Started",
    question: "How much can I earn daily as a DataFlex agent?",
    answer:
      "Agents can earn ₵700+ daily depending on activity and product mix. Earnings vary by service: GES books (₵50-₵500 per transaction), business registrations (₵80-₵130 per transaction), digital vouchers (₵50-₵4,000 per transaction), job referrals (variable), and wholesale margins (30-50% markup). Most successful agents earn between ₵1,500-₵5,000 monthly by diversifying across multiple services.",
  },
  {
    id: "general-3",
    category: "Getting Started",
    question: "Are there any hidden fees or agency charges?",
    answer:
      "No. DataFlex has zero agency fees. The only cost is a one-time joining fee (currently promotional pricing). All commissions are transparent and paid directly to your wallet with no deductions. You keep 100% of your earnings minus the joining fee.",
  },
  {
    id: "general-4",
    category: "Getting Started",
    question: "Who can become a DataFlex agent?",
    answer:
      "Anyone aged 18+ in Ghana can become a DataFlex agent. We welcome students, job seekers, parents, entrepreneurs, and anyone seeking flexible income. No specific qualifications are required - just a phone, internet access, and willingness to help others access services. We provide comprehensive training and 24/7 support to all agents.",
  },
  {
    id: "referral-1",
    category: "Referral Program",
    question: "How does the referral program work?",
    answer:
      "Our referral program has two components: (1) Direct Referrals - Invite friends to join DataFlex as agents and earn referral commissions when they register. (2) Service Referrals - Help others access any DataFlex service and earn commissions based on the service. You can invite unlimited people with your unique referral link.",
  },
  {
    id: "referral-2",
    category: "Referral Program",
    question: "How much can I earn from referrals?",
    answer:
      "Referral earnings depend on what services your referrals engage with. Direct referral commissions are ₵15-₵50 per person who registers. Service referrals earn commission percentages that vary: GES books (₵50-₵500), business registration (₵80-₵130), digital vouchers (₵50-₵4,000), and job placements (variable). There's no limit to referrals or earnings.",
  },
  {
    id: "referral-3",
    category: "Referral Program",
    question: "When do I get paid for referrals?",
    answer:
      "Payment timing varies by referral type. Direct referral commissions are credited within 24-48 hours of registration. Service referrals are paid when the service is completed or the transaction is confirmed. All payments go directly to your DataFlex wallet and can be withdrawn via MoMo (MTN Mobile Money).",
  },
  {
    id: "referral-4",
    category: "Referral Program",
    question: "Can I track my referrals and earnings?",
    answer:
      "Yes. Your agent dashboard provides real-time tracking of all referrals with detailed stats. You can see pending referrals, confirmed referrals, and paid commissions. The dashboard shows earnings by service type and referral source, helping you identify your highest-earning opportunities.",
  },
  {
    id: "ges-1",
    category: "GES Approved Books & Education",
    question: "What are GES-approved educational materials?",
    answer:
      "GES (Ghana Education Service) approved books and materials are textbooks, stationery, and educational resources that meet Ghana's curriculum standards. These include school supplies, workbooks, reference materials, and study guides used in Ghana schools. As an agent, you source these materials at wholesale prices and resell them to students, parents, and schools at retail prices.",
  },
  {
    id: "ges-2",
    category: "GES Approved Books & Education",
    question: "How do I earn commissions from GES books?",
    answer:
      "You earn ₵50-₵500 commission per transaction depending on the materials sold and quantity. Higher-value bundles (like complete school supply packages) earn higher commissions. You can buy materials at wholesale rates and resell to parents, students, and school agents at standard retail prices, pocketing the markup plus commission from DataFlex.",
  },
  {
    id: "ges-3",
    category: "GES Approved Books & Education",
    question: "Can I deliver GES books nationwide?",
    answer:
      "Yes. DataFlex facilitates nationwide delivery through partner logistics. You can accept orders from customers across Ghana and arrange doorstep delivery. This expands your market beyond your immediate location, allowing you to reach students and schools nationwide from your phone.",
  },
  {
    id: "ges-4",
    category: "GES Approved Books & Education",
    question: "How do I access the GES books service?",
    answer:
      "From your agent dashboard, navigate to the 'GES Books' tab (shown as one of the main menu cards). Browse available materials with wholesale prices and commission details. You can filter by subject, grade level, or material type. Place orders directly through the platform with real-time inventory tracking.",
  },
  {
    id: "jobs-1",
    category: "Job Placement & Referrals",
    question: "What types of jobs are available on DataFlex?",
    answer:
      "We list verified job opportunities across multiple categories: remote work, corporate positions, technology jobs, healthcare positions, finance roles, sales positions, customer service, casual labor, domestic work, and specialized trades. All jobs are posted by verified employers with 100% free access to job seekers - zero agency fees.",
  },
  {
    id: "jobs-2",
    category: "Job Placement & Referrals",
    question: "How do I earn money from job referrals?",
    answer:
      "When you refer someone who gets hired through DataFlex, you earn a commission. The commission varies by job type and salary range but typically ranges from ₵50-₵500+ depending on the position. You get paid automatically when your referral gets confirmed employment.",
  },
  {
    id: "jobs-3",
    category: "Job Placement & Referrals",
    question: "Can I earn from job placements with no salary deductions?",
    answer:
      "Yes. Unlike traditional employment agencies that deduct from employee salaries, DataFlex pays you commission without any deductions from the employee's salary. Your referral gets the full salary they negotiated, and you earn your commission separately from the employer or DataFlex.",
  },
  {
    id: "jobs-4",
    category: "Job Placement & Referrals",
    question: "How do I access the jobs section?",
    answer:
      "From your agent dashboard, click on the 'Job Opportunities' menu card. You'll see featured jobs, jobs by category, and search functionality. Filter by job type, location, salary range, or company. Share job links directly with friends and contacts via WhatsApp or email. Track referrals and commissions in real-time.",
  },
  {
    id: "business-1",
    category: "Business Registration & Compliance",
    question: "What business registration services does DataFlex offer?",
    answer:
      "We offer 100% online business registration without paperwork or queues. Services include: sole proprietorship registration, partnership registration, company registration, business legalization, and compliance documentation. All registrations are government-approved with nationwide delivery within 14 working days.",
  },
  {
    id: "business-2",
    category: "Business Registration & Compliance",
    question: "How much commission can I earn from business registrations?",
    answer:
      "You earn ₵80-₵130 commission per completed business registration. With multiple registrations, agents earn ₵2,400-₵3,900 monthly just from this service. It's one of our most profitable offerings because businesses consistently need registration services.",
  },
  {
    id: "business-3",
    category: "Business Registration & Compliance",
    question: "Is the business registration process secure?",
    answer:
      "Completely secure. All registrations go through official government channels with proper verification. We handle documentation securely and maintain privacy. Customers receive official government registration certificates delivered to their location within 14 working days.",
  },
  {
    id: "business-4",
    category: "Business Registration & Compliance",
    question: "How do I access the compliance/registration tab?",
    answer:
      "From your dashboard, click on 'Compliance' menu card. You'll see business registration forms, submission history, and tracking. Fill out customer details, select the registration type, and submit. Track application status and receive notifications when documents are ready for delivery.",
  },
  {
    id: "wholesale-1",
    category: "Wholesale Shopping",
    question: "What can I buy wholesale through DataFlex?",
    answer:
      "DataFlex connects you with verified suppliers across Ghana offering wholesale products in multiple categories: school supplies, consumer goods, business materials, electronics, textiles, and more. Buy at wholesale prices (30-50% below retail) and resell at retail prices or use for dropshipping.",
  },
  {
    id: "wholesale-2",
    category: "Wholesale Shopping",
    question: "What margins can I make with wholesale products?",
    answer:
      "Typical wholesale margins are 30-50% markup above cost. For example, if a bulk item costs ₵1,000 wholesale, you can resell at ₵1,300-₵1,500 retail. With doorstep delivery, you can run a wholesale business from home. Successful agents earn ₵3,000-₵8,000 monthly from wholesale alone.",
  },
  {
    id: "wholesale-3",
    category: "Wholesale Shopping",
    question: "Do I need capital to start wholesale trading?",
    answer:
      "You need initial capital for your first bulk purchase (typically ₵500-₵3,000 to start). However, dropshipping is available - customers pay you first, then you purchase from wholesale suppliers. This eliminates capital requirements for starting.",
  },
  {
    id: "wholesale-4",
    category: "Wholesale Shopping",
    question: "How do I access the wholesale section?",
    answer:
      "Click on 'Wholesale' from your dashboard menu cards. Browse verified suppliers, view wholesale prices, minimum order quantities, and delivery options. Compare prices across suppliers to maximize margins. Place orders directly and track fulfillment and delivery.",
  },
  {
    id: "vouchers-1",
    category: "Digital Vouchers & Products",
    question: "What digital vouchers and products does DataFlex offer?",
    answer:
      "We offer high-commission digital products: GES results checker cards (BECE, WASSCE, ABCE), school registration forms, subscription services, educational subscriptions, business project packages, professional services vouchers. Most commissions range ₵50-₵4,000 per sale.",
  },
  {
    id: "vouchers-2",
    category: "Digital Vouchers & Products",
    question: "How much can I earn from digital vouchers?",
    answer:
      "Digital vouchers offer extremely high commissions - the highest on DataFlex. Depending on product type: results checker cards (₵100-₵500), educational packages (₵200-₵1,000), business services (₵500-₵4,000). No capital required - instant delivery via email/WhatsApp.",
  },
  {
    id: "vouchers-3",
    category: "Digital Vouchers & Products",
    question: "What's the fastest way to earn with digital vouchers?",
    answer:
      "Promote high-ticket vouchers like professional certifications or business packages that pay ₵2,000-₵4,000 commission. Share links in social media groups, WhatsApp communities, and with your network. No inventory, no capital, instant delivery, and high commissions make this ideal for quick earnings.",
  },
  {
    id: "vouchers-4",
    category: "Digital Vouchers & Products",
    question: "How do I access the voucher section?",
    answer:
      "From your dashboard, navigate to 'Voucher Cards' or digital products section. Browse all available vouchers with commission amounts clearly displayed. Copy product links or share via WhatsApp directly to customers. Orders are instant and automatically delivered electronically.",
  },
  {
    id: "teaching-1",
    category: "Teaching Platform & Mentorship",
    question: "What is the teaching platform and mentorship section?",
    answer:
      "This section connects agents with teacher-led learning channels and mentorship communities. Join channels led by educators, professionals, and subject-matter experts offering guidance in academics, career development, professional skills, and business coaching. Agents earn referral commissions when connecting learners with mentors.",
  },
  {
    id: "teaching-2",
    category: "Teaching Platform & Mentorship",
    question: "How do I earn from the mentorship program?",
    answer:
      "Earn referral commissions when you connect students or professionals with mentorship channels. Commission structure depends on channel type and subscription level. Passive income is possible - once you establish relationships, mentees continue generating commissions over time.",
  },
  {
    id: "teaching-3",
    category: "Teaching Platform & Mentorship",
    question: "Can I join mentorship channels for my own learning?",
    answer:
      "Yes. As an agent, you get access to all mentorship channels for your own professional development. Learning from successful mentors helps you grow your skills, which ultimately helps you sell services better and earn more commissions.",
  },
  {
    id: "teaching-4",
    category: "Teaching Platform & Mentorship",
    question: "How do I access teaching channels?",
    answer:
      "From your dashboard, click 'Teaching Platform'. Browse available channels, mentors, and their specializations. Join channels of interest. Share channel invites with your network and earn when they join. Track mentorship referrals and commissions in your stats.",
  },
  {
    id: "wallet-1",
    category: "Wallet & Payments",
    question: "How do I withdraw my earnings?",
    answer:
      "All earnings go to your DataFlex wallet. Withdraw via MTN Mobile Money (MoMo) which takes 2-5 minutes to process. Minimum withdrawal is ₵10. No withdrawal fees. Your earnings are available immediately after transactions complete.",
  },
  {
    id: "wallet-2",
    category: "Wallet & Payments",
    question: "Are my wallet funds secure?",
    answer:
      "Completely secure. Your wallet is tied to your registered phone number and password. All transactions are encrypted. You control withdrawal timing and amounts. DataFlex never has direct access to your MoMo account - we process withdrawals securely through approved channels.",
  },
  {
    id: "wallet-3",
    category: "Wallet & Payments",
    question: "Can I track all my earnings and transactions?",
    answer:
      "Yes. Your dashboard shows complete earnings breakdown: pending commissions, confirmed payments, paid-out amounts, earnings by service type, and monthly trends. Export transaction history anytime. Real-time notifications alert you when commissions are credited.",
  },
  {
    id: "wallet-4",
    category: "Wallet & Payments",
    question: "What payment methods does DataFlex accept?",
    answer:
      "Currently, withdrawals are via MTN Mobile Money (MoMo). We're adding additional payment methods including AirtelTigo Money, Telecel Cash, and bank transfers. Check back regularly for updates on new payment options.",
  },
  {
    id: "support-1",
    category: "Support & Help",
    question: "How do I contact customer support?",
    answer:
      "24/7 support available via: WhatsApp (+233242799990), Phone (+233242799990), Email (support@dataflexghana.com). We respond to WhatsApp within 5 minutes during business hours. Our support team can help with technical issues, payment problems, or service questions.",
  },
  {
    id: "support-2",
    category: "Support & Help",
    question: "What should I do if a payment is delayed?",
    answer:
      "If a commission isn't credited within 48 hours, contact support immediately with your transaction ID. We investigate delays and resolve them quickly. Most delays are due to network issues resolved within hours. Our support team ensures you get paid for all verified transactions.",
  },
  {
    id: "support-3",
    category: "Support & Help",
    question: "Are there resources to help me succeed?",
    answer:
      "Yes. We provide: (1) Training guides for each service, (2) Marketing templates and social media content, (3) Promotion tips and best practices, (4) Success stories from top agents, (5) Regular webinars and tutorials, (6) Dedicated support for high-performing agents.",
  },
  {
    id: "support-4",
    category: "Support & Help",
    question: "How often are new services and features added?",
    answer:
      "We add new earning opportunities monthly based on agent feedback and market demand. Recent additions include professional writing services, properties promotion, and expanded digital vouchers. Subscribe to notifications to stay updated on new features and services.",
  },
  {
    id: "terms-1",
    category: "Legal & Terms",
    question: "Where can I find the terms and conditions?",
    answer:
      "Complete terms and conditions are available at /terms. They cover agent responsibilities, commission structure, payment policies, prohibited activities, dispute resolution, and more. Review them before registering as they form the agreement between you and DataFlex.",
  },
  {
    id: "terms-2",
    category: "Legal & Terms",
    question: "What activities are prohibited on DataFlex?",
    answer:
      "Prohibited: fraud, misrepresentation of services, multiple accounts per person, spamming, illegal activities, harassment of customers, and violating third-party rights. Violations result in account suspension or termination. DataFlex takes compliance seriously to protect all users.",
  },
  {
    id: "terms-3",
    category: "Legal & Terms",
    question: "What's DataFlex's refund policy?",
    answer:
      "Refunds depend on service type. Digital products: usually non-refundable after delivery. Physical goods: refundable within 14 days if unused in original packaging. Commissions are non-refundable once credited. Review specific service terms for detailed refund policies.",
  },
  {
    id: "terms-4",
    category: "Legal & Terms",
    question: "How does DataFlex protect my personal information?",
    answer:
      "We use industry-standard encryption for all data. Personal information is never shared with third parties without consent. Financial details are processed securely. You can request data deletion anytime. Review our privacy policy for complete details on data handling and protection.",
  },
  {
    id: "referral-5",
    category: "Referral Program",
    question: "What does 'pending' status mean for my referral earnings?",
    answer:
      "Pending status means your referral has been registered but is awaiting confirmation. During this period, we verify that the referred agent is legitimate and active. Your earnings appear as 'pending' to protect against fraud. Once confirmed (usually within 24-48 hours), it moves to 'confirmed' status and you can see it in your dashboard earnings projections.",
  },
  {
    id: "referral-6",
    category: "Referral Program",
    question: "When do referral credits move from 'confirmed' to 'credited'?",
    answer:
      "Referral credits move from 'confirmed' to 'credited' once the referred agent completes their first transaction or meets platform verification requirements. This typically takes 2-7 days. When status changes to 'credited', the commission is instantly added to your earnings balance and appears in your commission summary on the dashboard.",
  },
  {
    id: "referral-7",
    category: "Referral Program",
    question: "What's the difference between 'credited' and 'paid out' referral status?",
    answer:
      "'Credited' means the commission has been earned and is in your commission balance (not directly spendable from wallet but shown as total commissions). 'Paid out' means you've successfully withdrawn that commission to your MoMo account. You can request withdrawal once earnings are credited.",
  },
  {
    id: "wallet-5",
    category: "Wallet & Payments",
    question: "What's the difference between my 'Total Commissions' and 'Wallet Balance'?",
    answer:
      "Your 'Total Commissions' shows all earnings from referrals, services, and sales that you've earned. Your 'Wallet Balance' shows money you've personally added via topup (not the same as commissions). To withdraw commissions, you request a withdrawal which converts them to 'Available for Withdrawal' status. Wallet balance is for immediate spending on platform services.",
  },
  {
    id: "wallet-6",
    category: "Wallet & Payments",
    question: "Why don't my earned commissions show in my wallet balance?",
    answer:
      "Commissions and wallet balance are separate systems. Commissions are tracked separately to ensure compliance and transparency. When you request a withdrawal of commissions, we process them to your MoMo account. Your wallet balance is for platform topups only. Earned commissions are safe and tracked in real-time in your Commission Summary dashboard section.",
  },
  {
    id: "wallet-7",
    category: "Wallet & Payments",
    question: "How do I withdraw my earned commissions?",
    answer:
      "Navigate to your Commission Summary on the dashboard. Click 'Request Withdrawal' for the amount you want to withdraw. The commission becomes 'pending withdrawal' and is processed within 2-24 hours to your registered MoMo account. You can track withdrawal status in your transaction history. No withdrawal fees are charged.",
  },
  {
    id: "wallet-8",
    category: "Wallet & Payments",
    question: "What happens if my withdrawal fails?",
    answer:
      "If your MoMo withdrawal fails (due to network, wrong number, or account issues), the commission automatically returns to your 'Available for Withdrawal' balance. We'll send you a notification with the failure reason. Retry the withdrawal with a verified MoMo number. Contact support immediately if you need help troubleshooting.",
  },
  {
    id: "support-5",
    category: "Support & Help",
    question: "Why is my referral status not updating?",
    answer:
      "Status updates can take time to appear. Refresh your dashboard or wait 5-10 minutes for real-time updates. If a status seems stuck for more than 24 hours, contact support with your referral ID. Common causes: verification delays, network issues, or duplicate accounts flagged by fraud detection. Our team investigates and notifies you of resolution.",
  },
  {
    id: "support-6",
    category: "Support & Help",
    question: "How do I check the status of my referral payments?",
    answer:
      "View referral status in your Dashboard > Referral Stats section. You'll see: Total referrals, Confirmed referrals, Credited referrals, Paid out commissions, and conversion rate. Click on individual referrals to see their complete journey from pending to credited to paid out. Export detailed reports for record-keeping.",
  },
]

const categories = [
  "Getting Started",
  "Referral Program",
  "GES Approved Books & Education",
  "Job Placement & Referrals",
  "Business Registration & Compliance",
  "Wholesale Shopping",
  "Digital Vouchers & Products",
  "Teaching Platform & Mentorship",
  "Wallet & Payments",
  "Support & Help",
  "Legal & Terms",
]

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>("general-1")
  const [selectedCategory, setSelectedCategory] = useState<string>("Getting Started")
  const [showBackToTop, setShowBackToTop] = useState(false)

  const filteredFAQ = faqData.filter((item) => item.category === selectedCategory)

  const handleScroll = () => {
    if (typeof window !== "undefined") {
      setShowBackToTop(window.scrollY > 300)
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", handleScroll)
  }

  const scrollToCategory = (category: string) => {
    setSelectedCategory(category)
    setExpandedId(faqData.find((item) => item.category === category)?.id || null)

    // Smooth scroll to the questions section
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const questionsContainer = document.getElementById("faq-questions-container")
        if (questionsContainer) {
          questionsContainer.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Everything you need to know about DataFlex Ghana, how to earn, and how to get started
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="default" className="bg-green-600 hover:bg-green-700">
              <Link href="/agent/register">Get Started as Agent</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
            >
              <Link href="/terms">Terms & Conditions</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 px-4">CATEGORIES</h3>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                    selectedCategory === category
                      ? "bg-green-100 text-green-700 border-l-4 border-green-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-sm">{category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div id="faq-questions-container">
              {filteredFAQ.length === 0 ? (
                <Card className="p-8 text-center bg-white">
                  <p className="text-gray-500">No questions found in this category.</p>
                </Card>
              ) : (
                filteredFAQ.map((item) => (
                  <Card
                    key={item.id}
                    className="border border-gray-200 hover:border-green-300 transition-all duration-200 bg-white overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="w-full p-6 flex items-start justify-between gap-4 hover:bg-green-50 transition-colors duration-200 text-left"
                    >
                      <span className="font-semibold text-gray-900 flex-1 text-sm md:text-base">{item.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-green-600 flex-shrink-0 transition-transform duration-300 ${
                          expandedId === item.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedId === item.id && (
                      <CardContent className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">{item.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <Card className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  Still have questions?
                </h3>
                <p className="text-gray-700 mb-6">
                  Our support team is available 24/7 to help answer your questions and guide you through getting started
                  with DataFlex.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">
                      <strong>WhatsApp:</strong> +233242799990
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">
                      <strong>Email:</strong> support@dataflexghana.com
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h3>
                <p className="text-gray-700 mb-6">
                  Join thousands of agents already earning on DataFlex. Start with as little as one service and scale
                  up.
                </p>
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto">
                  <Link href="/agent/register">Register as Agent Now</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>
            For complete platform terms and policies, please visit our{" "}
            <Link href="/terms" className="text-green-600 hover:text-green-700 font-semibold underline">
              Terms and Conditions
            </Link>
            .
          </p>
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </main>
  )
}
