import { Metadata } from 'next'
import AdmissionManagementBespokePage from '@/components/marketplace/AdmissionManagementBespokePage'
import { admissionManagementContent } from '@/content/products/admission-management'

export const metadata: Metadata = {
  title: 'Admission Management System for Schools & Junior Colleges in India | Vidhyaan',
  description: 'Run your entire admission process on one platform — customizable pipelines, document collection, and instant conversion to enrolled student. Setup in under 15 minutes.',
}

export default function AdmissionManagementPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: admissionManagementContent.faq.items.map((item) => ({
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
      <AdmissionManagementBespokePage />
    </>
  )
}
