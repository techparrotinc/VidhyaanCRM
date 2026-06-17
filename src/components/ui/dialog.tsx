import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const DialogContext = React.createContext<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
} | null>(null)

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const context = React.useContext(DialogContext)
  if (!context) return null

  const child = React.Children.only(children) as React.ReactElement<{ onClick?: React.MouseEventHandler }>
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      context.onOpenChange?.(true)
      child.props.onClick?.(e)
    }
  })
}

export function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DialogOverlay({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DialogContext)
  if (!context || !context.open) return null
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/40 animate-fade-in ${className}`}
      onClick={() => context.onOpenChange?.(false)}
      {...props}
    />
  )
}

export function DialogContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DialogContext)
  if (!context || !context.open) return null

  return (
    <>
      <DialogOverlay />
      <div
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-100 bg-white p-6 shadow-2xl duration-200 rounded-2xl animate-fade-in ${className}`}
        {...props}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          onClick={() => context.onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#1565D8] focus:ring-offset-2"
        >
          <X className="h-4 w-4 text-slate-400" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  )
}

export function DialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-left ${className}`}
      {...props}
    />
  )
}

export function DialogFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    />
  )
}

export function DialogTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-bold leading-none tracking-tight text-slate-850 font-sans ${className}`}
      {...props}
    />
  )
}

export function DialogDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-slate-500 font-sans ${className}`}
      {...props}
    />
  )
}
