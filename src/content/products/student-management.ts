import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const studentManagementContent: ProductFeaturePageContent = {
  h1: "Student Management System — One Record, Every Detail, Enrollment to Alumni",
  subhead: "A searchable, filterable student database that links directly to admissions and fees — so your team always has the full picture on any student, without digging through separate files or spreadsheets.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "Free listing forever · Setup in under 15 minutes · No credit card required",
  problem: {
    heading: "Student records shouldn't live in three different places",
    body: "A student's admission file, their fee history, and their basic contact details often end up scattered across a register, a spreadsheet, and someone's memory. Vidhyaan's student management system keeps everything on one linked profile — so any staff member can pull up a complete picture in seconds, not after checking three different places."
  },
  capabilities: [
    { title: "Searchable, filterable student database", body: "Find any student instantly by name, grade, or status — no more scrolling through a printed register." },
    { title: "Guardian contact management", body: "Guardian name, phone, and email attached directly to the student record — always up to date, always accessible." },
    { title: "Full lifecycle status tracking", body: "Track every student's real status — Active, Alumni, Transferred, Suspended, or Dropped Out — so your records reflect reality, not just who was ever enrolled." },
    { title: "Linked admission and fee history", body: "Every student profile shows their original admission record and their complete fee/payment history, without needing a second system." },
    { title: "Auto-generated student codes", body: "Every student gets a unique, auto-generated code on enrollment — no manual numbering, no duplicates." },
    { title: "Course enrollment tracking (Learning Centers & Coaching Centers)", body: "For course-based institutions, each student's active course enrollments show directly on their profile, linked to billing." }
  ],
  howItWorks: {
    heading: "From admission to active record in one step",
    steps: [
      "Admitted applicants convert automatically into a full student record — no re-entering the same details.",
      "Guardian details, grade, and status are set once and stay attached to the profile.",
      "Fee and admission history link automatically — nothing to manually connect.",
      "Status updates as reality changes — promote, transfer, or mark alumni with a simple status change."
    ]
  },
  whoThisIsFor: {
    heading: "Every institution type, one student record format",
    body: "Student Management works the same across Schools, Junior Colleges, Learning Centers, and Coaching Centers — the core record is consistent, with course enrollment tracking specifically for institutions that bill by course rather than by term."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Do I have to manually enter students already admitted through Vidhyaan?", a: "No — admitted applicants convert directly into a student record with one click, carrying over their existing details." },
      { q: "Can I see a student's fee history from their profile?", a: "Yes — admission and fee history are linked directly on every student's profile, no separate lookup needed." },
      { q: "What happens to a student's record when they graduate or transfer?", a: "You update their status (Alumni, Transferred, etc.) — the record stays intact and searchable, it doesn't disappear." },
      { q: "How long does it take to set up?", a: "Under 15 minutes — your student database builds itself automatically as admissions convert, with no separate data entry required." }
    ]
  },
  closingCta: { heading: "Ready for one student record instead of three?", body: "Join schools and learning centers already managing their students on Vidhyaan — free to list, live in under 15 minutes.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Admission Management", href: "/products/admission-management" },
    { text: "Fee Management", href: "/products/fee-management" },
    { text: "Course & Batch Management", href: "/products/course-management" }
  ]
}
