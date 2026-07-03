import { Metadata } from 'next'
import AdmissionManagementBespokePage from '@/components/marketplace/AdmissionManagementBespokePage'
import { admissionManagementContent } from '@/content/products/admission-management'

export const metadata: Metadata = {
  title: 'Admission Management System for Schools & Junior Colleges in India | Vidhyaan',
  description: 'Run your entire admission process on one platform — customizable pipelines, document collection, and instant conversion to enrolled student. Setup in under 15 minutes.',
  openGraph: {
    title: 'Admission Management System for Schools & Junior Colleges in India | Vidhyaan',
    description: 'Run your entire admission process on one platform — customizable pipelines, document collection, and instant conversion to enrolled student. Setup in under 15 minutes.',
    url: 'https://vidhyaan.com/products/admission-management',
    images: [
      {
        url: 'https://vidhyaan.com/images/products/admission-management-list-screenshot.png',
        width: 1024,
        height: 572,
        alt: 'Vidhyaan Admission Management Pipeline Dashboard displaying stages from applied to verified, interview, and admitted.',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admission Management System for Schools & Junior Colleges in India | Vidhyaan',
    description: 'Run your entire admission process on one platform — customizable pipelines, document collection, and instant conversion to enrolled student. Setup in under 15 minutes.',
    images: ['https://vidhyaan.com/images/products/admission-management-list-screenshot.png'],
  },
  alternates: {
    canonical: 'https://vidhyaan.com/products/admission-management',
  }
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
