import { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Vidhyaan Pricing — Free School Listing & Admission CRM Plans',
  description:
    'Free forever for school discovery listings. Upgrade to CRM, Fee Management or Enterprise with AI — pricing tailored to your student count. Start a 7-day free trial.',
  alternates: { canonical: 'https://vidhyaan.com/pricing' },
  openGraph: {
    title: 'Vidhyaan Pricing — Free School Listing & Admission CRM Plans',
    description:
      'Free forever for school discovery listings. Upgrade to CRM, Fee Management or Enterprise with AI — pricing tailored to your student count. Start a 7-day free trial.',
    url: 'https://vidhyaan.com/pricing',
  },
}

export default function PricingPage() {
  return <PricingClient />
}
