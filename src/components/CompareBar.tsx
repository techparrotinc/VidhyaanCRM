'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompareItem {
  slug: string
  name: string
}

export default function CompareBar() {
  const router = useRouter()
  const [compareList, setCompareList] = useState<CompareItem[]>([])

  useEffect(() => {
    const loadCompareList = () => {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('compare_schools')
          if (raw) {
            const parsed = JSON.parse(raw)
            // Handle both string arrays and object arrays gracefully
            const formatted = parsed.map((item: any) => {
              if (typeof item === 'string') {
                return { slug: item, name: item.replace(/-/g, ' ') }
              }
              return item
            })
            setCompareList(formatted.slice(0, 3))
          } else {
            setCompareList([])
          }
        } catch (e) {
          console.error('Error loading compare list:', e)
          setCompareList([])
        }
      }
    }

    loadCompareList()

    window.addEventListener('compare-changed', loadCompareList)
    window.addEventListener('storage', loadCompareList)

    return () => {
      window.removeEventListener('compare-changed', loadCompareList)
      window.removeEventListener('storage', loadCompareList)
    }
  }, [])

  const handleRemove = (slug: string) => {
    const updated = compareList.filter(item => item.slug !== slug)
    localStorage.setItem('compare_schools', JSON.stringify(updated))
    window.dispatchEvent(new Event('compare-changed'))
  }

  if (compareList.length === 0) return null

  const compareUrl = `/schools/compare?schools=${compareList.map(i => i.slug).join(',')}`

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center gap-4 z-50 animate-slide-in max-w-[95%] w-full md:w-auto md:max-w-2xl select-none">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-400 tracking-wider">
        <Layers className="w-4 h-4 text-blue-500 fill-current" />
        <span>Compare ({compareList.length}/3)</span>
      </div>

      {/* Schools items list */}
      <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
        {compareList.map((school) => (
          <div 
            key={school.slug} 
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700/50 transition"
          >
            <span className="truncate max-w-[120px]">{school.name}</span>
            <button 
              onClick={() => handleRemove(school.slug)}
              className="text-slate-400 hover:text-red-400 transition ml-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {compareList.length < 3 && (
          <div 
            onClick={() => router.push('/schools')}
            className="text-[10px] font-black uppercase text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-400 px-3 py-1.5 rounded-xl cursor-pointer transition select-none flex items-center justify-center"
          >
            + Add School
          </div>
        )}
      </div>

      {/* Compare button */}
      <Button 
        onClick={() => router.push(compareUrl)}
        className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl h-auto shrink-0 flex items-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer w-full md:w-auto"
      >
        Compare Schools
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
