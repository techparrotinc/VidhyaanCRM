import { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: "About Vidhyaan — India's School Discovery & Admission CRM Platform",
  description:
    "Vidhyaan connects parents with verified CBSE, ICSE and state-board schools, preschools and learning centres, while giving institutions modern admission and fee management tools.",
  alternates: { canonical: 'https://vidhyaan.com/about' },
  openGraph: {
    title: "About Vidhyaan — India's School Discovery & Admission CRM Platform",
    description:
      "Vidhyaan connects parents with verified CBSE, ICSE and state-board schools, preschools and learning centres, while giving institutions modern admission and fee management tools.",
    url: 'https://vidhyaan.com/about',
  },
}

export default function AboutPage() {
  return <AboutClient />
}
