import { Metadata } from 'next'
import CompareClient from './CompareClient'

export const metadata: Metadata = {
  title: 'Compare Schools Side by Side — Fees, Boards & Facilities',
  description:
    'Compare up to three schools side by side — fees, boards, facilities, ratings and admission status — and pick the right school for your child.',
  alternates: { canonical: 'https://vidhyaan.com/schools/compare' },
  openGraph: {
    title: 'Compare Schools Side by Side — Fees, Boards & Facilities',
    description:
      'Compare up to three schools side by side — fees, boards, facilities, ratings and admission status — and pick the right school for your child.',
    url: 'https://vidhyaan.com/schools/compare',
  },
}

export default function CompareSchoolsPage() {
  return <CompareClient />
}
