import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const leadManagementContent: ProductFeaturePageContent = {
  accentColor: "indigo",
  h1: "Lead Management Software for Schools & Learning Centers",
  subhead: "Every enquiry — from your website, phone calls, walk-ins, or your free Vidhyaan marketplace listing — captured into one organized pipeline, so no parent enquiry falls through the cracks and no counsellor loses track of a follow-up.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "Free listing forever · Setup in under 15 minutes · No credit card required",
  problem: {
    heading: "A missed follow-up is a lost admission",
    body: "Enquiries come in from everywhere — a phone call to the front desk, a walk-in parent, a form on your website, an enquiry from your marketplace listing — and without a single place to track them, some inevitably get forgotten. Vidhyaan's lead management software puts every enquiry into one pipeline your whole team can see, so a follow-up never depends on one person's memory."
  },
  capabilities: [
    { heading: "Centralized enquiry inbox", title: "One pipeline, every enquiry, no exceptions", body: "Every lead — regardless of source — lands in the same pipeline, tagged with where it came from.", icon: "Inbox" },
    { title: "Counsellor assignment", body: "Assign enquiries to a specific counsellor, manually or automatically, so ownership is always clear.", icon: "UserCheck" },
    { title: "Status tracking that actually reflects reality", body: "Move leads through New, Contacted, Converted, Rejected, or Follow-up status, with color-coded visibility for your whole team at a glance.", icon: "Activity" },
    { title: "Follow-up scheduling", body: "Set a follow-up date on any lead and get a clear view of what's due today — nothing goes cold because no one remembered to check back.", icon: "Calendar" },
    { title: "Complete activity timeline", body: "Every call, note, WhatsApp message, and email tied to a lead is logged in one place — any counsellor can pick up where another left off.", icon: "Clock" },
    { title: "One-click conversion", body: "Convert a qualified lead directly into an admission application (Schools/Junior Colleges) or a student record (Learning Centers/Coaching Centers) — no re-entering the same details in a second system.", icon: "RefreshCw" }
  ],
  howItWorks: {
    heading: "From first enquiry to conversion in four steps",
    steps: [
      "Enquiries flow in automatically from your marketplace listing, website, or are logged manually from a call or walk-in.",
      "Assign to a counsellor instantly, so ownership is clear from the start.",
      "Track every interaction and follow-up in one activity timeline.",
      "Convert to admission or student record with one click once the lead is ready."
    ]
  },
  whoThisIsFor: {
    heading: "Every institution type, from the very first enquiry",
    body: "Lead Management is available to all four institution types — Schools, Junior Colleges, Learning Centers, and Coaching Centers — since every institution needs to capture and track enquiries before anything else happens, regardless of whether a formal admission pipeline follows."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Where do leads actually come from?", a: "Multiple sources feed into the same pipeline: your free Vidhyaan marketplace listing, your website's enquiry form, phone calls, and walk-ins logged manually by your front desk." },
      { q: "Can I assign leads to specific counsellors?", a: "Yes — manually, or set up automatic assignment so new leads route to the right person immediately." },
      { q: "What happens after a lead converts?", a: "For Schools and Junior Colleges, it moves into your Admission Management pipeline. For Learning Centers and Coaching Centers, it converts directly into a Student record, since there's no formal admission stage in between." },
      { q: "How long does it take to set up?", a: "Under 15 minutes — start capturing and tracking enquiries the same day you sign up." }
    ]
  },
  closingCta: { heading: "Ready to stop losing enquiries?", body: "Join schools and learning centers already running their admissions pipeline on Vidhyaan — free to list, live in under 15 minutes.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Admission Management", href: "/products/admission-management" },
    { text: "Student Management", href: "/products/student-management" },
    { text: "Campaign Management", href: "/products/campaign-management" }
  ]
}
