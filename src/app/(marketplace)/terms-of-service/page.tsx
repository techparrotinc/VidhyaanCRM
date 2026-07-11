import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import MarketplaceHeader from '@/components/MarketplaceHeader'

export const metadata: Metadata = {
  title: 'Terms of Service | Vidhyaan',
  description:
    'Terms governing the use of the Vidhyaan marketplace by parents and the Vidhyaan CRM by schools, learning centres, coaching institutes and colleges.'
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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#1565D8]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        </div>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mb-10">
          These terms are an agreement between you and TECHPARROT INNOVATIONS LLP
          (&quot;Vidhyaan&quot;, &quot;we&quot;, &quot;us&quot;), Chennai, Tamil Nadu, India. By
          using vidhyaan.com, the parent portal or the Vidhyaan CRM you accept them. If you use
          Vidhyaan on behalf of an institution, you confirm you are authorised to bind that
          institution.
        </p>

        <section className="space-y-6">
          <Section title="1. The service">
            <ul>
              <li><span className="font-semibold text-slate-800">Marketplace:</span> free discovery of schools, learning centres, coaching institutes and colleges; enquiries, applications, reviews and bookmarks for parents.</li>
              <li><span className="font-semibold text-slate-800">CRM:</span> subscription software for institutions — lead and admission management, student records, fee management, campaigns, reports and messaging add-ons.</li>
            </ul>
            <p>
              Vidhyaan is a platform. Institutions are independent entities; we do not guarantee
              admission outcomes, seat availability, fee amounts or the accuracy of information
              institutions publish, and an enquiry does not create any obligation on either side.
            </p>
          </Section>

          <Section title="2. Accounts">
            <ul>
              <li>You must provide accurate details and keep your phone number and email current.</li>
              <li>Keep your login credentials and OTPs confidential; you are responsible for activity under your account.</li>
              <li>Parent accounts must be created by an adult. Institution accounts are managed by the institution&apos;s admin, who controls staff access and roles.</li>
              <li>We may suspend accounts that violate these terms, abuse the platform or present a security risk.</li>
            </ul>
          </Section>

          <Section title="3. Acceptable use">
            <p>You agree not to:</p>
            <ul>
              <li>Post false, misleading, defamatory or unlawful content, including fake reviews</li>
              <li>Harvest or scrape data, probe or disrupt the platform, or attempt unauthorised access</li>
              <li>Use messaging features to send spam or content unrelated to the recipient&apos;s relationship with the institution</li>
              <li>Impersonate any person or institution, or misrepresent an affiliation</li>
              <li>Upload malware or content that infringes others&apos; rights</li>
            </ul>
          </Section>

          <Section title="4. Reviews">
            <p>
              Reviews must reflect genuine first-hand experience. We may moderate, flag or remove
              reviews that violate our guidelines, and institutions may respond publicly. Review
              eligibility rules (for example, verified admission) apply as displayed in the product.
            </p>
          </Section>

          <Section title="5. Subscriptions, billing and refunds (institutions)">
            <ul>
              <li>Paid plans are billed in advance per the pricing shown at checkout; prices may show inclusive or exclusive of GST as indicated. GST invoices are issued for every charge.</li>
              <li>Plan upgrades take effect immediately with proration as displayed at checkout.</li>
              <li><span className="font-semibold text-slate-800">All payments are final and non-refundable</span>, including for unused periods after cancellation or downgrade, as disclosed at checkout. Cancelling stops future renewals; access continues until the end of the paid period.</li>
              <li>Non-payment after the grace period may result in read-only access or suspension until dues are cleared.</li>
              <li>Messaging and AI credits are prepaid, consumed per use, non-transferable and non-refundable; unused monthly free allowances do not roll over. Credits for messages that fail at the provider are automatically returned.</li>
            </ul>
          </Section>

          <Section title="6. Messaging channels and consent (institutions)">
            <p>
              Institutions using SMS, email or WhatsApp features are responsible for having lawful
              basis and any required consent to contact their recipients, and for the content they
              send. WhatsApp messaging is subject to Meta&apos;s WhatsApp Business terms; recipients
              can opt out at any time (reply STOP) and Vidhyaan enforces such opt-outs
              platform-wide. Abuse of messaging features may lead to feature suspension.
            </p>
          </Section>

          <Section title="7. Data">
            <p>
              Our <Link href="/privacy-policy" className="text-sm font-semibold text-[#1565D8]">Privacy Policy</Link>{' '}
              governs personal data. For records institutions store in the CRM (leads, admissions,
              students, fees), the institution is the data fiduciary and Vidhyaan processes that
              data on its instructions. On termination, institutions may export their data;
              deletion requests are honoured per the{' '}
              <Link href="/data-deletion" className="text-sm font-semibold text-[#1565D8]">Data Deletion Instructions</Link>.
            </p>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              Vidhyaan, its software, design and branding belong to TECHPARROT INNOVATIONS LLP. You
              retain rights to content you submit and grant us a licence to host and display it for
              operating the service (for example, showing your review on a school profile).
              Institution logos and content remain the institution&apos;s property.
            </p>
          </Section>

          <Section title="9. Disclaimers and liability">
            <p>
              The service is provided &quot;as is&quot;. To the maximum extent permitted by law, we
              disclaim implied warranties and are not liable for indirect or consequential losses,
              loss of profits or data, or for acts and omissions of institutions or parents. Our
              aggregate liability for any claim is limited to the amount you paid to Vidhyaan in
              the 12 months preceding the claim (or ₹1,000 for free users). Nothing limits
              liability that cannot be limited under Indian law.
            </p>
          </Section>

          <Section title="10. Indemnity (institutions)">
            <p>
              Institutions agree to indemnify Vidhyaan against claims arising from content they
              publish, messages they send, or their breach of these terms or applicable law
              (including data protection and telecom regulations).
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              You may stop using Vidhyaan and delete your account at any time. We may suspend or
              terminate access for breach of these terms with notice where practicable. Sections
              that by nature survive (fees owed, liability limits, indemnity, IP) survive
              termination.
            </p>
          </Section>

          <Section title="12. Governing law and disputes">
            <p>
              These terms are governed by the laws of India. Courts at Chennai, Tamil Nadu have
              exclusive jurisdiction. We encourage you to contact{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-semibold text-[#1565D8]">{SUPPORT_EMAIL}</a>{' '}
              first — most issues are resolved quickly.
            </p>
          </Section>

          <Section title="13. Changes">
            <p>
              We may update these terms as the product evolves. Material changes are announced on
              this page and, for institutions, by email to the admin. Continued use after an update
              constitutes acceptance.
            </p>
          </Section>
        </section>

        <p className="text-xs font-normal text-slate-400 mt-10">
          Last updated: 11 July 2026 · See also{' '}
          <Link href="/privacy-policy" className="text-[#1565D8] font-semibold">Privacy Policy</Link>{' '}
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
