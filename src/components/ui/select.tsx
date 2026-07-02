import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (val: string) => void
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  labels: Record<string, React.ReactNode>
  registerLabel: (val: string, label: React.ReactNode) => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
} | null>(null)

export function Select({
  value,
  onValueChange,
  open,
  onOpenChange,
  children
}: {
  value?: string
  onValueChange?: (val: string) => void
  open?: boolean
  onOpenChange?: (val: boolean) => void
  children: React.ReactNode
}) {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalIsOpen
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalIsOpen
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({})
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    setLabels(prev => {
      if (prev[val] === label) return prev
      return { ...prev, [val]: label }
    })
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, labels, registerLabel, triggerRef }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  children,
  className = "",
  disabled
}: {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  
  const hasCustomStyling = className.includes('h-') || className.includes('rounded-') || className.includes('border-')
  const defaultClasses = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
  
  return (
    <button
      ref={context.triggerRef}
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      disabled={disabled}
      className={`flex items-center justify-between gap-1.5 transition-all ${hasCustomStyling ? "" : defaultClasses} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
    </button>
  )
}

export function SelectValue({
  placeholder,
  className = ""
}: {
  placeholder?: string
  className?: string
}) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  const selectedLabel = context.value ? context.labels[context.value] : null
  return (
    <span className={`block truncate ${className}`}>
      {selectedLabel || placeholder || context.value}
    </span>
  )
}

export function SelectContent({
  children,
  className = "",
  position = "popper",
  sideOffset = 6,
  usePortal = false
}: {
  children: React.ReactNode
  className?: string
  position?: string
  sideOffset?: number
  usePortal?: boolean
}) {
  const context = React.useContext(SelectContext)
  const ref = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 })

  const updateCoords = React.useCallback(() => {
    if (!context?.triggerRef?.current) return
    const rect = context.triggerRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + window.scrollY + sideOffset,
      left: rect.left + window.scrollX,
      width: rect.width
    })
  }, [context?.triggerRef, sideOffset])

  React.useEffect(() => {
    if (!context?.isOpen || !usePortal) return
    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [context?.isOpen, usePortal, updateCoords])

  React.useEffect(() => {
    if (!context?.isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const clickedTrigger = context.triggerRef?.current?.contains(e.target as Node)
      if (ref.current && !ref.current.contains(e.target as Node) && !clickedTrigger) {
        context.setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        context.setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [context])

  if (!context?.isOpen) return null

  const popperClasses = position === "popper" && !usePortal ? `absolute left-0 mt-1.5 w-full` : ""

  const contentElement = (
    <div
      ref={ref}
      className={`bg-white border border-slate-200 shadow-lg rounded-xl z-[9999] py-1.5 overflow-auto max-h-60 ${popperClasses} ${className}`}
      style={usePortal ? {
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        width: coords.width,
      } : (position === "popper" ? { top: '100%' } : undefined)}
    >
      {children}
    </div>
  )

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(contentElement, document.body)
  }

  return contentElement
}

export function SelectItem({
  value,
  children,
  className = ""
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(SelectContext)

  const registerLabel = context?.registerLabel
  React.useEffect(() => {
    if (registerLabel) {
      registerLabel(value, children)
    }
  }, [value, children, registerLabel])

  if (!context) return null

  const isSelected = context.value === value
  return (
    <button
      type="button"
      onClick={() => {
        context.onValueChange?.(value)
        context.setIsOpen(false)
      }}
      className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-50 flex items-center transition-colors cursor-pointer ${
        isSelected ? 'bg-blue-50/50 text-[#1565D8] font-semibold' : 'text-slate-700'
      } ${className}`}
    >
      {children}
    </button>
  )
}
