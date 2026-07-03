import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const notificationsAlertsContent: ProductFeaturePageContent = {
  accentColor: "amber",
  h1: "Automated Notifications & Alerts — No Manual Follow-Up Required",
  subhead: "Fee due reminders, admission status changes, payment confirmations — Vidhyaan sends them automatically, the moment they happen, across WhatsApp, SMS, or email. Your staff shouldn't have to remember to notify a parent; the system already did.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  trustLine: "No separate setup · Included with every Vidhyaan CRM",
  problem: {
    heading: "\"Did anyone tell the parent?\" shouldn't be a real question",
    body: "Fee due dates get missed because no one sent a reminder. Parents call asking about admission status because no one updated them. These aren't campaign moments — they're routine, predictable events that should notify themselves. Vidhyaan's automated notifications handle exactly that, so your staff isn't the bottleneck for routine communication."
  },
  capabilities: [
    { title: "Fee due reminders", body: "Sent automatically as a due date approaches — no staff member needs to remember or trigger it.", icon: "Calendar" },
    { title: "Admission status alerts", body: "The moment an applicant's stage changes — moved to interview, admitted, waitlisted — the parent is notified automatically.", icon: "Activity" },
    { title: "Payment confirmations", body: "Parents get instant confirmation the moment a payment is recorded, online or offline.", icon: "CheckSquare" },
    { title: "Secure OTP delivery", body: "Login and verification codes delivered instantly via SMS or WhatsApp as part of Vidhyaan's authentication flow.", icon: "KeyRound" },
    { title: "Multi-channel delivery", body: "Alerts go out via WhatsApp, SMS, or email depending on what's configured for your institution — using the same DLT-compliant infrastructure as your campaigns.", icon: "MessageSquare" }
  ],
  howItWorks: {
    heading: "Set up once, runs on its own",
    steps: [
      "Set up Fee Management and Admission Management as you normally would.",
      "Notification triggers are already built in — no separate configuration step.",
      "Events happen — a due date approaches, a status changes, a payment is recorded.",
      "The parent is notified automatically, the moment it happens."
    ]
  },
  whoThisIsFor: {
    heading: "Active for every institution type, automatically",
    body: "Notifications & Alerts work the same across Schools, Junior Colleges, Learning Centers, and Coaching Centers — since they're triggered by events that exist in every institution type (fees, admissions, payments), not a feature you turn on separately."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "How is this different from Campaign Management?", a: "Campaigns are messages you create and choose to send — an event announcement, a fee reminder you write yourself. Notifications & Alerts are automatic, triggered by real events in the system (a due date, a status change, a payment) with no message-writing or manual sending involved." },
      { q: "Which channels are used for notifications?", a: "WhatsApp, SMS, or email, depending on what's configured for your institution — using the same compliant delivery infrastructure as the rest of Vidhyaan." },
      { q: "Do I need to set anything up separately?", a: "No — notifications are automatically active as part of Fee Management and Admission Management. There's no separate module to configure." }
    ]
  },
  closingCta: { heading: "Let the system handle routine communication", body: "Join schools and learning centers already running automated notifications on Vidhyaan — included with every CRM, no setup required.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Fee Management", href: "/products/fee-management" },
    { text: "Admission Management", href: "/products/admission-management" },
    { text: "Campaign Management", href: "/products/campaign-management" }
  ]
}
