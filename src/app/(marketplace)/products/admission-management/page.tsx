import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admission Management Software | Vidhyaan',
  description: 'Streamline registrations, verification, and admission pipelines effortlessly with Vidhyaan.',
}

export default function AdmissionManagementPage() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto">
      <span className="inline-block bg-blue-50 text-[#1565D8] border border-blue-150 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
        Feature Showcase
      </span>
      
      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
        Admission Management
      </h1>
      
      <p className="text-slate-600 font-semibold text-sm leading-relaxed max-w-lg mx-auto">
        Guide candidates seamlessly from application to enrollment. Vidhyaan simplifies document verification, registration fees, and workflow tracking. Speed up response times and make school admission stress-free for both parents and administration.
      </p>
      
      <div className="pt-6 flex justify-center">
        <Link href="/claim-profile" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl h-auto shadow-lg shadow-blue-550/20 flex items-center justify-center gap-2 transition cursor-pointer">
            Claim Free Profile
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
