import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { admissionManagementContent } from '@/content/products/admission-management'

export const metadata: Metadata = {
  title: 'Admission Management System for Schools & Junior Colleges in India | Vidhyaan',
  description: 'Run your entire admission process on one platform — customizable pipelines, document collection, and instant conversion to enrolled student. Setup in under 15 minutes.',
}

export default function AdmissionManagementPage() {
  return <ProductFeaturePage content={admissionManagementContent} />
}
