import * as React from "react"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (val: string) => void
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  labels: Record<string, React.ReactNode>
  registerLabel: (val: string, label: React.ReactNode) => void
} | null>(null)

export function Select({
  value,
  onValueChange,
  children
}: {
  value?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({})

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    setLabels(prev => {
      if (prev[val] === label) return prev
      return { ...prev, [val]: label }
    })
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, labels, registerLabel }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(SelectContext)
  if (!context) return null
  
  // If custom classes are provided, merge or let them override. We can check if custom styles are passed.
  const hasCustomStyling = className.includes('h-') || className.includes('rounded-') || className.includes('border-')
  const defaultClasses = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
  
  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
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
  sideOffset = 6
}: {
  children: React.ReactNode
  className?: string
  position?: string
  sideOffset?: number
}) {
  const context = React.useContext(SelectContext)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!context?.isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        context.setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [context])

  if (!context?.isOpen) return null

  // position="popper" classes
  const popperClasses = position === "popper" ? `absolute left-0 mt-1.5 w-full` : ""

  return (
    <div
      ref={ref}
      className={`bg-white border border-slate-200 shadow-lg rounded-xl z-[9999] py-1.5 overflow-auto max-h-60 ${popperClasses} ${className}`}
      style={position === "popper" ? { top: '100%' } : undefined}
    >
      {children}
    </div>
  )
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
