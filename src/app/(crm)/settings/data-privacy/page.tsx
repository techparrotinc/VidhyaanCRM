import type { Metadata } from 'next'
import { ShieldCheck, Globe2, Landmark } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Data Privacy & Protection | Vidhyaan',
  description:
    'How Vidhyaan handles, protects and processes your organization&apos;s data under Indian (DPDP Act 2023) and global (GDPR and other) data protection frameworks.'
}

const SUPPORT_EMAIL = 'support@vidhyaan.com'
const PRIVACY_EMAIL = 'privacy@vidhyaan.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-sm font-normal leading-relaxed text-slate-600 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-slate-800">{children}</span>
}

export default function DataPrivacySettingsPage() {
  return (
    <div className="flex-1 min-w-0 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#1565D8]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Data Privacy &amp; Protection Policy
        </h1>
      </div>
      <p className="text-sm font-normal leading-relaxed text-slate-500 mb-8">
        This policy explains how Vidhyaan, operated by TECHPARROT INNOVATIONS LLP (Chennai, Tamil
        Nadu, India), handles the data your organization stores on this platform — what we collect,
        where it lives, how it is protected, and the legal frameworks that apply in India and in
        global markets. Every organization using Vidhyaan should read this to understand its own
        responsibilities as well as ours.
      </p>

      <section className="space-y-6">
        <Section title="1. Roles: who is responsible for what">
          <p>
            Data protection law separates the party that decides <em>why and how</em> data is
            processed from the party that processes it on instruction:
          </p>
          <ul>
            <li>
              <Strong>Your organization</Strong> is the <Strong>Data Fiduciary</Strong> (India,
              DPDP Act 2023) / <Strong>Data Controller</Strong> (GDPR) for all records you create
              in the CRM — leads, admissions, students, guardians, fees, attendance and
              communications. You decide what is collected and why.
            </li>
            <li>
              <Strong>Vidhyaan</Strong> is the <Strong>Data Processor</Strong> for that data. We
              process it only to provide the service, on your instructions, under the safeguards
              described here.
            </li>
            <li>
              For platform accounts (staff logins, billing details, usage logs) and the public
              marketplace, <Strong>Vidhyaan is the Data Fiduciary / Controller</Strong>.
            </li>
          </ul>
        </Section>

        <Section title="2. Data your organization stores on Vidhyaan">
          <ul>
            <li>
              <Strong>Prospect &amp; admission data</Strong> — lead names, phone numbers, email
              addresses, enquiry details, application documents.
            </li>
            <li>
              <Strong>Student &amp; guardian data</Strong> — student profiles, class/section or
              course/batch, parent and guardian contact details, household links.
            </li>
            <li>
              <Strong>Financial data</Strong> — fee plans, invoices, payment records, receipts.
            </li>
            <li>
              <Strong>Attendance data</Strong> — daily attendance marks, including biometric-device
              check-in events where you have enabled that integration.
            </li>
            <li>
              <Strong>Communication data</Strong> — emails, SMS and WhatsApp messages sent to
            parents, delivery logs and parent replies.
            </li>
            <li>
              <Strong>Staff data</Strong> — user accounts, roles, teacher assignments and activity
              logs.
            </li>
          </ul>
        </Section>

        <Section title="3. Where your data lives">
          <ul>
            <li>
              <Strong>Primary database:</Strong> PostgreSQL hosted in the{' '}
              <Strong>Singapore (ap-southeast-1)</Strong> region, with application servers
              co-located in Singapore.
            </li>
            <li>
              <Strong>File storage:</Strong> documents, images and uploads are stored in AWS S3 in
              the <Strong>Mumbai (ap-south-1)</Strong> region, India.
            </li>
            <li>
              <Strong>Cache &amp; rate-limiting:</Strong> transient data (sessions, counters) in
              Upstash Redis; no long-term personal records are kept there.
            </li>
          </ul>
          <p>
            Every organization&apos;s data is <Strong>logically isolated by tenant</Strong>: all
            database access is scoped to your organization ID at the data-access layer, enforced
            fail-closed — a query without a tenant scope is rejected rather than allowed.
          </p>
        </Section>

        <Section title="4. How we protect your data">
          <ul>
            <li>
              <Strong>Encryption in transit:</Strong> all traffic is served over TLS (HTTPS).
            </li>
            <li>
              <Strong>Encryption at rest:</Strong> database and file storage are encrypted at rest
              by the underlying cloud providers; payment gateway credentials you store are
              additionally encrypted at the application level.
            </li>
            <li>
              <Strong>Access control:</Strong> role-based access within your workspace; platform
              staff access is restricted, logged and used only for support and operations.
            </li>
            <li>
              <Strong>Authentication:</Strong> OTP + PIN login, optional two-factor authentication
              (authenticator app or SMS) which your organization can make mandatory for all staff
              under Settings → Two-Factor Auth.
            </li>
            <li>
              <Strong>Session security:</Strong> server-side session revocation — sessions can be
              invalidated immediately when a staff member leaves.
            </li>
            <li>
              <Strong>Payment security:</Strong> card and banking details are handled entirely by
              Razorpay (PCI-DSS compliant); Vidhyaan never stores card numbers.
            </li>
            <li>
              <Strong>Backups:</Strong> continuous database backups with point-in-time recovery.
            </li>
          </ul>
        </Section>

        <Section title="5. Sub-processors we use">
          <p>
            We use a small set of contracted service providers, only to run the platform. Each is
            bound to process data solely on our instructions:
          </p>
          <ul>
            <li><Strong>Vercel</Strong> — application hosting (Singapore region)</li>
            <li><Strong>Neon</Strong> — PostgreSQL database (Singapore region)</li>
            <li><Strong>AWS</Strong> — file storage (Mumbai, India)</li>
            <li><Strong>Upstash</Strong> — Redis cache and rate limiting</li>
            <li><Strong>Razorpay</Strong> — payment processing (India)</li>
            <li>
              <Strong>Meta (WhatsApp Business Platform)</Strong>, <Strong>MSG91</Strong> and{' '}
              <Strong>ZeptoMail</Strong> — WhatsApp, SMS and email delivery
            </li>
          </ul>
          <p>
            We do <Strong>not sell personal data</Strong> and we do not share it with third parties
            for their own marketing.
          </p>
        </Section>

        <Section title="6. India — Digital Personal Data Protection Act, 2023 (DPDP)">
          <p>
            The DPDP Act is India&apos;s data protection law. For records in this CRM, your
            organization is the Data Fiduciary and must ensure:
          </p>
          <ul>
            <li>
              <Strong>Lawful purpose &amp; notice:</Strong> collect parent and student data for a
              clear purpose (admission, education, fees) and inform parents what you collect and
              why — your enquiry forms and admission forms should state this.
            </li>
            <li>
              <Strong>Consent:</Strong> obtain verifiable consent from the parent or lawful
              guardian before processing a child&apos;s data. In India, a child is anyone under 18.
            </li>
            <li>
              <Strong>Children&apos;s data restrictions:</Strong> no tracking, behavioural
              monitoring or targeted advertising directed at children. Vidhyaan does not do any of
              these, and you must not use exported data for them either.
            </li>
            <li>
              <Strong>Data minimisation:</Strong> collect only what the admission or education
              purpose needs.
            </li>
            <li>
              <Strong>Accuracy &amp; correction:</Strong> keep records accurate; parents can ask
              you to correct or update their data, and the CRM lets you edit all records.
            </li>
            <li>
              <Strong>Erasure:</Strong> when data is no longer needed for its purpose and no legal
              retention applies, it should be deleted. Deletions in Vidhyaan are soft-deleted
              first, then purged.
            </li>
            <li>
              <Strong>Grievance redressal:</Strong> parents may raise complaints with you first,
              and may escalate to the <Strong>Data Protection Board of India</Strong>.
            </li>
          </ul>
          <p>
            Vidhyaan supports these duties as your processor: tenant isolation, consent-friendly
            digital forms, correction and deletion tooling, WhatsApp opt-out handling (reply STOP),
            and breach notification support (Section 9).
          </p>
        </Section>

        <Section title="7. Global markets — GDPR and other frameworks">
          <p>
            If your organization operates in, or enrols students from, jurisdictions outside India,
            additional frameworks may apply:
          </p>
          <ul>
            <li>
              <Strong>EU / UK — GDPR &amp; UK GDPR:</Strong> you need a lawful basis for each
              processing purpose (typically contract or legitimate interest for admissions, consent
              for marketing), must honour data-subject rights (access, rectification, erasure,
              portability, objection) within one month, and must have a processing agreement with
              your processor. Vidhyaan acts as processor under this policy; contact us for a signed
              Data Processing Agreement (DPA).
            </li>
            <li>
              <Strong>Children under GDPR:</Strong> the age of digital consent is 13–16 depending
              on the member state; parental consent is required below it.
            </li>
            <li>
              <Strong>USA — state privacy laws (CCPA/CPRA and others) and FERPA/COPPA</Strong> for
              educational records and children under 13: honour access/deletion requests and avoid
              &quot;selling&quot; data as those laws define it (Vidhyaan does not sell data).
            </li>
            <li>
              <Strong>Other markets</Strong> (e.g. Singapore PDPA, UAE PDPL, Australia Privacy
              Act): the same core principles apply — purpose limitation, consent, security,
              retention limits and breach notification.
            </li>
          </ul>
          <p>
            <Strong>Cross-border transfers:</Strong> Vidhyaan&apos;s infrastructure is in Singapore
            and India. Under the DPDP Act, transfers are permitted to countries not restricted by
            the Indian government. If you are subject to GDPR, transfers to these regions are
            covered by Standard Contractual Clauses with our sub-processors; request our DPA for
            details.
          </p>
        </Section>

        <Section title="8. Data retention">
          <ul>
            <li>
              <Strong>CRM records</Strong> (leads, admissions, students, fees) — retained while
              your subscription is active and your organization keeps them. You control deletion.
            </li>
            <li>
              <Strong>Billing and tax records</Strong> — retained for the period mandated by Indian
              law (typically 8 years).
            </li>
            <li>
              <Strong>Message logs</Strong> (SMS/WhatsApp/email delivery) — retained up to 24
              months for delivery assurance and dispute resolution.
            </li>
            <li>
              <Strong>After account closure</Strong> — organization data is deleted or irreversibly
              anonymised within 90 days of confirmed closure, except records we must keep by law.
              You may request a full export before closure.
            </li>
          </ul>
        </Section>

        <Section title="9. Breach notification">
          <p>
            If a personal data breach affects your organization&apos;s data, Vidhyaan will notify
            your registered administrators <Strong>without undue delay</Strong> after becoming
            aware, with the nature of the breach, the data affected and the mitigation taken. Under
            the DPDP Act, the Data Fiduciary (your organization) must notify affected individuals
            and the Data Protection Board; under GDPR the controller must notify the supervisory
            authority within 72 hours where required. We will provide the information you need to
            meet those deadlines.
          </p>
        </Section>

        <Section title="10. Rights of parents, students and staff">
          <p>
            Individuals whose data you store can exercise these rights (through you, as the
            fiduciary/controller):
          </p>
          <ul>
            <li><Strong>Access</Strong> — a copy of the data held about them</li>
            <li><Strong>Correction</Strong> — fix inaccurate or outdated records</li>
            <li><Strong>Erasure</Strong> — deletion when no longer required and no legal retention applies</li>
            <li><Strong>Withdrawal of consent</Strong> — for consent-based processing, e.g. marketing messages</li>
            <li><Strong>Opt-out of messaging</Strong> — WhatsApp STOP/START, email unsubscribe links</li>
            <li><Strong>Grievance</Strong> — complaint escalation to the relevant authority (Data Protection Board of India, or the local supervisory authority abroad)</li>
          </ul>
          <p>
            If a request reaches Vidhyaan directly about data your organization controls, we will
            forward it to you and assist with fulfilment.
          </p>
        </Section>

        <Section title="11. Your organization's responsibilities">
          <ul>
            <li>Collect data lawfully and tell parents why you collect it.</li>
            <li>Obtain parental/guardian consent before entering a child&apos;s data.</li>
            <li>Grant staff the minimum role needed; remove accounts of departed staff promptly.</li>
            <li>Enable two-factor authentication — and consider making it mandatory org-wide.</li>
            <li>Keep records accurate and delete data you no longer need.</li>
            <li>Use exports responsibly — once data leaves Vidhyaan, protecting it is on you.</li>
            <li>Use messaging channels for legitimate school communication, honouring opt-outs.</li>
            <li>Report suspected account compromise to us immediately.</li>
          </ul>
        </Section>

        <Section title="12. Contact & requests">
          <p>
            For privacy questions, data export requests, deletion requests or to request a Data
            Processing Agreement:
          </p>
          <ul>
            <li>
              Privacy &amp; data protection: <Strong>{PRIVACY_EMAIL}</Strong>
            </li>
            <li>
              General support: <Strong>{SUPPORT_EMAIL}</Strong>
            </li>
          </ul>
          <p className="text-xs text-slate-400">
            Last updated: 13 July 2026. This page is informational and forms part of Vidhyaan&apos;s
            service terms; it is not a substitute for your organization&apos;s own legal advice.
          </p>
        </Section>
      </section>
    </div>
  )
}
