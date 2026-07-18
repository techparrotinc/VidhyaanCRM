import { Metadata } from 'next'
import ForSchoolsClient from './ForSchoolsClient'

export const metadata: Metadata = {
  title: 'School CRM & Free Marketplace Listing for Institutes',
  description:
    'List your school free on Vidhyaan and manage enquiries, admissions and fees in one CRM. Trusted by schools and learning centres across India. Setup in under 15 minutes.',
  alternates: { canonical: 'https://vidhyaan.com/for-schools' },
  openGraph: {
    title: 'School CRM & Free Marketplace Listing for Institutes',
    description:
      'List your school free on Vidhyaan and manage enquiries, admissions and fees in one CRM. Trusted by schools and learning centres across India. Setup in under 15 minutes.',
    url: 'https://vidhyaan.com/for-schools',
  },
}

export default function ForSchoolsLandingPage() {
  return <ForSchoolsClient />
}
