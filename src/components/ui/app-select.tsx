'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Branded drop-in replacement for native <select>: accepts the same props and
 * the same <option> children, and calls onChange with an e.target shim, so a
 * native select can be migrated by renaming the tag. The closed trigger keeps
 * whatever className the form already used (so it matches its siblings); only
 * the popup list is replaced with the app-styled menu (single box, viewport
 * flip — same behaviour as DateTimePicker).
 *
 * Deliberately NOT used on parent/marketplace surfaces (public forms,
 * registration) where the mobile OS wheel is the better experience.
 */

type OptionEntry = { value: string; label: React.ReactNode; disabled?: boolean }

function extractOptions(children: React.ReactNode, out: OptionEntry[] = []): OptionEntry[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as any
    if (child.type === 'option') {
      out.push({
        value: String(props.value ?? ''),
        label: props.children,
        disabled: !!props.disabled
      })
    } else if (props?.children) {
      // Fragments / optgroup-ish wrappers — flatten
      extractOptions(props.children, out)
    }
  })
  return out
}

type AppSelectProps = {
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  name?: string
  id?: string
  className?: string
  disabled?: boolean
  required?: boolean
  'aria-label'?: string
  title?: string
  style?: React.CSSProperties
  /** Drop-in parity with native selects (incl. react-hook-form register):
      fired with the same e.target shim right after a pick. */
  onBlur?: (e: { target: any; type?: any }) => void
  children: React.ReactNode
}

export const AppSelect = React.forwardRef<HTMLButtonElement, AppSelectProps>(function AppSelect(
  {
    value,
    onChange,
    name,
    id,
    className = '',
    disabled,
    children,
    title,
    style,
    onBlur,
    'aria-label': ariaLabel
  },
  forwardedRef
) {
  const [open, setOpen] = React.useState(false)
  const [dropUp, setDropUp] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)

  const options = extractOptions(children)
  const currentValue = String(value ?? '')
  const current = options.find((o) => o.value === currentValue)

  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Scroll the selected row into view when the menu opens
  React.useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [open])

  const toggle = () => {
    if (disabled || options.length === 0) return
    if (!open && rootRef.current) {
      const r = rootRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom
      const estHeight = Math.min(options.length * 36 + 12, 240) + 8
      setDropUp(spaceBelow < estHeight && r.top > spaceBelow)
    }
    setOpen((o) => !o)
  }

  const pick = (opt: OptionEntry) => {
    if (opt.disabled) return
    setOpen(false)
    const shim = {
      target: { value: opt.value, name: name ?? '' }
    } as unknown as React.ChangeEvent<HTMLSelectElement>
    onChange?.(shim)
    onBlur?.(shim)
  }

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        ref={forwardedRef}
        type="button"
        id={id}
        title={title}
        style={style}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggle}
        className={`text-left flex items-center justify-between gap-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className={`block truncate flex-1 min-w-0 ${current && current.value !== '' ? '' : 'text-slate-400'}`}>
          {current ? current.label : ' '}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className={`absolute left-0 min-w-full w-max max-w-[min(320px,90vw)] z-[70] bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 max-h-60 overflow-y-auto ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.map((opt, i) => {
            const selected = opt.value === currentValue
            return (
              <button
                key={opt.value + i}
                type="button"
                role="option"
                aria-selected={selected}
                data-selected={selected}
                disabled={opt.disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  pick(opt)
                }}
                className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 transition-colors ${
                  opt.disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : selected
                      ? 'bg-blue-50/60 text-[#1565D8] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {selected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})
