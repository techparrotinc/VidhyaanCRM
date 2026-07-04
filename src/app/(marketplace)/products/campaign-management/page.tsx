import { Metadata } from 'next'
import CampaignManagementBespokePage from '@/components/marketplace/CampaignManagementBespokePage'

export const metadata: Metadata = {
  title: 'WhatsApp & Email Campaign Software for Schools & Learning Centers | Vidhyaan',
  description: 'Send targeted WhatsApp, email, and SMS campaigns to parents — DLT-compliant, delivery tracked. Setup in under 15 minutes.',
  openGraph: {
    title: 'WhatsApp & Email Campaign Software for Schools & Learning Centers | Vidhyaan',
    description: 'Send targeted WhatsApp, email, and SMS campaigns to parents — DLT-compliant, delivery tracked. Setup in under 15 minutes.',
    url: 'https://vidhyaan.com/products/campaign-management',
    images: [
      {
        url: 'https://vidhyaan.com/images/products/campaign-management-list-screenshot.png',
        width: 1024,
        height: 1024,
        alt: 'Vidhyaan Campaign management page listing past messages with channel type, sent date, and delivery/engagement analytics bars.',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp & Email Campaign Software for Schools & Learning Centers | Vidhyaan',
    description: 'Send targeted WhatsApp, email, and SMS campaigns to parents — DLT-compliant, delivery tracked. Setup in under 15 minutes.',
    images: ['https://vidhyaan.com/images/products/campaign-management-list-screenshot.png'],
  },
  alternates: {
    canonical: 'https://vidhyaan.com/products/campaign-management',
  }
}

export default function CampaignManagementPage() {
  const faqs = [
    {
      q: "Is WhatsApp campaign sending DLT-compliant?",
      a: "Yes — all WhatsApp templates go through DLT (Distributed Ledger Technology) registration and approval before use, keeping you compliant with Indian telecom regulations."
    },
    {
      q: "Can I filter my audience before sending?",
      a: "Yes — by grade, admission or lead status, or custom criteria, so every campaign reaches exactly the right people."
    },
    {
      q: "Can I track whether parents actually received or opened a campaign?",
      a: "Yes — delivery and engagement tracking is built in for every campaign you send, showing live delivery logs and read receipts."
    },
    {
      q: "How long does it take to set up?",
      a: "Under 15 minutes — connect your audience filters and send your first campaign the same day."
    },
    {
      q: "Is there a limit on how many recipients I can message per campaign?",
      a: "Yes. Monthly campaign sending limits depend on your Vidhyaan plan: the Starter Plan supports up to 500 recipients per month, and the Growth Plan supports up to 5,000 recipients per month. Campaign sending is not available on the Free tier. Additionally, WhatsApp campaigns require the WhatsApp Add-on to be enabled."
    },
    {
      q: "Can I preview a campaign before sending it?",
      a: "Yes. The platform provides a live preview rendering exactly how your WhatsApp, SMS, or email message will appear on parent devices, including dynamic template parameters."
    },
    {
      q: "What happens if a WhatsApp template gets rejected during DLT registration?",
      a: "If a template is rejected by the carrier, Vidhyaan provides the rejection reason and templates editor to modify and resubmit. Our support team can assist in aligning copy to meet DLT/TRAI guidelines."
    },
    {
      q: "Can I reuse a previous campaign as a template for a new one?",
      a: "Yes. You can clone any previous draft, scheduled, or sent campaign with a single click, preserving the audience filters and message template."
    },
    {
      q: "Do parents need to opt in to receive campaigns?",
      a: "Yes. To maintain high deliverability and comply with telecom guidelines, parents must have an active relationship with your institution and not have opted out of communications."
    }
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CampaignManagementBespokePage />
    </>
  )
}
