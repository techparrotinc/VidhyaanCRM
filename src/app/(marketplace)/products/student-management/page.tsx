import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { studentManagementContent } from '@/content/products/student-management'

export const metadata: Metadata = {
  title: 'Student Management System for Schools & Learning Centers | Vidhyaan',
  description: 'Manage your entire student lifecycle in one place — records, guardians, fees, and status, all linked. Setup in under 15 minutes.',
}

export default function StudentManagementPage() {
  return <ProductFeaturePage content={studentManagementContent} />
}
