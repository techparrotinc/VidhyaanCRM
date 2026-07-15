'use client'

import { useEffect, useState } from 'react'

export type CourseOption = {
  id: string
  name: string
  amount: number
  frequency: string
  billingDay: number
  durationMonths: number | null
}

// Course dropdown for LC/coaching/college orgs — the Course-master
// equivalent of useClassOptions for school-mode Grade dropdowns.
export function useCourseOptions(enabled = true) {
  const [options, setOptions] = useState<CourseOption[]>([])
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetch('/api/v1/options/courses')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        setOptions(json?.data?.courses ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setOptions([])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { options, loading }
}
