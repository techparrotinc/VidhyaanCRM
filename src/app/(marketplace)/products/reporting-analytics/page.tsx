import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { reportingAnalyticsContent } from '@/content/products/reporting-analytics'

export const metadata: Metadata = {
  title: 'School Reporting & Analytics Dashboard for Admissions and Fees | Vidhyaan',
  description: 'Live dashboards for admissions performance, fee collection, lead conversion, and campaign engagement — no spreadsheet exports. Included with your Admission CRM.',
}

export default function ReportingAnalyticsPage() {
  return <ProductFeaturePage content={reportingAnalyticsContent} />
}
