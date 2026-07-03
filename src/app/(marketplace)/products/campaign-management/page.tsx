import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { campaignManagementContent } from '@/content/products/campaign-management'

export const metadata: Metadata = {
  title: 'WhatsApp & Email Campaign Software for Schools & Learning Centers | Vidhyaan',
  description: 'Send targeted WhatsApp, email, and SMS campaigns to parents — DLT-compliant, delivery tracked, audience filtered by grade or status. Setup in under 15 minutes.',
}

export default function CampaignManagementPage() {
  return <ProductFeaturePage content={campaignManagementContent} />
}
