import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { feeManagementContent } from '@/content/products/fee-management'

export const metadata: Metadata = {
  title: 'Fee Management Software for Schools in India | Razorpay Integrated | Vidhyaan',
  description: "Automate school fee collection with Vidhyaan's fee management software — term & course invoicing, batch billing, and integrated Razorpay payments. Setup in under 15 minutes.",
}

export default function FeeManagementPage() {
  return <ProductFeaturePage content={feeManagementContent} />
}
