import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { parentPortalContent } from '@/content/products/parent-portal'

export const metadata: Metadata = {
  alternates: { canonical: 'https://vidhyaan.com/products/parent-portal' },
  title: 'Parent Portal for Schools & Learning Centers | Track Applications & Pay Fees | Vidhyaan',
  description: "One login for everything — track your child's admission application, pay fees online, and get real-time updates. No app download, no separate setup.",
}

export default function ParentPortalPage() {
  return <ProductFeaturePage content={parentPortalContent} />
}
