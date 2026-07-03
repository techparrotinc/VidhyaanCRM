import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const campaignManagementContent: ProductFeaturePageContent = {
  h1: "WhatsApp & Email Campaign Software for Schools & Learning Centers",
  subhead: "Reach parents where they already are. Send admission reminders, fee due notices, event announcements, or enrollment drives directly from Vidhyaan — using DLT-compliant WhatsApp templates built for the Indian regulatory environment, with delivery tracking on every campaign.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "Free listing forever · Setup in under 15 minutes · No credit card required",
  problem: {
    heading: "Reaching parents shouldn't mean a hundred individual messages",
    body: "Announcing an event, chasing overdue fees, or re-engaging a lead that's gone quiet usually means a staff member manually messaging parents one by one — or worse, not reaching them at all. Vidhyaan's campaign management lets you send one targeted message to exactly the right audience, across WhatsApp, email, or SMS, without leaving the platform."
  },
  capabilities: [
    { title: "DLT-registered WhatsApp templates", body: "Send WhatsApp campaigns using templates registered and approved under India's DLT (Distributed Ledger Technology) regulations — the compliance layer every legitimate bulk WhatsApp sender in India is required to have." },
    { title: "Email and SMS, same platform", body: "Run campaigns across WhatsApp, email, or SMS from the same audience list and interface — no separate tools for each channel." },
    { title: "Audience filtering that actually targets", body: "Filter your audience by grade, admission status, lead status, or custom criteria, so a fee reminder doesn't accidentally go to a parent who's already paid." },
    { title: "Delivery and engagement tracking", body: "See exactly what was sent, delivered, and opened for every campaign — not just a \"sent\" confirmation with no visibility after that." },
    { title: "Scheduled campaigns", body: "Schedule a campaign in advance and it sends automatically at the right time, no one needing to remember to hit send." }
  ],
  howItWorks: {
    heading: "From audience to sent in three steps",
    steps: [
      "Build your audience — filter by grade, status, or custom criteria across your leads and students.",
      "Choose your channel and message — WhatsApp (DLT-approved template), email, or SMS.",
      "Send now or schedule — track delivery and engagement as responses come in."
    ]
  },
  whoThisIsFor: {
    heading: "Same tool, every institution type",
    body: "Campaign Management works identically for Schools, Junior Colleges, Learning Centers, and Coaching Centers — only the audience filter fields differ slightly to match what each institution type actually tracks."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Is WhatsApp campaign sending DLT-compliant?", a: "Yes — all WhatsApp templates go through DLT registration and approval before use, keeping you compliant with Indian telecom regulations." },
      { q: "Can I filter my audience before sending?", a: "Yes — by grade, admission or lead status, or custom criteria, so every campaign reaches exactly the right people." },
      { q: "Can I track whether parents actually received or opened a campaign?", a: "Yes — delivery and engagement tracking is built in for every campaign you send." },
      { q: "How long does it take to set up?", a: "Under 15 minutes — connect your audience filters and send your first campaign the same day." }
    ]
  },
  closingCta: { heading: "Ready to reach parents without the manual work?", body: "Join schools and learning centers already running campaigns on Vidhyaan — free to list, live in under 15 minutes.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Lead Management", href: "/products/lead-management" },
    { text: "Notifications & Alerts", href: "/products/notifications-alerts" },
    { text: "Reports & Analytics", href: "/products/reporting-analytics" }
  ]
}
