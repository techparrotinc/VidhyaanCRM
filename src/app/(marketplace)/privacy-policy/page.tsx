import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import MarketplaceHeader from '@/components/MarketplaceHeader'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vidhyaan',
  description:
    'How Vidhyaan collects, uses, shares and protects personal data across the school discovery marketplace and the admission CRM used by institutions.'
}

const SUPPORT_EMAIL = 'support@vidhyaan.com'

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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#1565D8]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        </div>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mb-10">
          Vidhyaan is operated by TECHPARROT INNOVATIONS LLP (&quot;Vidhyaan&quot;, &quot;we&quot;,
          &quot;us&quot;), Chennai, Tamil Nadu, India. This policy explains what personal data we
          collect, why, who we share it with and the choices you have. It applies to the Vidhyaan
          marketplace (vidhyaan.com), the parent portal and the Vidhyaan CRM used by schools,
          learning centres, coaching institutes and colleges (&quot;institutions&quot;).
        </p>

        <section className="space-y-6">
          <Section title="1. Data we collect">
            <p><span className="font-semibold text-slate-800">From parents and visitors:</span></p>
            <ul>
              <li>Account details — name, mobile number, email address</li>
              <li>Enquiry and application details, including your child&apos;s name, age and the class or course sought</li>
              <li>Reviews, ratings, bookmarks and messages you submit</li>
              <li>Approximate location when you use distance-based school search (only with your browser&apos;s permission)</li>
              <li>Device and usage data — IP address, browser type, pages visited (analytics and security logs)</li>
            </ul>
            <p><span className="font-semibold text-slate-800">From institutions using the CRM:</span></p>
            <ul>
              <li>Staff account details — name, phone, email, role</li>
              <li>Institution profile, billing and GST details</li>
              <li>Records the institution stores in the CRM — leads, admissions, student and fee records. For this data the institution is the data fiduciary and Vidhyaan acts as its processor.</li>
            </ul>
          </Section>

          <Section title="2. How we use data">
            <ul>
              <li>Connecting parents with institutions — delivering enquiries and applications you choose to submit</li>
              <li>Operating the CRM — admission pipelines, fee management, reports for institutions</li>
              <li>Sending service communications — OTPs, enquiry acknowledgements, admission updates, fee reminders and event notices via SMS, email and WhatsApp</li>
              <li>Billing, invoicing and fraud prevention</li>
              <li>Improving the product through aggregated, de-identified analytics</li>
            </ul>
            <p>
              We do <span className="font-semibold">not</span> sell personal data, and we do not use
              children&apos;s data for advertising or profiling.
            </p>
          </Section>

          <Section title="3. WhatsApp, SMS and email communications">
            <p>
              Institutions may send you transactional updates (enquiry confirmations, admission
              status, fee reminders, event notices) through Vidhyaan&apos;s messaging channels,
              including the WhatsApp Business Platform. Message delivery metadata (sent, delivered,
              read) is processed to operate these channels reliably.
            </p>
            <p>
              You can stop WhatsApp messages at any time by replying{' '}
              <span className="font-mono font-semibold">STOP</span> to any message (reply{' '}
              <span className="font-mono font-semibold">START</span> to resume), and unsubscribe
              from emails using the link in each email.
            </p>
          </Section>

          <Section title="4. Who we share data with">
            <ul>
              <li><span className="font-semibold text-slate-800">Institutions you contact:</span> your enquiry or application (including your child&apos;s details) is shared with the specific institution you selected — that is the purpose of the service.</li>
              <li><span className="font-semibold text-slate-800">Service providers</span> (bound by contract, used only to run the platform): cloud hosting and database (Vercel, AWS, Neon), payment processing (Razorpay), messaging (Meta WhatsApp Business Platform, MSG91, ZeptoMail), caching (Upstash).</li>
              <li><span className="font-semibold text-slate-800">Legal:</span> where required by Indian law, court order or to protect users&apos; safety.</li>
            </ul>
            <p>We never publish your contact details on public profiles or share them with unrelated third parties for marketing.</p>
          </Section>

          <Section title="5. Children's data">
            <p>
              Vidhyaan accounts are created by adults (parents, guardians and institution staff).
              Children&apos;s details entered during an enquiry or admission are provided by the
              parent or guardian, used solely for that admission purpose, and shared only with the
              institution concerned. We comply with the Digital Personal Data Protection Act, 2023
              requirements on children&apos;s data, including the prohibition on tracking,
              behavioural monitoring and targeted advertising directed at children.
            </p>
          </Section>

          <Section title="6. Data retention">
            <ul>
              <li>Account data — retained while your account is active</li>
              <li>Enquiries and applications — retained while relevant to the admission process and for the institution&apos;s statutory record-keeping</li>
              <li>Billing and tax records — retained for the period mandated by Indian law</li>
              <li>Message logs — retained for up to 24 months for delivery assurance and dispute resolution</li>
            </ul>
            <p>
              You can request earlier deletion at any time — see our{' '}
              <Link href="/data-deletion" className="text-sm font-semibold text-[#1565D8]">Data Deletion Instructions</Link>.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              Data is encrypted in transit (TLS) and sensitive credentials are encrypted at rest.
              Access within institutions is role-based; every organisation&apos;s data is isolated
              from every other&apos;s. Payment card details never touch our servers — payments are
              processed by Razorpay, a PCI-DSS compliant gateway.
            </p>
          </Section>

          <Section title="8. Your rights">
            <p>Under the Digital Personal Data Protection Act, 2023 you may:</p>
            <ul>
              <li>Request access to the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion (see <Link href="/data-deletion" className="text-sm font-semibold text-[#1565D8]">Data Deletion Instructions</Link>)</li>
              <li>Withdraw consent to optional communications at any time</li>
              <li>Nominate a person to exercise these rights on your behalf</li>
            </ul>
            <p>
              To exercise any right, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-semibold text-[#1565D8]">{SUPPORT_EMAIL}</a>.
              We respond within 30 days.
            </p>
          </Section>

          <Section title="9. Grievance officer & contact">
            <p>
              Grievance Officer, TECHPARROT INNOVATIONS LLP<br />
              B 4, Jayagopal Flat, Balakrishnan Street, Nanmangallam, Chennai, Tamil Nadu 600117, India<br />
              Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-semibold text-[#1565D8]">{SUPPORT_EMAIL}</a>
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this policy as the product evolves. Material changes are announced on
              this page and, where appropriate, by email. Continued use of Vidhyaan after an update
              constitutes acceptance of the revised policy.
            </p>
          </Section>
        </section>

        <p className="text-xs font-normal text-slate-400 mt-10">
          Last updated: 11 July 2026 · See also{' '}
          <Link href="/terms-of-service" className="text-[#1565D8] font-semibold">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/data-deletion" className="text-[#1565D8] font-semibold">Data Deletion Instructions</Link>
        </p>
      </main>

      <footer className="bg-slate-900 text-white py-8 px-6 text-center">
        <p className="text-sm font-medium text-slate-300">
          © {new Date().getFullYear()} Vidhyaan · TECHPARROT INNOVATIONS LLP
        </p>
      </footer>
    </div>
  )
}
