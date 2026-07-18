import { Metadata } from 'next'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  IndianRupee,
  Megaphone,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Building2,
  UserRound,
  BadgeCheck,
  Search,
  Scale,
  ListChecks,
} from 'lucide-react'
import MarketplaceHeader from '@/components/MarketplaceHeader'

export const metadata: Metadata = {
  title: 'Products — School CRM, Fee Management & Marketplace Tools',
  description:
    'Explore Vidhyaan products: lead & admission management, student and fee management, campaigns, parent portal, reports and free marketplace listing for schools and learning centres.',
  alternates: { canonical: 'https://vidhyaan.com/products' },
  openGraph: {
    title: 'Products — School CRM, Fee Management & Marketplace Tools',
    description:
      'Explore Vidhyaan products: lead & admission management, student and fee management, campaigns, parent portal, reports and free marketplace listing for schools and learning centres.',
    url: 'https://vidhyaan.com/products',
  },
}

const crmProducts = [
  { href: '/products/lead-management', icon: Users, name: 'Lead Management', desc: 'Capture, assign and follow up on every parent enquiry in one pipeline.' },
  { href: '/products/admission-management', icon: GraduationCap, name: 'Admission Management', desc: 'Customizable pipelines, document collection and one-click conversion to student.' },
  { href: '/products/student-management', icon: BookOpen, name: 'Student Management', desc: 'Student records, sections and year-end promotion in one place.' },
  { href: '/products/fee-management', icon: IndianRupee, name: 'Fee Management', desc: 'Term and course invoicing, batch billing and Razorpay online collection.' },
  { href: '/products/course-management', icon: ListChecks, name: 'Course & Batch Management', desc: 'Courses, batches and trial classes for learning centres.' },
  { href: '/products/campaign-management', icon: Megaphone, name: 'Campaign Management', desc: 'WhatsApp and email campaigns for admissions and events.' },
  { href: '/products/notifications-alerts', icon: Bell, name: 'Notifications & Alerts', desc: 'Automated WhatsApp, SMS and email updates across the admission and fee lifecycle.' },
  { href: '/products/parent-portal', icon: UserRound, name: 'Parent Portal', desc: 'Parents track applications, RSVP to events and pay fees online.' },
  { href: '/products/reporting-analytics', icon: LayoutDashboard, name: 'Reports & Analytics', desc: 'Role-based dashboards and 15+ exportable reports.' },
  { href: '/products/role-based-access', icon: ShieldCheck, name: 'Role-Based Access', desc: 'Granular roles, multi-role login and org-level 2FA policy.' },
  { href: '/products/institution-types', icon: Building2, name: 'Built for Every Institution', desc: 'Schools, junior colleges, preschools and learning centres — adaptive workflows.' },
]

const marketplaceProducts = [
  { href: '/products/marketplace/free-listing', icon: BadgeCheck, name: 'Free Listing', desc: 'A public profile parents can discover — free forever.' },
  { href: '/products/marketplace/search-discovery', icon: Search, name: 'Search & Discovery', desc: 'Parents find you by location, board, fees and reviews.' },
  { href: '/products/marketplace/compare', icon: Scale, name: 'School Compare', desc: 'Side-by-side comparison that puts your strengths in front of parents.' },
  { href: '/products/marketplace/verified-badge', icon: ShieldCheck, name: 'Verified Badge', desc: 'Build trust with a verified profile badge in search results.' },
]

export default function ProductsIndexPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">
      <MarketplaceHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="bg-blue-50 text-[#1565D8] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100/50 select-none">
            Products
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-poppins mt-3">
            Everything to Run &amp; Grow Your Institution
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-semibold mt-3">
            One platform for discovery, admissions, students and fees — for schools, junior colleges and learning centres.
          </p>
        </div>

        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">CRM &amp; Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {crmProducts.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <p.icon className="w-8 h-8 text-[#1565D8] mb-4" />
              <h3 className="text-base font-extrabold text-slate-900 font-poppins group-hover:text-[#1565D8] transition-colors">
                {p.name}
              </h3>
              <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1.5">{p.desc}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {marketplaceProducts.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <p.icon className="w-8 h-8 text-[#1565D8] mb-4" />
              <h3 className="text-base font-extrabold text-slate-900 font-poppins group-hover:text-[#1565D8] transition-colors">
                {p.name}
              </h3>
              <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1.5">{p.desc}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/register-school"
            className="inline-block bg-[#1565D8] text-white text-sm font-semibold px-8 py-3.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  )
}
