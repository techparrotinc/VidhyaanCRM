import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center font-sans antialiased">
      <Image
        src="/brand/vidhyaan-logo.png"
        alt="Vidhyaan"
        width={140}
        height={40}
        className="mb-10 h-9 w-auto"
      />
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Error 404</p>
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
        Page Not Found
      </h1>
      <p className="text-sm font-normal leading-relaxed text-slate-500 max-w-md mt-3">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        Try searching for a school instead.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link
          href="/"
          className="bg-[#1565D8] text-white text-sm font-semibold px-6 py-3 rounded-full shadow-md hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/schools"
          className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-6 py-3 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
        >
          Browse Schools
        </Link>
        <Link
          href="/learning-centers"
          className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-6 py-3 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
        >
          Learning Centers
        </Link>
      </div>
    </div>
  )
}
