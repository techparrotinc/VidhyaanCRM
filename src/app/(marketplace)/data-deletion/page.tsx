import type { Metadata } from 'next'
import Link from 'next/link'
import { Trash2, Mail, ShieldCheck, Clock, UserX, FileText } from 'lucide-react'
import MarketplaceHeader from '@/components/MarketplaceHeader'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | Vidhyaan',
  description:
    'How to request deletion of your personal data from Vidhyaan — parent accounts, enquiries, WhatsApp and Facebook-connected data. Requests are honoured within 30 days.'
}

const SUPPORT_EMAIL = 'support@vidhyaan.com'

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Data Deletion Instructions
          </h1>
        </div>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mb-10">
          Vidhyaan respects your right to control your personal data. This page explains how to
          request the deletion of your information from our platform, including data received
          through Facebook, WhatsApp and Google sign-in integrations.
        </p>

        <section className="space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#1565D8]" /> What data we hold
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-600 mb-3">
              Depending on how you use Vidhyaan, we may hold:
            </p>
            <ul className="text-sm leading-relaxed text-slate-600 list-disc pl-5 space-y-1.5">
              <li>Parent account details — name, phone number, email address</li>
              <li>Admission enquiries and applications you submitted to schools or learning centres</li>
              <li>Children&apos;s details you added while applying (name, age, class sought)</li>
              <li>Reviews, bookmarks and messages exchanged with institutions</li>
              <li>
                Message delivery records for WhatsApp, SMS and email notifications sent to you
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <UserX className="w-4 h-4 text-[#1565D8]" /> How to request deletion
            </h2>
            <ol className="text-sm leading-relaxed text-slate-600 list-decimal pl-5 space-y-3">
              <li>
                <span className="font-semibold text-slate-800">Email us.</span> Send a request to{' '}
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Data%20Deletion%20Request`} className="text-sm font-semibold text-[#1565D8]">
                  {SUPPORT_EMAIL}
                </a>{' '}
                with the subject <span className="font-semibold">&quot;Data Deletion Request&quot;</span> from the
                email address or phone number registered with us. Include your registered mobile
                number so we can locate your records.
              </li>
              <li>
                <span className="font-semibold text-slate-800">WhatsApp opt-out (messages only).</span>{' '}
                To stop receiving WhatsApp messages without deleting your account, simply reply{' '}
                <span className="font-mono font-semibold">STOP</span> to any WhatsApp message from
                Vidhyaan. Reply <span className="font-mono font-semibold">START</span> anytime to resume.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Verification.</span> We will confirm your
                identity via an OTP to your registered phone or email before processing the request —
                this protects your data from deletion requests made by someone else.
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#1565D8]" /> What happens next
            </h2>
            <ul className="text-sm leading-relaxed text-slate-600 list-disc pl-5 space-y-1.5">
              <li>We acknowledge your request within <span className="font-semibold">72 hours</span>.</li>
              <li>
                Your personal data is deleted or irreversibly anonymised within{' '}
                <span className="font-semibold">30 days</span> of verification.
              </li>
              <li>
                You receive a written confirmation once deletion is complete, along with a reference
                ID you can use for any follow-up.
              </li>
              <li>
                Data shared with an institution as part of an admission you completed (for example, a
                confirmed enrolment) may be retained by that institution as required for their own
                statutory record-keeping — such records are governed by the institution&apos;s policies.
              </li>
              <li>
                Limited records may be retained where Indian law requires it (for example, tax and
                billing records), and only for the legally mandated period.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#1565D8]" /> Facebook & WhatsApp connected data
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-600">
              If you interacted with Vidhyaan through Facebook or WhatsApp (for example, receiving
              school updates on WhatsApp), the same process applies: email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Data%20Deletion%20Request`} className="text-sm font-semibold text-[#1565D8]">
                {SUPPORT_EMAIL}
              </a>{' '}
              and we will delete the associated message logs and contact records from our systems
              within 30 days. Removing Vidhyaan&apos;s access from your Facebook settings
              (Settings &amp; Privacy → Apps and Websites) stops future data sharing but does not
              delete data already held — send us the email request for full deletion.
            </p>
          </div>

          <div className="bg-blue-50/60 rounded-xl border border-blue-100 p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-[#1565D8]" /> Contact
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-600">
              Data deletion requests and privacy questions:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-semibold text-[#1565D8]">
                {SUPPORT_EMAIL}
              </a>
              <br />
              TECHPARROT INNOVATIONS LLP, Chennai, Tamil Nadu, India
            </p>
          </div>
        </section>

        <p className="text-xs font-normal text-slate-400 mt-10">
          Last updated: 11 July 2026 ·{' '}
          <Link href="/" className="text-[#1565D8] font-semibold">
            vidhyaan.com
          </Link>
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
