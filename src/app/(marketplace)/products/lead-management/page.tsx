import { Metadata } from 'next'
import LeadManagementBespokePage from '@/components/marketplace/LeadManagementBespokePage'
import { leadManagementContent } from '@/content/products/lead-management'

export const metadata: Metadata = {
  title: 'Lead Management Software for Schools & Learning Centers | Vidhyaan',
  description: 'Never lose a parent enquiry again — capture, assign, and follow up on every admission lead in one pipeline. Setup in under 15 minutes.',
}

export default function LeadManagementPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: leadManagementContent.faq.items.map((item) => ({
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
      <LeadManagementBespokePage />
    </>
  )
}
