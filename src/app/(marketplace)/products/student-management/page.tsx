import { Metadata } from 'next'
import StudentManagementBespokePage from '@/components/marketplace/StudentManagementBespokePage'

export const metadata: Metadata = {
  title: 'Student Management System for Schools & Learning Centers | Vidhyaan',
  description: 'Manage your entire student lifecycle in one place — records, guardians, fees, and status, all linked. Setup in under 15 minutes.',
  openGraph: {
    title: 'Student Management System for Schools & Learning Centers | Vidhyaan',
    description: 'Manage your entire student lifecycle in one place — records, guardians, fees, and status, all linked. Setup in under 15 minutes.',
    url: 'https://vidhyaan.com/products/student-management',
    images: [
      {
        url: 'https://vidhyaan.com/images/products/student-management-list-screenshot.png',
        width: 1024,
        height: 572,
        alt: 'Vidhyaan Student Management dashboard list view showing filter tabs, search criteria, student codes, names, grades, and lifecycle status pills.',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Management System for Schools & Learning Centers | Vidhyaan',
    description: 'Manage your entire student lifecycle in one place — records, guardians, fees, and status, all linked. Setup in under 15 minutes.',
    images: ['https://vidhyaan.com/images/products/student-management-list-screenshot.png'],
  },
  alternates: {
    canonical: 'https://vidhyaan.com/products/student-management',
  }
}

export default function StudentManagementPage() {
  const faqs = [
    {
      q: "Can I bulk-import existing student records?",
      a: "Yes. You can import your entire roster at once by uploading an Excel or CSV file. Standard formatting templates are provided in the student panel, allowing you to match names, roll numbers, and parent contacts in under 5 minutes."
    },
    {
      q: "What happens to a student's record if they're re-admitted after leaving?",
      a: "When a student is marked as Transferred or Alumni, their record is preserved in the database. If they return, you can search for their historic code and toggle their status back to Active. This avoids duplicate profile creation while maintaining their original timeline."
    },
    {
      q: "Can guardians update their own contact details?",
      a: "Yes. Once guardians are granted access to the Parent Portal, they can update their phone numbers and emails. Any modifications trigger a counsellor dashboard alert, and update the student profile log automatically."
    },
    {
      q: "Is there an audit log of changes to a student's record?",
      a: "Yes. Every profile edit — including counsellor notes, document attachments, and status modifications — is recorded chronologically in the Activity Log tab. It tracks the username of the staff member who made the modification."
    },
    {
      q: "Can I export student data?",
      a: "Yes. Staff with ORG_ADMIN credentials can export the student database to standard CSV or Excel files. You can choose to export the entire list or apply filter queries to isolate specific grades or statuses."
    },
    {
      q: "How secure is parent and student PII?",
      a: "PII is protected in compliance with India's Digital Personal Data Protection (DPDP) Act, 2023. Student databases are isolated by organization, and user access is governed by strict role-based controls."
    },
    {
      q: "Can teachers edit student profiles?",
      a: "Only staff with ORG_ADMIN or BRANCH_ADMIN roles can modify core profile parameters, student codes, or status fields. Staff with the TEACHER role are restricted to viewing student rosters and marking attendance logs."
    },
    {
      q: "Does the system support custom fields for school-specific data?",
      a: "Yes. Admins can define custom fields in Settings — such as blood group, bus route ID, or medical conditions. These parameters appear automatically as additional fields on every student profile form."
    },
    {
      q: "Are student codes generated per branch or organization-wide?",
      a: "Student codes are generated organization-wide to ensure global uniqueness. Each code uses standard format STU-YYYY-XXXXX, where YYYY represents the entry academic year, followed by an auto-incrementing integer."
    }
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StudentManagementBespokePage />
    </>
  )
}
