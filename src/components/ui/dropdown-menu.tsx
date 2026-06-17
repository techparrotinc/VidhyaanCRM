import * as React from "react"

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (val: boolean) => void
} | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) return null
  const child = React.Children.only(children) as React.ReactElement<{ onClick?: React.MouseEventHandler }>
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      context.setIsOpen(!context.isOpen)
      child.props.onClick?.(e)
    }
  })
}

export function DropdownMenuContent({
  children,
  align = 'end',
  className = ""
}: {
  children: React.ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const context = React.useContext(DropdownMenuContext)
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

  return (
    <div
      ref={ref}
      className={`absolute ${align === 'end' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-xl z-30 py-1.5 animate-fade-in text-left focus:outline-none ${className}`}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  className = '',
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const context = React.useContext(DropdownMenuContext)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
        context?.setIsOpen(false)
      }}
      className={`w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-slate-100 my-1" />
}
