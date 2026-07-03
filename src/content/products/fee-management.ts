import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const feeManagementContent: ProductFeaturePageContent = {
  h1: "Fee Management Software for Schools — With Integrated Razorpay Payments",
  subhead: "Stop chasing fee payments manually. Vidhyaan's fee management software automates invoicing, sends payment reminders, and now lets parents pay online directly through Razorpay — with every payment automatically reconciled against the right invoice.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "Free listing forever · Setup in under 15 minutes · No credit card required",
  problem: {
    heading: "Manual fee collection is costing you time you don't have",
    body: "Indian schools and learning centers still lose hours every month to fee collection: generating invoices by hand, following up on WhatsApp for overdue payments, manually reconciling cash and bank transfers against the right student. Vidhyaan's school fee collection software replaces that entire manual cycle with one automated system — from invoice generation to payment to receipt, without your accounts team touching a spreadsheet."
  },
  capabilities: [
    { title: "Flexible fee plans, built for how Indian schools actually bill", body: "Create term-wise fee plans for schools and junior colleges, or course-wise recurring plans for learning centers and coaching centers — with flexible fee heads (tuition, transport, activity fees, and more) that can apply to all terms, a specific term, or a custom schedule you define." },
    { title: "Batch invoice generation", body: "Generate invoices for an entire grade, an entire course, or your whole institution in a single click — instead of creating them one student at a time." },
    { title: "Scheduled & automatic billing", body: "Set up recurring course invoices that generate automatically on a fixed billing cycle, with no manual trigger needed each month." },
    { title: "Integrated Razorpay payments — New", body: "Parents can now pay fees online directly from their portal — UPI, credit/debit cards, net banking, or wallets — with the payment automatically matched and reconciled against the correct invoice. No more manually marking invoices as paid after checking your bank statement." },
    { title: "Real-time payment status tracking", body: "Every invoice shows a live status — Unpaid, Partially Paid, Paid, Overdue, or Waived — so your accounts team always has an accurate, up-to-date view without needing to ask." },
    { title: "Automated payment receipts", body: "Once a payment is recorded (online or offline), a receipt generates automatically — no manual paperwork." }
  ],
  howItWorks: {
    heading: "From invoice to payment in four steps",
    steps: [
      "Set up your fee structure — define fee heads and plans once, per term or per course.",
      "Generate invoices in bulk — for a grade, a course, or your whole institution.",
      "Parents pay online via Razorpay, or you record offline payments (cash, cheque, bank transfer) manually.",
      "Everything reconciles automatically — payment status updates in real time, receipts generate themselves."
    ]
  },
  whoThisIsFor: {
    heading: "Built for every institution type",
    body: "Schools & Junior Colleges get term-based fee plans aligned to your academic calendar. Learning Centers & Coaching Centers get course-based recurring billing that matches how you actually charge for classes."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Does Vidhyaan support online fee payment via Razorpay?", a: "Yes. Vidhyaan integrates directly with Razorpay, so parents can pay school fees online using UPI, cards, net banking, or wallets — with payments automatically reconciled against the correct invoice." },
      { q: "Can I still record offline payments (cash, cheque, bank transfer)?", a: "Yes. Online Razorpay payment is in addition to, not a replacement for, manual payment recording — your accounts team can log any offline payment method directly against an invoice." },
      { q: "Does this work for both schools and learning centers?", a: "Yes. Schools and junior colleges get term-based fee plans; learning centers and coaching centers get course-based recurring billing — the system adapts to your institution type automatically." },
      { q: "How long does it take to set up?", a: "Under 15 minutes — set up your fee structure once and you're ready to start generating invoices the same day." }
    ]
  },
  closingCta: { heading: "Ready to stop chasing fee payments?", body: "Join schools already running their fee collection on Vidhyaan — free to list, live in under 15 minutes.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Admission Management", href: "/products/admission-management" },
    { text: "Parent Portal", href: "/products/parent-portal" },
    { text: "Reports & Analytics", href: "/products/reporting-analytics" }
  ]
}
