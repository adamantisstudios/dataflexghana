"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import {
  Building2,
  FileCheck,
  RotateCcw,
  PenSquare as PencilSquare,
  Copy,
  ChevronDown,
  AlertCircle,
} from "lucide-react"

interface Service {
  id: string
  name: string
  category: string
  subcategory?: string
  price: number
  description: string
  requiredDocs: string[]
  deliverables: string[]
  icon: React.ReactNode
}

// NEW BUSINESS REGISTRATION SERVICES
const NEW_BUSINESS_SERVICES: Service[] = [
  {
    id: "sole-prop-new",
    name: "Sole Proprietorship",
    category: "new",
    subcategory: "Sole Proprietorship",
    price: 580,
    description: "Register a sole proprietorship business with all required documents and nationwide delivery",
    requiredDocs: [
      "Valid Ghana ID (Ghana Card)",
      "Tax Identification Number (TIN)",
      "Two passport-sized photographs",
      "Certificate of business name availability from RGD",
      "Description of business activities",
      "Proof of business address",
      "Contact phone number and email address",
    ],
    deliverables: [
      "Certificate of Registration",
      "Form A",
      "Free Nationwide Delivery of completed Certificate of Registration and Form A",
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: "llc-new",
    name: "Limited Liability Company (LLC)",
    category: "new",
    subcategory: "Limited Liability Company",
    price: 1930,
    description: "Incorporate a Limited Liability Company with full legal compliance (excludes stated capital)",
    requiredDocs: [
      "Ghana Card and TIN for at least two directors",
      "Details of at least two shareholders",
      "Proof of registered office address",
      "Business name reservation certificate from RGD",
      "Company constitution",
      "Appointment letter for company secretary",
      "Declaration of stated capital",
      "Consent to act as director forms",
    ],
    deliverables: [
      "Certificate of Incorporation",
      "Certificate of Commencement",
      "Company Regulations",
      "Form 3 and Form 4",
      "Free Nationwide Delivery of all completed documents",
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: "guarantee-new",
    name: "Company Limited by Guarantee",
    category: "new",
    subcategory: "Company Limited by Guarantee",
    price: 1444,
    description: "Register a company with limited liability by guarantee structure",
    requiredDocs: [
      "Details of two subscribers or members",
      "Business name reservation certificate from RGD",
      "Proof of registered office address",
      "Document stating company objectives",
      "Ghana Card and TIN for directors/trustees",
      "Company regulations",
      "Signed consent forms from all members",
    ],
    deliverables: [
      "Certificate of Incorporation",
      "Certificate of Commencement",
      "Company Regulations",
      "Form 3B",
      "Free Nationwide Delivery of all completed documents",
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: "subsidiary-new",
    name: "Subsidiary Company Registration",
    category: "new",
    subcategory: "Subsidiary Company",
    price: 730,
    description: "Register a subsidiary company for an existing foreign parent company",
    requiredDocs: [
      "Certificate of incorporation of the foreign parent company",
      "Board resolution from parent company",
      "Name reservation certificate for the subsidiary",
      "Proof of Ghanaian registered office address",
      "Appointment letter for local representative",
      "Audited financial statements of the parent company",
    ],
    deliverables: [
      "Certificate of Registration",
      "Form C",
      "Free Nationwide Delivery of completed Certificate and Form C",
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: "partnership-new",
    name: "Partnership Registration",
    category: "new",
    subcategory: "Partnership",
    price: 1440,
    description: "Register a business partnership with multiple partners",
    requiredDocs: [
      "Partnership deed signed by all partners",
      "Ghana Card and TIN for each partner",
      "Business name reservation certificate from RGD",
      "Description of partnership business activities",
      "Proof of business address",
      "Document stating partnership duration",
      "Capital contribution statement for each partner",
    ],
    deliverables: [
      "Certificate of Registration",
      "Form B",
      "Free Nationwide Delivery of completed Certificate and Form B",
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
]

// RENEWAL / ANNUAL RETURNS SERVICES
const RENEWAL_SERVICES: Service[] = [
  {
    id: "sole-prop-renewal",
    name: "Sole Proprietorship Renewal",
    category: "renewal",
    subcategory: "Sole Proprietorship",
    price: 250,
    description: "Renew sole proprietorship registration for another year with compliance",
    requiredDocs: [
      "Current business registration certificate",
      "Updated business information",
      "Valid Tax Identification Number (TIN)",
      "Completed annual return form",
    ],
    deliverables: [
      "Renewal acknowledgment",
      "Soft copy renewal forms sent via email/WhatsApp for review",
      "Free Nationwide Delivery of completed renewal acknowledgment",
    ],
    icon: <RotateCcw className="w-6 h-6" />,
  },
  {
    id: "llc-renewal",
    name: "Limited Liability Company Annual Return",
    category: "renewal",
    subcategory: "Limited Liability Company",
    price: 730,
    description: "File annual returns and maintain LLC registration compliance",
    requiredDocs: [
      "Updated company details",
      "Audited financial statements",
      "Proof of registered office address",
      "Company secretary details",
      "Board resolution approving financial statements",
      "Previous year's annual return filing receipt",
    ],
    deliverables: [
      "Filing receipt",
      "Soft copy annual return forms (Form 3, Form 4) sent via email/WhatsApp",
      "Free Nationwide Delivery of completed filing receipt",
    ],
    icon: <RotateCcw className="w-6 h-6" />,
  },
  {
    id: "guarantee-renewal",
    name: "Company Limited by Guarantee Annual Return",
    category: "renewal",
    subcategory: "Company Limited by Guarantee",
    price: 730,
    description: "File annual returns for guarantee company compliance",
    requiredDocs: [
      "Annual report of activities",
      "Financial statements",
      "Updated member/director information",
      "Registered office confirmation",
      "Resolution approving submission",
    ],
    deliverables: [
      "Filing receipt",
      "Soft copy renewal forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed filing receipt",
    ],
    icon: <RotateCcw className="w-6 h-6" />,
  },
  {
    id: "subsidiary-renewal",
    name: "Subsidiary Company Annual Return",
    category: "renewal",
    subcategory: "Subsidiary Company",
    price: 420,
    description: "File annual returns for subsidiary company compliance",
    requiredDocs: [
      "Authorization from parent company",
      "Local office address confirmation",
      "Details of local representative",
      "Parent company's current registration status",
    ],
    deliverables: [
      "Filing receipt",
      "Soft copy renewal forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed filing receipt",
    ],
    icon: <RotateCcw className="w-6 h-6" />,
  },
  {
    id: "partnership-renewal",
    name: "Partnership Annual Return",
    category: "renewal",
    subcategory: "Partnership",
    price: 400,
    description: "Renew partnership registration annually with updated information",
    requiredDocs: [
      "Updated partnership information",
      "Current details of all partners",
      "Business address confirmation",
      "Partnership tax clearance certificate",
    ],
    deliverables: [
      "Renewal acknowledgment",
      "Soft copy renewal forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed renewal acknowledgment",
    ],
    icon: <RotateCcw className="w-6 h-6" />,
  },
]

// AMENDMENTS SERVICES
const AMENDMENT_SERVICES: Service[] = [
  {
    id: "sole-prop-name-change",
    name: "Sole Proprietorship - Change of Name",
    category: "amendment",
    subcategory: "Sole Proprietorship",
    price: 440,
    description: "Change business name for sole proprietorship with RGD registration",
    requiredDocs: [
      "Current business registration certificate",
      "New name availability certificate from RGD",
      "Ghana Card of proprietor",
      "Completed Form 11",
    ],
    deliverables: [
      "Updated Certificate of Registration",
      "Soft copy Form 11 sent via email/WhatsApp for review",
      "Free Nationwide Delivery of updated Certificate of Registration",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "sole-prop-nature-change",
    name: "Sole Proprietorship - Change of Business Nature",
    category: "amendment",
    subcategory: "Sole Proprietorship",
    price: 440,
    description: "Update business nature or activities for sole proprietorship",
    requiredDocs: [
      "Current registration certificate",
      "Detailed description of new business activities",
      "Completed Form 11",
    ],
    deliverables: [
      "Updated Form A",
      "Soft copy Form 11 sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form A",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "sole-prop-contact-change",
    name: "Sole Proprietorship - Change of Contact Details",
    category: "amendment",
    subcategory: "Sole Proprietorship",
    price: 440,
    description: "Update contact information or address for sole proprietorship",
    requiredDocs: ["Current registration certificate", "Proof of new address", "Completed Form 11"],
    deliverables: [
      "Updated Form A",
      "Soft copy Form 11 sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form A",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "sole-prop-ownership-change",
    name: "Sole Proprietorship - Change of Ownership",
    category: "amendment",
    subcategory: "Sole Proprietorship",
    price: 540,
    description: "Transfer business ownership to another person",
    requiredDocs: [
      "Signed transfer agreement",
      "Ghana Cards of both parties",
      "Current business registration certificate",
      "Tax clearance certificates for both parties",
    ],
    deliverables: [
      "New Certificate of Registration",
      "Soft copy transfer forms sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Registration",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-name-change",
    name: "Limited Liability Company - Change of Name",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 1020,
    description: "Change company name for LLC with shareholder approval",
    requiredDocs: [
      "Board resolution approving name change",
      "Special resolution signed by shareholders",
      "New name availability certificate from RGD",
      "Current certificate of incorporation",
      "Amended company regulations",
    ],
    deliverables: [
      "New Certificate of Incorporation",
      "Soft copy special resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Incorporation",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-nature-change",
    name: "Limited Liability Company - Change of Business Nature",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 620,
    description: "Amend company objectives and business scope",
    requiredDocs: [
      "Board resolution approving change",
      "Amended company regulations",
      "Current registration documents",
      "Detailed description of new business scope",
    ],
    deliverables: [
      "Updated company documents",
      "Soft copy amendment forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated company documents",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-contact-change",
    name: "Limited Liability Company - Change of Contact Details",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 550,
    description: "Update registered office address or contact information",
    requiredDocs: [
      "Board resolution approving address change",
      "Proof of new address",
      "Current certificate of incorporation",
    ],
    deliverables: [
      "Updated Form 4",
      "Soft copy Form 4 sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form 4",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-auditor-change",
    name: "Limited Liability Company - Change of Auditors",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 550,
    description: "Appoint new auditors for the company",
    requiredDocs: [
      "Board resolution appointing new auditors",
      "Consent letter from new auditors",
      "Resignation letter from previous auditors",
      "Current auditor registration details",
    ],
    deliverables: [
      "Completed filing acknowledgment",
      "Soft copy resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed filing acknowledgment",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-director-change",
    name: "Limited Liability Company - Change of Directors/Secretary",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 560,
    description: "Update directors or company secretary",
    requiredDocs: [
      "Board resolution for the change",
      "Consent to act as director/secretary forms",
      "Resignation letters from outgoing persons",
      "Ghana Card and TIN of new appointees",
      "Completed Form 3",
    ],
    deliverables: [
      "Updated Form 3",
      "Soft copy Form 3 sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of updated Form 3",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-capital-increase",
    name: "Limited Liability Company - Increased Stated Capital",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 1460,
    description: "Increase company stated capital (excludes stated capital amount)",
    requiredDocs: [
      "Special resolution approving capital increase",
      "Amended company regulations",
      "Director declaration of increased capital",
      "Bank statement showing capital injection",
      "Updated shareholder register",
    ],
    deliverables: [
      "Updated Regulations and Form 4",
      "Soft copy special resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Regulations and Form 4",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "llc-share-transfer",
    name: "Limited Liability Company - Transfer of Shares",
    category: "amendment",
    subcategory: "Limited Liability Company",
    price: 1770,
    description: "Transfer shares between shareholders",
    requiredDocs: [
      "Share transfer forms signed by transferor and transferee",
      "Board resolution approving transfer",
      "Directors' consent to transfer",
      "Original share certificates",
      "Updated shareholder register",
    ],
    deliverables: [
      "Completed share certificates and updated register",
      "Soft copy share transfer forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed share certificates and updated register",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "guarantee-name-change",
    name: "Company Limited by Guarantee - Change of Name",
    category: "amendment",
    subcategory: "Company Limited by Guarantee",
    price: 720,
    description: "Change company name for guarantee company",
    requiredDocs: [
      "Special resolution approving name change",
      "New name availability certificate from RGD",
      "Current certificate of incorporation",
      "Amended regulations",
    ],
    deliverables: [
      "New Certificate of Incorporation",
      "Soft copy resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Incorporation",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "guarantee-objectives-change",
    name: "Company Limited by Guarantee - Change of Objectives",
    category: "amendment",
    subcategory: "Company Limited by Guarantee",
    price: 130,
    description: "Amend company objectives and mission statement",
    requiredDocs: [
      "Special resolution changing objectives",
      "Amended company regulations",
      "Document stating new objectives",
    ],
    deliverables: [
      "Updated Regulations",
      "Soft copy resolution and amended regulations sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Regulations",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "guarantee-contact-change",
    name: "Company Limited by Guarantee - Change of Contact Details",
    category: "amendment",
    subcategory: "Company Limited by Guarantee",
    price: 560,
    description: "Update registered office address or contact information",
    requiredDocs: ["Board resolution approving change", "Proof of new address", "Current registration documents"],
    deliverables: [
      "Updated Form 3B",
      "Soft copy update forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form 3B",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "guarantee-auditor-change",
    name: "Company Limited by Guarantee - Change of Auditors",
    category: "amendment",
    subcategory: "Company Limited by Guarantee",
    price: 550,
    description: "Appoint new auditors for the guarantee company",
    requiredDocs: [
      "Board resolution appointing new auditors",
      "Consent letter from new auditors",
      "Resignation letter from previous auditors",
    ],
    deliverables: [
      "Completed filing acknowledgment",
      "Soft copy resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed filing acknowledgment",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "guarantee-director-change",
    name: "Company Limited by Guarantee - Change of Directors/Secretary",
    category: "amendment",
    subcategory: "Company Limited by Guarantee",
    price: 560,
    description: "Update directors or company secretary",
    requiredDocs: [
      "Board resolution for the change",
      "Consent letters from new appointees",
      "Resignation letters",
      "Ghana Card and TIN of new appointees",
    ],
    deliverables: [
      "Updated Form 3B",
      "Soft copy update forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form 3B",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "guarantee-subscriber-change",
    name: "Company Limited by Guarantee - Change of Subscriber",
    category: "amendment",
    subcategory: "Company Limited by Guarantee",
    price: 620,
    description: "Add or remove members/subscribers",
    requiredDocs: [
      "Board resolution approving change",
      "Details of new subscribers",
      "Consent letters from new subscribers",
    ],
    deliverables: [
      "Updated member register",
      "Soft copy resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated member register",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "subsidiary-name-change",
    name: "Subsidiary Company - Change of Name",
    category: "amendment",
    subcategory: "Subsidiary Company",
    price: 520,
    description: "Change subsidiary company name with parent authorization",
    requiredDocs: [
      "Parent company resolution authorizing name change",
      "New name availability certificate from RGD",
      "Current registration certificate",
      "Updated subsidiary documents",
    ],
    deliverables: [
      "New Certificate of Registration",
      "Soft copy resolution and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Registration",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "subsidiary-nature-change",
    name: "Subsidiary Company - Change of Business Nature",
    category: "amendment",
    subcategory: "Subsidiary Company",
    price: 520,
    description: "Update subsidiary business activities",
    requiredDocs: [
      "Parent company authorization letter",
      "Updated business description document",
      "Board resolution from subsidiary",
      "Current registration documents",
    ],
    deliverables: [
      "Updated Form C",
      "Soft copy amendment forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form C",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "subsidiary-contact-change",
    name: "Subsidiary Company - Change of Contact Details",
    category: "amendment",
    subcategory: "Subsidiary Company",
    price: 450,
    description: "Update subsidiary contact address or information",
    requiredDocs: ["Parent company resolution", "Proof of new address", "Current registration certificate"],
    deliverables: [
      "Updated Form C",
      "Soft copy update forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form C",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "partnership-name-change",
    name: "Partnership - Change of Name",
    category: "amendment",
    subcategory: "Partnership",
    price: 660,
    description: "Change partnership business name",
    requiredDocs: [
      "Amended partnership agreement",
      "New name availability certificate from RGD",
      "Current registration certificate",
      "Written consent of all partners",
    ],
    deliverables: [
      "New Certificate of Registration",
      "Soft copy amended deed and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Registration",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "partnership-nature-change",
    name: "Partnership - Change of Business Nature",
    category: "amendment",
    subcategory: "Partnership",
    price: 510,
    description: "Update partnership business activities",
    requiredDocs: [
      "Updated partnership deed",
      "Current registration certificate",
      "Detailed description of new business activities",
    ],
    deliverables: [
      "Updated partnership documents",
      "Soft copy amended deed sent via email/WhatsApp",
      "Free Nationwide Delivery of updated partnership documents",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "partnership-contact-change",
    name: "Partnership - Change of Contact Details",
    category: "amendment",
    subcategory: "Partnership",
    price: 510,
    description: "Update partnership address or contact information",
    requiredDocs: ["Partnership resolution", "Proof of new address", "Current registration documents"],
    deliverables: [
      "Updated Form B",
      "Soft copy update forms sent via email/WhatsApp",
      "Free Nationwide Delivery of updated Form B",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "partnership-member-change",
    name: "Partnership - Change of Partners",
    category: "amendment",
    subcategory: "Partnership",
    price: 720,
    description: "Add or remove partners from the partnership",
    requiredDocs: [
      "New partnership deed including all partners",
      "Resignation letters from outgoing partners",
      "Admission letters for new partners",
      "Ghana Cards of all partners",
      "Tax clearance certificates from GRA",
      "Current registration certificate",
    ],
    deliverables: [
      "New Certificate of Registration",
      "Soft copy new partnership deed sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Registration",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "special-resolution-name",
    name: "Special Resolution - Change of Name",
    category: "amendment",
    subcategory: "Special Resolutions",
    price: 710,
    description: "Apply special resolution for company name change",
    requiredDocs: [
      "Special resolution certificate",
      "Name availability certificate from RGD",
      "Current registration documents",
      "Amended company regulations",
    ],
    deliverables: [
      "New Certificate of Incorporation",
      "Soft copy resolution sent via email/WhatsApp",
      "Free Nationwide Delivery of new Certificate of Incorporation",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "special-resolution-nature",
    name: "Special Resolution - Update of Business Nature",
    category: "amendment",
    subcategory: "Special Resolutions",
    price: 520,
    description: "Apply special resolution for business scope changes",
    requiredDocs: [
      "Special resolution document",
      "Updated company objectives document",
      "Board minutes approving change",
    ],
    deliverables: [
      "Updated company documents",
      "Soft copy resolution sent via email/WhatsApp",
      "Free Nationwide Delivery of updated company documents",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
  {
    id: "special-resolution-transfer",
    name: "Special Resolution - Deed of Transfer",
    category: "amendment",
    subcategory: "Special Resolutions",
    price: 1660,
    description: "Apply special resolution for company ownership transfer",
    requiredDocs: [
      "Signed transfer deed",
      "Board resolution approving transfer",
      "Share transfer documents",
      "Updated shareholder register",
    ],
    deliverables: [
      "Completed and stamped Deed of Transfer",
      "Soft copy deed and forms sent via email/WhatsApp",
      "Free Nationwide Delivery of completed and stamped Deed of Transfer",
    ],
    icon: <PencilSquare className="w-6 h-6" />,
  },
]

// REPLACEMENTS / RE-PRINTS SERVICES
const REPLACEMENT_SERVICES: Service[] = [
  {
    id: "sole-prop-cert-replacement",
    name: "Sole Proprietorship - Certificate of Registration Replacement",
    category: "replacement",
    subcategory: "Sole Proprietorship",
    price: 420,
    description: "Replace lost or damaged Certificate of Registration",
    requiredDocs: [
      "Police extract for lost documents",
      "Sworn affidavit explaining loss",
      "Business registration number",
      "Ghana Card of proprietor",
      "Written request for replacement",
    ],
    deliverables: [
      "Reprinted Certificate of Registration",
      "Soft copy affidavit draft sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "sole-prop-form-a-replacement",
    name: "Sole Proprietorship - Form A Replacement",
    category: "replacement",
    subcategory: "Sole Proprietorship",
    price: 360,
    description: "Replace lost or damaged Form A",
    requiredDocs: [
      "Police extract for lost documents",
      "Sworn affidavit",
      "Business registration number",
      "Ghana Card of proprietor",
      "Completed Form A application",
    ],
    deliverables: [
      "Reprinted Form A",
      "Soft copy Form A sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of reprinted Form A",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "llc-cert-inc-replacement",
    name: "Limited Liability Company - Certificate of Incorporation Replacement",
    category: "replacement",
    subcategory: "Limited Liability Company",
    price: 360,
    description: "Replace lost or damaged Certificate of Incorporation",
    requiredDocs: [
      "Police report for lost certificate",
      "Sworn affidavit",
      "Company registration number",
      "Ghana Card of director",
      "Board resolution authorizing replacement",
      "Company letterhead request",
    ],
    deliverables: [
      "Reprinted Certificate of Incorporation",
      "Soft copy affidavit and resolution drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "llc-cert-comm-replacement",
    name: "Limited Liability Company - Certificate of Commencement Replacement",
    category: "replacement",
    subcategory: "Limited Liability Company",
    price: 360,
    description: "Replace lost or damaged Certificate of Commencement",
    requiredDocs: [
      "Police report for lost certificate",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Ghana Card of authorized representative",
    ],
    deliverables: [
      "Reprinted Certificate of Commencement",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "llc-regulations-replacement",
    name: "Limited Liability Company - Regulations Replacement",
    category: "replacement",
    subcategory: "Limited Liability Company",
    price: 360,
    description: "Replace lost or damaged Company Regulations",
    requiredDocs: [
      "Police report for lost regulations",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Ghana Card of authorized signatory",
    ],
    deliverables: [
      "Reprinted Company Regulations",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Regulations",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "llc-form-3-replacement",
    name: "Limited Liability Company - Form 3 Replacement",
    category: "replacement",
    subcategory: "Limited Liability Company",
    price: 360,
    description: "Replace lost or damaged Form 3",
    requiredDocs: [
      "Police report for lost form",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Director and secretary details",
    ],
    deliverables: [
      "Reprinted Form 3",
      "Soft copy Form 3 sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of reprinted Form 3",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "llc-form-4-replacement",
    name: "Limited Liability Company - Form 4 Replacement",
    category: "replacement",
    subcategory: "Limited Liability Company",
    price: 360,
    description: "Replace lost or damaged Form 4",
    requiredDocs: [
      "Police report for lost form",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Director and shareholder details",
    ],
    deliverables: [
      "Reprinted Form 4",
      "Soft copy Form 4 sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of reprinted Form 4",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "guarantee-cert-inc-replacement",
    name: "Company Limited by Guarantee - Certificate of Incorporation Replacement",
    category: "replacement",
    subcategory: "Company Limited by Guarantee",
    price: 360,
    description: "Replace lost or damaged Certificate of Incorporation",
    requiredDocs: [
      "Police report for lost certificate",
      "Sworn affidavit",
      "Company registration number",
      "Ghana Card of trustee",
      "Board resolution authorizing replacement",
    ],
    deliverables: [
      "Reprinted Certificate of Incorporation",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "guarantee-cert-comm-replacement",
    name: "Company Limited by Guarantee - Certificate of Commencement Replacement",
    category: "replacement",
    subcategory: "Company Limited by Guarantee",
    price: 360,
    description: "Replace lost or damaged Certificate of Commencement",
    requiredDocs: [
      "Police report for lost certificate",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Ghana Card of authorized person",
    ],
    deliverables: [
      "Reprinted Certificate of Commencement",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "guarantee-regulations-replacement",
    name: "Company Limited by Guarantee - Regulations Replacement",
    category: "replacement",
    subcategory: "Company Limited by Guarantee",
    price: 360,
    description: "Replace lost or damaged Company Regulations",
    requiredDocs: [
      "Police report for lost regulations",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Ghana Card of authorized signatory",
    ],
    deliverables: [
      "Reprinted Company Regulations",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Regulations",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "guarantee-form-3b-replacement",
    name: "Company Limited by Guarantee - Form 3B Replacement",
    category: "replacement",
    subcategory: "Company Limited by Guarantee",
    price: 360,
    description: "Replace lost or damaged Form 3B",
    requiredDocs: [
      "Police report for lost form",
      "Sworn affidavit",
      "Company registration number",
      "Board resolution",
      "Director and secretary details",
    ],
    deliverables: [
      "Reprinted Form 3B",
      "Soft copy Form 3B sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of reprinted Form 3B",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "subsidiary-cert-replacement",
    name: "Subsidiary Company - Certificate of Registration Replacement",
    category: "replacement",
    subcategory: "Subsidiary Company",
    price: 360,
    description: "Replace lost or damaged Certificate of Registration",
    requiredDocs: [
      "Police report for lost certificate",
      "Sworn affidavit",
      "Subsidiary registration number",
      "Parent company authorization letter",
      "Ghana Card of local representative",
    ],
    deliverables: [
      "Reprinted Certificate of Registration",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "subsidiary-form-c-replacement",
    name: "Subsidiary Company - Form C Replacement",
    category: "replacement",
    subcategory: "Subsidiary Company",
    price: 360,
    description: "Replace lost or damaged Form C",
    requiredDocs: [
      "Police report for lost form",
      "Sworn affidavit",
      "Subsidiary registration number",
      "Parent company resolution",
      "Ghana Card of authorized representative",
    ],
    deliverables: [
      "Reprinted Form C",
      "Soft copy Form C sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of reprinted Form C",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "partnership-cert-replacement",
    name: "Partnership - Certificate of Registration Replacement",
    category: "replacement",
    subcategory: "Partnership",
    price: 360,
    description: "Replace lost or damaged Certificate of Registration",
    requiredDocs: [
      "Police report for lost certificate",
      "Sworn affidavit",
      "Partnership registration number",
      "Ghana Cards of all partners",
      "Partnership resolution",
    ],
    deliverables: [
      "Reprinted Certificate of Registration",
      "Soft copy required drafts sent via email/WhatsApp",
      "Free Nationwide Delivery of reprinted Certificate",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
  {
    id: "partnership-form-b-replacement",
    name: "Partnership - Form B Replacement",
    category: "replacement",
    subcategory: "Partnership",
    price: 360,
    description: "Replace lost or damaged Form B",
    requiredDocs: [
      "Police report for lost form",
      "Sworn affidavit",
      "Partnership registration number",
      "Written consent of all partners",
      "Ghana Cards of partners",
    ],
    deliverables: [
      "Reprinted Form B",
      "Soft copy Form B sent via email/WhatsApp for completion",
      "Free Nationwide Delivery of reprinted Form B",
    ],
    icon: <Copy className="w-6 h-6" />,
  },
]

const ALL_SERVICES = [...NEW_BUSINESS_SERVICES, ...RENEWAL_SERVICES, ...AMENDMENT_SERVICES, ...REPLACEMENT_SERVICES]

const CATEGORIES = [
  { id: "new", label: "Registration", icon: <Building2 className="w-4 h-4" /> },
  { id: "renewal", label: "Renewals", icon: <RotateCcw className="w-4 h-4" /> },
  { id: "amendment", label: "Amendments", icon: <PencilSquare className="w-4 h-4" /> },
  { id: "replacement", label: "Replacements", icon: <Copy className="w-4 h-4" /> },
]

interface SelectedService {
  service: Service
  customerName: string
  customerPhone: string
  customerEmail: string
}

export function BusinessRegistrationForm() {
  const [activeCategory, setActiveCategory] = useState("new")
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null)
  const [expandedService, setExpandedService] = useState<string | null>(null)

  const categoryServices = ALL_SERVICES.filter((s) => s.category === activeCategory)

  const handleSelectService = (service: Service) => {
    setSelectedService({
      service,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    const { service, customerName, customerPhone, customerEmail } = selectedService

    const requiredDocsText = service.requiredDocs.map((doc, i) => `${i + 1}. ${doc}`).join("\n")
    const deliverablesText = service.deliverables.map((item, i) => `${i + 1}. ${item}`).join("\n")

    const message = `🏢 BUSINESS REGISTRATION SERVICE REQUEST

📋 SERVICE: ${service.name}
💰 COST: ₵${service.price.toFixed(2)}

👤 CUSTOMER DETAILS:
Name: ${customerName}
Phone: ${customerPhone}
Email: ${customerEmail}

📄 REQUIRED DOCUMENTS:
${requiredDocsText}

✅ DELIVERABLES:
${deliverablesText}

📞 CONTACT US:
WhatsApp: +233 242 799990
Business Hours: 9:00 AM - 9:30 PM

Please confirm receipt and let us know if you need any clarifications.`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
    setSelectedService(null)
  }

  return (
    <section id="business-registration" className="py-12 md:py-16 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Business Registration Services</h2>
          <p className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto">
            Complete business registration, renewals, amendments, and document replacements for all business types.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {!selectedService ? (
            <>
              {/* Category Tabs (Mobile: Horizontal Scroll) */}
              <Tabs
                defaultValue="new"
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="mb-6 md:mb-8"
              >
                <TabsList className="flex overflow-x-auto pb-2 w-full bg-white p-1 rounded-lg shadow gap-2 justify-start scroll-ml-4">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="min-w-[120px] flex items-center justify-center gap-2
                                data-[state=active]:bg-slate-900 data-[state=active]:text-white
                                text-sm py-2 px-3 rounded whitespace-nowrap"
                    >
                      {cat.icon}
                      <span className="font-medium">{cat.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {CATEGORIES.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id}>
                    <div className="grid gap-4">
                      {categoryServices.map((service) => (
                        <Card
                          key={service.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow border-slate-200"
                          onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                        >
                          <CardHeader className="pb-2 px-4">
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                              {/* Icon/Image on the Left */}
                              <div className="flex-shrink-0 bg-slate-100 p-3 rounded-lg">
                                {service.icon}
                              </div>

                              {/* Text and CTA on the Right */}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg font-semibold text-slate-900">
                                  {service.name}
                                </CardTitle>
                                {service.subcategory && (
                                  <p className="text-sm text-slate-500 mt-1">
                                    {service.subcategory}
                                  </p>
                                )}
                                <p className="text-sm text-slate-600 mt-2">
                                  {service.description}
                                </p>
                              </div>

                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold text-slate-900">₵{service.price}</p>
                                <p className="text-xs text-slate-500">Service fee</p>
                              </div>
                            </div>
                          </CardHeader>

                          {expandedService === service.id && (
                            <CardContent className="space-y-4 border-t border-slate-200 pt-4 px-4">
                              {/* Required Documents */}
                              <div>
                                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4 text-amber-600" />
                                  Required Documents
                                </h4>
                                <ul className="space-y-1.5 pl-4">
                                  {service.requiredDocs.map((doc, idx) => (
                                    <li key={idx} className="flex gap-2 text-sm text-slate-700">
                                      <span>•</span>
                                      <span>{doc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Deliverables */}
                              <div>
                                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                  <FileCheck className="w-4 h-4 text-green-600" />
                                  What You Get
                                </h4>
                                <ul className="space-y-1.5 pl-4">
                                  {service.deliverables.map((item, idx) => (
                                    <li key={idx} className="flex gap-2 text-sm text-slate-700">
                                      <span className="text-green-600 font-bold">✓</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <Button
                                onClick={(e) => { e.stopPropagation(); handleSelectService(service); }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 text-sm font-medium"
                              >
                                Request This Service
                              </Button>
                            </CardContent>
                          )}

                          <div className="px-4 py-2 border-t border-slate-200 flex justify-center">
                            <ChevronDown
                              className={`w-4 h-4 text-slate-600 transition-transform ${expandedService === service.id ? "rotate-180" : ""}`}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : (
            /* Service Request Form */
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-slate-900 text-white rounded-t-lg p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-2xl break-words">{selectedService.service.name}</CardTitle>
                <p className="text-slate-300 text-base sm:text-lg mt-2">Cost: ₵{selectedService.service.price}</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Service Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-6 space-y-4">
                    <h4 className="font-semibold text-slate-900 text-base sm:text-lg">Service Summary</h4>
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-xs sm:text-base">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Required Documents
                      </h5>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        {selectedService.service.requiredDocs.map((doc, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-700">
                            <span className="flex-shrink-0">•</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-xs sm:text-base">
                        <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Deliverables
                      </h5>
                      <ul className="space-y-1 text-xs sm:text-sm">
                        {selectedService.service.deliverables.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-700">
                            <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Customer Details Form */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 mb-4 text-base sm:text-lg">Your Details</h4>
                    <div>
                      <Label htmlFor="name" className="text-slate-900 text-sm sm:text-base">
                        Full Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={selectedService.customerName}
                        onChange={(e) => setSelectedService({ ...selectedService, customerName: e.target.value })}
                        required
                        className="mt-2 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-slate-900 text-sm sm:text-base">
                        Phone Number <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={selectedService.customerPhone}
                        onChange={(e) => setSelectedService({ ...selectedService, customerPhone: e.target.value })}
                        required
                        className="mt-2 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-slate-900 text-sm sm:text-base">
                        Email Address <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={selectedService.customerEmail}
                        onChange={(e) => setSelectedService({ ...selectedService, customerEmail: e.target.value })}
                        required
                        className="mt-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold"
                    >
                      Send Request via WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedService(null)}
                      className="w-full py-4 sm:py-6 text-base sm:text-lg"
                    >
                      Back to Services
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}