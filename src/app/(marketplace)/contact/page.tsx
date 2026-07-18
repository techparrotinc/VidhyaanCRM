import { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact Vidhyaan — School Listing & Admission CRM Support',
  description:
    'Need help with your school listing, parent account, or the admission CRM? Contact Vidhyaan support. Located in Chennai, serving institutions and parents pan-India.',
  alternates: { canonical: 'https://vidhyaan.com/contact' },
  openGraph: {
    title: 'Contact Vidhyaan — School Listing & Admission CRM Support',
    description:
      'Need help with your school listing, parent account, or the admission CRM? Contact Vidhyaan support. Located in Chennai, serving institutions and parents pan-India.',
    url: 'https://vidhyaan.com/contact',
  },
}

export default function ContactUsPage() {
  return <ContactClient />
}
