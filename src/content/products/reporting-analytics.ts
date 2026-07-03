import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const reportingAnalyticsContent: ProductFeaturePageContent = {
  accentColor: "violet",
  h1: "School Reporting & Analytics Dashboard",
  subhead: "Make decisions backed by real numbers, not gut feel. Vidhyaan's reporting and analytics dashboard gives school leadership a live view of admissions performance, fee collection status, lead conversion rates, and campaign engagement — all in one place, without exporting data into spreadsheets.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "No separate setup · Included with every Vidhyaan CRM",
  problem: {
    heading: "Leadership shouldn't have to ask for a manual count",
    body: "\"How many applications converted this month?\" \"What's our outstanding fee balance?\" \"Which counsellor is closing the most leads?\" — these are questions that usually mean someone on your team stops what they're doing to pull numbers manually. Vidhyaan's reporting dashboard answers them in real time, without anyone needing to compile a report."
  },
  capabilities: [
    { title: "Admissions pipeline performance", body: "See conversion rates and pipeline health at a glance — how many applications are stuck at document verification, how many are ready for interview, how many convert to admitted.", icon: "Activity" },
    { title: "Fee collection overview", body: "A real-time breakdown of paid, unpaid, partially paid, and overdue invoices — no need to cross-reference invoices manually to know your actual collection status.", icon: "PieChart" },
    { title: "Lead source and counsellor performance", body: "See which enquiry sources actually convert, and which counsellors are converting leads fastest — useful for both marketing spend decisions and team performance conversations.", icon: "BarChart" },
    { title: "Campaign delivery and engagement", body: "Delivery and open-rate metrics for every WhatsApp, email, or SMS campaign you've sent, in the same dashboard as the rest of your operational data.", icon: "Mail" }
  ],
  howItWorks: {
    heading: "Populated automatically, no manual reporting",
    steps: [
      "Data flows in automatically as your team uses Lead, Admission, Fee, and Campaign Management.",
      "The dashboard updates in real time — no exporting, no manual compilation.",
      "Leadership gets a live view whenever they need it, without pulling anyone off their actual work to generate a report."
    ]
  },
  whoThisIsFor: {
    heading: "Built for leadership across every institution type",
    body: "Reporting & Analytics is available to Org Admins and Branch Admins across Schools, Junior Colleges, Learning Centers, and Coaching Centers — the specific metrics shown adapt to what's relevant for each institution type (admission pipeline metrics for Schools/JC, enrollment metrics for LC/Coaching)."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Do I have to manually export data to see these reports?", a: "No — the dashboard is live and updates automatically as your team works in the CRM." },
      { q: "What kind of reports are included?", a: "Admissions pipeline performance, fee collection status, lead source and counsellor performance, and campaign delivery/engagement metrics." },
      { q: "Is there a separate setup step for reporting?", a: "No — it's included automatically as part of your Admission CRM, populated by the data already flowing through Lead, Admission, Fee, and Campaign Management." },
      { q: "Does this work the same for Learning Centers as Schools?", a: "The dashboard adapts its metrics to your institution type — admission pipeline data for Schools and Junior Colleges, enrollment and course data for Learning Centers and Coaching Centers." }
    ]
  },
  closingCta: { heading: "Stop asking for manual counts", body: "Join schools and learning centers already making decisions with real-time data on Vidhyaan — included with your Admission CRM.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Admission Management", href: "/products/admission-management" },
    { text: "Fee Management", href: "/products/fee-management" },
    { text: "Campaign Management", href: "/products/campaign-management" }
  ]
}
