import { Metadata } from 'next'
import LeadManagementBespokePage from '@/components/marketplace/LeadManagementBespokePage'

export const metadata: Metadata = {
  title: 'Lead Management Software for Schools & Learning Centers | Vidhyaan',
  description: 'Never lose a parent enquiry again — capture, assign, and follow up on every admission lead in one pipeline. Setup in under 15 minutes.',
}

export default function LeadManagementPage() {
  return <LeadManagementBespokePage />
}
