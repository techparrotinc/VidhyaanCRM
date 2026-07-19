"use client"

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoadingScreen from './LoadingScreen'

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (
        anchor &&
        anchor.href &&
        anchor.target !== '_blank' &&
        !anchor.hasAttribute('download') && // download links must hit the network directly
        !e.defaultPrevented &&
        e.button === 0 && // Only left clicks
        !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey // No keyboard modifiers
      ) {
        const targetUrl = new URL(anchor.href)
        const currentUrl = new URL(window.location.href)

        // API endpoints (file exports, PDFs) are not pages — router.push turns
        // them into an RSC fetch that strips the query string, so the export
        // format param was lost and every download came back as CSV.
        if (targetUrl.pathname.startsWith('/api/')) return

        // Intercept internal page navigations that result in a new route path
        if (targetUrl.origin === currentUrl.origin && targetUrl.pathname !== currentUrl.pathname) {
          e.preventDefault()
          setLoading(true)

          const startTime = Date.now()

          // Preserve query + hash — pushing pathname alone dropped filters
          // from deep links like /lead-management?uncontacted=48h
          const dest = targetUrl.pathname + targetUrl.search + targetUrl.hash

          // Prefetch the target route for smoother transition
          router.prefetch(dest)

          // Perform navigation with minimum 1.5s constraint
          setTimeout(() => {
            router.push(dest)
            
            const elapsed = Date.now() - startTime
            const delay = Math.max(0, 1500 - elapsed)
            
            setTimeout(() => {
              setLoading(false)
            }, delay)
          }, 100) // Brief delay to guarantee UI mounts and starts loader spinner
        }
      }
    }

    const handlePopState = () => {
      // Show loader for back/forward browser navigation
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 1500)
    }

    document.addEventListener('click', handleAnchorClick)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleAnchorClick)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  // Safeguard: automatically turn off loading when the pathname changes successfully
  useEffect(() => {
    // We add a brief delay to match standard transition timings or turn off immediately
    setLoading(false)
  }, [pathname])

  return (
    <>
      {loading && <LoadingScreen />}
      {children}
    </>
  )
}
