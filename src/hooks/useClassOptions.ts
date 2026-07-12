'use client'

import { useEffect, useState } from 'react'
import { GRADE_OPTIONS } from '@/constants/grades'
import { mapGradeValue } from '@/lib/utils/gradeMapping'

// Class + section dropdown options, master-first with static fallback.
// When the org has no SchoolClass rows yet (empty=true), options are the
// canonical GRADE_OPTIONS ladder so forms behave exactly as before the
// master existed.

export type ClassOption = {
  /** Display label + Student.gradeLabel storage value, e.g. "Class 5". */
  name: string
  /** Lead.gradeSought storage value, e.g. "class_5". */
  gradeSlug: string
  sections: string[]
  legacy: boolean
}

export function useClassOptions(enabled = true) {
  const [options, setOptions] = useState<ClassOption[]>([])
  const [fromMaster, setFromMaster] = useState(false)
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetch('/api/v1/options/classes')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        const data = json?.data
        if (data && !data.empty && Array.isArray(data.options) && data.options.length > 0) {
          setOptions(
            data.options.map((o: any) => ({
              name: o.name,
              gradeSlug: o.gradeSlug || mapGradeValue(o.name),
              sections: o.sections ?? [],
              legacy: !!o.legacy
            }))
          )
          setFromMaster(true)
        } else {
          setOptions(
            GRADE_OPTIONS.filter(g => g.value !== 'other').map(g => ({
              name: g.label,
              gradeSlug: g.value,
              sections: [],
              legacy: false
            }))
          )
          setFromMaster(false)
        }
      })
      .catch(() => {
        if (cancelled) return
        setOptions(
          GRADE_OPTIONS.filter(g => g.value !== 'other').map(g => ({
            name: g.label,
            gradeSlug: g.value,
            sections: [],
            legacy: false
          }))
        )
        setFromMaster(false)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { options, fromMaster, loading }
}
