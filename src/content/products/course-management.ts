import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const courseManagementContent: ProductFeaturePageContent = {
  h1: "Course & Batch Management for Learning Centers & Coaching Institutes",
  subhead: "Purpose-built for how learning centers, coaching institutes, and activity classes actually operate — course catalogs, one-click enrollment, and automatic recurring billing, without the admission-pipeline clutter a school-first ERP forces on you.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "Free listing forever · Setup in under 15 minutes · No credit card required",
  problem: {
    heading: "Generic school ERPs don't fit how learning centers actually run",
    body: "Most school management software is built admission-pipeline-first — application stages, document verification, interview scheduling — none of which matches how a dance academy, coaching institute, or STEM class actually enrolls a student. Vidhyaan's course and batch management is built the other way around: course catalog first, enrollment second, billing automatic — the workflow you actually need, not the one a generic ERP assumes you want."
  },
  capabilities: [
    { title: "Custom course catalog", body: "Set up your courses — Carnatic Vocal, Robotics, Bharatanatyam, NEET Coaching, whatever you teach — each with its own pricing and billing frequency (one-time, monthly, quarterly, half-yearly, or custom)." },
    { title: "One-click student enrollment", body: "Enroll a student into a course directly from their profile, with the first invoice generated automatically the moment they're enrolled — no separate manual billing step." },
    { title: "Automatic recurring billing", body: "Set a billing frequency once and invoices generate on schedule going forward — monthly course fees don't need a manual trigger every month." },
    { title: "Per-course invoice history", body: "See every invoice tied to a specific course, or deep-link from a student's enrollment straight to their fee history for that course." },
    { title: "Default course templates by category", body: "Starting categories — Music, Dance, Art, Abacus, Coaching, Sports, Language, STEM, and more — give you a working course catalog from day one, which you can fully customize afterward." }
  ],
  howItWorks: {
    heading: "From course catalog to first invoice in three steps",
    steps: [
      "Set up your course catalog — name, price, and billing frequency for each course you offer.",
      "Enroll students with one click from their profile — the first invoice generates automatically.",
      "Billing continues on schedule — recurring invoices generate themselves based on the frequency you set, no manual repeat work."
    ]
  },
  whoThisIsFor: {
    heading: "Built specifically for Learning Centers and Coaching Centers",
    body: "Course & Batch Management is available for Learning Centers and Coaching Centers — institutions that enroll students by course rather than through a formal admission pipeline. Schools and Junior Colleges use Vidhyaan's term-based Fee Management instead, matching how they actually bill."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Can I set different billing frequencies for different courses?", a: "Yes — each course can be one-time, monthly, quarterly, half-yearly, or a custom frequency you define, independent of any other course you offer." },
      { q: "Does enrolling a student automatically create an invoice?", a: "Yes — the first invoice generates the moment a student is enrolled, and recurring invoices continue automatically based on the course's billing frequency." },
      { q: "Do I have to build my course catalog from scratch?", a: "No — Vidhyaan seeds a starting catalog based on your center's category (Music, Dance, Art, Coaching, and more), which you can edit, remove, or add to freely." },
      { q: "Does this work for schools too, or just learning centers?", a: "This is specific to Learning Centers and Coaching Centers. Schools and Junior Colleges use term-based Fee Management, since their billing structure works differently." }
    ]
  },
  closingCta: { heading: "Ready for software built for how you actually teach?", body: "Join learning centers and coaching institutes already running their enrollments on Vidhyaan — free to list, live in under 15 minutes.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Student Management", href: "/products/student-management" },
    { text: "Fee Management", href: "/products/fee-management" },
    { text: "Lead Management", href: "/products/lead-management" }
  ]
}
