import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { leadManagementContent } from '@/content/products/lead-management'

export const metadata: Metadata = {
  title: 'Lead Management Software for Schools & Learning Centers | Vidhyaan',
  description: 'Never lose a parent enquiry again — capture, assign, and follow up on every admission lead in one pipeline. Setup in under 15 minutes.',
}

export default function LeadManagementPage() {
  return <ProductFeaturePage content={leadManagementContent} />
}
