import { ProductFeaturePageContent } from '@/components/marketplace/ProductFeaturePage'

export const admissionManagementContent: ProductFeaturePageContent = {
  accentColor: "purple",
  h1: "Admission Management System for Schools & Junior Colleges",
  subhead: "Replace registers and spreadsheets with a real admission management system, built for how Indian schools and junior colleges actually admit students — from application received to admitted, waitlisted, or rejected, with nothing falling through the cracks.",
  primaryCta: { text: "Claim Your Free Profile", href: "/register-school" },
  secondaryCta: { text: "See it in action", href: "#how-it-works" },
  trustLine: "Free listing forever · Setup in under 15 minutes · No credit card required",
  problem: {
    heading: "Admission season shouldn't mean chaos",
    body: "Every admission cycle, counsellors juggle paper applications, WhatsApp threads, and Excel trackers to know who's applied, who's been contacted, and who's still waiting on a document. Applicants get lost between desks. Follow-ups get missed. Vidhyaan's admission management system puts every applicant in one pipeline your whole team can see — so nothing depends on one counsellor's memory. For example, if an applicant's TC or mark sheet is pending, your team shouldn't have to scan through personal chat histories to find if the parent sent it."
  },
  capabilities: [
    { title: "Fully customizable admission stages", body: "Define the exact stages your school uses — application received, document verification, interview scheduled, admitted, waitlisted, rejected — and move applicants through them with a simple stage change, not a re-entered spreadsheet row. This gives your admin team real-time clarity on how many seats are committed at any moment.", icon: "Settings" },
    { title: "Document collection, built in", body: "Parents and counsellors upload required documents directly against each applicant's record — no more chasing certificates over email or WhatsApp with no central place to store them. Eliminating manual validation files prevents verification delays during peak enrollment season.", icon: "FileText" },
    { title: "Complete activity timeline", body: "Every call, note, WhatsApp message, and email tied to an applicant is logged in one place — any counsellor can pick up where another left off without asking \"what's the status on this one?\" This ensures transparent tracking even during holiday staff rotations.", icon: "Clock" },
    { title: "One-click conversion to enrolled student", body: "Once an applicant is admitted, convert them directly into a full student record — no re-entering the same name, grade, and guardian details a second time in a separate system. Automated data rollover eliminates transcription mistakes and saves hours of entry labor.", icon: "UserCheck" },
    { title: "Pipeline visibility for leadership", body: "See conversion rates and pipeline health at a glance — how many applications are stuck at document verification, how many are ready for interview, how many convert to admitted — without asking your admissions team for a manual count. Leadership gets immediate visibility to adjust enrollment campaigns and balance batches.", icon: "BarChart" }
  ],
  howItWorks: {
    heading: "From application to enrolled student in four steps",
    steps: [
      "Enquiries convert to applications — leads from your marketplace listing or other sources move into the admission pipeline with one click.",
      "Move applicants through your stages — document verification, interview, decision — updated as they progress.",
      "Collect documents and log every interaction directly against the applicant's record.",
      "Convert admitted applicants to enrolled students instantly, with no duplicate data entry."
    ]
  },
  whoThisIsFor: {
    heading: "Built for Schools and Junior Colleges",
    body: "Admission Management is available for Schools and Junior Colleges, where a formal application-to-enrollment pipeline reflects how admissions actually work. Learning Centers and Coaching Centers skip this entirely — they move straight from lead to enrolled student, since course-based enrollment doesn't need an admission pipeline. Vidhyaan adapts automatically based on your institution type. For first-time administrators and school owners, this removes the need for complex, enterprise-grade ERP setups, providing a lightweight yet robust pipeline that works immediately."
  },
  faq: {
    heading: "FAQ",
    items: [
      { q: "Can I customize the admission stages to match my school's actual process?", a: "Yes. Stages are fully configurable — add, remove, or reorder them to match exactly how your school runs admissions, rather than forcing your process into a fixed template." },
      { q: "What happens to documents once an applicant is admitted?", a: "They stay attached to the applicant's record and carry over when the applicant is converted to a full student profile — nothing needs to be re-uploaded." },
      { q: "Does this work for Learning Centers or Coaching Centers?", a: "No — Admission Management is specific to Schools and Junior Colleges. Learning Centers and Coaching Centers use a simpler lead-to-student flow without a formal admission pipeline, since that matches how they actually enroll students." },
      { q: "How long does it take to set up?", a: "Under 15 minutes — define your stages once and your admissions team can start using the pipeline the same day." },
      { q: "Can I reorder or rename stages after I've started using them?", a: "Yes. Stages can be renamed, reordered, or added at any time from the workflow settings dashboard. Existing applicants will adapt to the new stage names automatically without losing their timeline history." },
      { q: "What happens if an applicant is rejected then reapplies later?", a: "You can reopen their original application record or create a new application under the same parent contact. The system will group both records under the same guardian profile, maintaining a clear historical timeline." },
      { q: "Can multiple counsellors work the same pipeline?", a: "Yes. Multiple staff members can access the pipeline with role-based permissions. They can view, edit, assign, or add call logs and comments, with all actions audited and attributed to the specific user." },
      { q: "Is there an audit trail of who changed an applicant's stage?", a: "Yes. Every status change, assignment update, and document upload is logged in the applicant's activity timeline, showing exactly who performed the action and when." },
      { q: "Can I export the admission pipeline data?", a: "Yes. You can export the entire admissions database or filtered lists as a CSV file with a single click, making it easy to generate offline sheets or share analytics with the board." }
    ]
  },
  closingCta: { heading: "Ready to run admissions without the chaos?", body: "Join schools already running their admission pipeline on Vidhyaan — free to list, live in under 15 minutes.", ctaText: "Claim Your Free Profile", ctaHref: "/register-school" },
  relatedLinks: [
    { text: "Lead Management", href: "/products/lead-management" },
    { text: "Student Management", href: "/products/student-management" },
    { text: "Reports & Analytics", href: "/products/reporting-analytics" }
  ]
}
