import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { courseManagementContent } from '@/content/products/course-management'

export const metadata: Metadata = {
  title: 'Course & Batch Management Software for Learning Centers & Coaching Institutes | Vidhyaan',
  description: 'Manage course catalogs, batch enrollments, and automatic recurring billing — built for learning centers and coaching institutes, not a repurposed school ERP. Setup in under 15 minutes.',
}

export default function CourseManagementPage() {
  return <ProductFeaturePage content={courseManagementContent} />
}
