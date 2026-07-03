import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const parentPortalContent: ProductFeaturePageContent = {
  h1: "Parent Portal — Track Applications, Pay Fees & Get Updates, All in One Place",
  subhead: "One login for everything a parent needs. Whether your child's application is still under review or they're already enrolled and you need to pay this term's fees, Vidhyaan's Parent Portal gives you real-time visibility — automatically, for every school, junior college, learning center, and coaching center on the platform.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "No app download required · No separate setup · Included automatically",
  problem: {
    heading: "Parents shouldn't need three different ways to stay informed",
    body: "Checking on an admission application means one phone call. Checking a fee balance means another. Getting a payment receipt reprinted means a third. Vidhyaan's Parent Portal replaces all of it with one login — whether a parent is waiting to hear back on an application or already has a child enrolled and paying fees, everything lives in the same place."
  },
  capabilities: [
    { title: "Track your application status", body: "See exactly where your child's admission application stands — submitted, under review, admitted, waitlisted, or rejected — without calling the school for an update." },
    { title: "Real-time fee visibility", body: "Once enrolled, parents see exactly what's due, what's been paid, and their full payment history — no waiting on a call-back from your accounts team." },
    { title: "Pay fees directly, via Razorpay", body: "One-tap online payment — UPI, cards, net banking, or wallets — reconciled instantly against the right invoice." },
    { title: "Automatic receipts", body: "Every payment, online or offline, generates a receipt parents can access anytime." },
    { title: "Instant notifications", body: "Application status changes, fee due reminders, and payment confirmations reach parents automatically — no manual follow-up required from your staff." },
    { title: "One login, every stage", body: "The same portal works whether a parent has a child with a pending application, an already-enrolled child, or both at once — no separate logins depending on where each child is in the process." }
  ],
  howItWorks: {
    heading: "From application to enrolled and beyond",
    steps: [
      "Parent logs in with their mobile number and OTP.",
      "Sees a single dashboard — active applications and enrolled children together, whichever applies.",
      "Tracks application status, or views and pays fees for an enrolled child.",
      "Gets notified automatically at every stage — no need to check back manually."
    ]
  },
  whoThisIsFor: {
    heading: "Works the same across every institution type and every stage",
    body: "The Parent Portal is available to every Vidhyaan parent — whether their child has an application in progress or is already enrolled — at Schools, Junior Colleges, Learning Centers, and Coaching Centers alike. It's tied to the parent's account, not a single institution type or a single stage of the journey."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Can I track my child's admission application here too?", a: "Yes. The same portal shows both active applications and enrolled children, so you don't need separate logins depending on where your child is in the process." },
      { q: "Does the Parent Portal require a separate app download?", a: "No. It works directly in the browser via mobile OTP login — nothing to install." },
      { q: "Can parents pay fees directly through the portal?", a: "Yes, via integrated Razorpay — UPI, cards, net banking, or wallets." },
      { q: "Do I need to set anything up for parents to use this?", a: "No. The Parent Portal is available automatically as soon as your school or learning center is live on Vidhyaan." },
      { q: "Does this work for learning centers and coaching centers, not just schools?", a: "Yes — the Parent Portal works identically across all institution types." }
    ]
  },
  closingCta: { heading: "One login, everything a parent needs", body: "Join institutions already using Vidhyaan's Parent Portal to cut down front-desk calls and keep parents informed automatically — free to list, no setup required.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Admission Management", href: "/products/admission-management" },
    { text: "Fee Management", href: "/products/fee-management" },
    { text: "Notifications & Alerts", href: "/products/notifications-alerts" }
  ]
}
