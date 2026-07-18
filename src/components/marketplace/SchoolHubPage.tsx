import { cache } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, BadgeCheck, ArrowRight } from 'lucide-react'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import { searchSchools } from '@/lib/marketplace/search-schools'
import { BOARD_HUBS, HubTarget, getHubCities } from '@/lib/marketplace/hubs'

export const getHubSchools = cache(async (hub: HubTarget) => {
  return searchSchools({
    institutionType: 'SCHOOL',
    city: hub.type === 'city' ? hub.city : undefined,
    board: hub.type === 'board' ? hub.board : undefined,
    sort: 'rating',
    page: 1,
    limit: 24,
  })
})

export function hubTitle(hub: HubTarget): string {
  return hub.type === 'city'
    ? `Best Schools in ${hub.city} — Fees, Reviews & Admissions`
    : `Best ${hub.board} Schools in India — Fees, Reviews & Admissions`
}

export function hubDescription(hub: HubTarget, count: number): string {
  const countText = count > 0 ? `${count} verified` : 'verified'
  return hub.type === 'city'
    ? `Compare ${countText} schools in ${hub.city} by board, fees, facilities and parent reviews. Send enquiries and apply online — free for parents on Vidhyaan.`
    : `Compare ${countText} ${hub.board} schools by location, fees, facilities and parent reviews. Send enquiries and apply online — free for parents on Vidhyaan.`
}

export default async function SchoolHubPage({ hub }: { hub: HubTarget }) {
  const [result, cities] = await Promise.all([getHubSchools(hub), getHubCities()])
  const schools = result.data
  const total = result.pagination.total
  const heading = hub.type === 'city' ? `Best Schools in ${hub.city}` : `Best ${hub.board} Schools`

  const itemListJsonLd = schools.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: schools.map((s: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: s.name,
          url: `https://vidhyaan.com/schools/${s.slug}`,
        })),
      }
    : null

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <MarketplaceHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <nav className="text-xs font-normal text-slate-400 mb-4">
          <Link href="/" className="hover:text-[#1565D8]">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/schools" className="hover:text-[#1565D8]">Schools</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-600">{hub.type === 'city' ? hub.city : hub.board}</span>
        </nav>

        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
          {heading}
        </h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 max-w-2xl mt-3">
          {hub.type === 'city'
            ? `Explore ${total} verified school${total === 1 ? '' : 's'} in ${hub.city}. Compare boards, fee ranges, facilities and genuine parent reviews, then send an enquiry or apply online — free for parents.`
            : `Explore ${total} verified ${hub.board} school${total === 1 ? '' : 's'} across India. Compare fee ranges, facilities and genuine parent reviews, then send an enquiry or apply online — free for parents.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {schools.map((s: any) => {
            const loc = s.locations?.[0]
            const boards = (s.affiliations ?? []).map((a: any) => a.board).filter(Boolean)
            return (
              <Link
                key={s.id}
                href={`/schools/${s.slug}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
              >
                <div className="relative h-36 bg-slate-100">
                  {s.media?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.media[0].url}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image src="/brand/vidhyaan-icon.png" alt="" width={40} height={40} className="opacity-20" />
                    </div>
                  )}
                  {s.admissionOpen && (
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      Admissions Open
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-base font-extrabold text-slate-900 font-poppins group-hover:text-[#1565D8] transition-colors flex items-start gap-1.5">
                    {s.name}
                    {s.isVerified && <BadgeCheck className="w-4 h-4 text-[#1565D8] shrink-0 mt-0.5" />}
                  </h2>
                  <p className="text-xs font-normal text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {[loc?.city, loc?.state].filter(Boolean).join(', ') || 'India'}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-slate-600">
                    {s.avgRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {Number(s.avgRating).toFixed(1)} ({s.reviewCount})
                      </span>
                    )}
                    {boards.length > 0 && (
                      <span className="bg-blue-50 text-[#1565D8] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        {boards[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {total > schools.length && (
          <div className="text-center mt-10">
            <Link
              href={
                hub.type === 'city'
                  ? `/schools?city=${encodeURIComponent(hub.city)}`
                  : `/schools?board=${encodeURIComponent(hub.board)}`
              }
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1565D8] hover:underline"
            >
              View all {total} schools <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="border-t border-slate-200 mt-14 pt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Browse More
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {cities
              .filter((c) => hub.type !== 'city' || c.slug !== hub.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/schools/${c.slug}`}
                  className="text-sm font-medium text-slate-500 hover:text-[#1565D8] transition-colors"
                >
                  Schools in {c.city}
                </Link>
              ))}
            {Object.entries(BOARD_HUBS)
              .filter(([slug]) => hub.type !== 'board' || slug !== hub.slug)
              .map(([slug, board]) => (
                <Link
                  key={slug}
                  href={`/schools/${slug}`}
                  className="text-sm font-medium text-slate-500 hover:text-[#1565D8] transition-colors"
                >
                  {board} Schools
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
