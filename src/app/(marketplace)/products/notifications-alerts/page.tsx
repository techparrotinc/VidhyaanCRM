import { Metadata } from 'next'
import ProductFeaturePage from '@/components/marketplace/ProductFeaturePage'
import { notificationsAlertsContent } from '@/content/products/notifications-alerts'

export const metadata: Metadata = {
  title: 'Automated Notifications & Alerts for Schools & Parents | Vidhyaan',
  description: 'Fee due reminders, admission status updates, and payment confirmations — sent automatically, no manual follow-up. Included with every Vidhyaan CRM.',
}

export default function NotificationsAlertsPage() {
  return <ProductFeaturePage content={notificationsAlertsContent} />
}
