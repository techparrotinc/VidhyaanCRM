"use client"

import * as React from "react"

interface PopoverProps {
  children: React.ReactNode
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
} | null>(null)

/**
 * Close handle for content rendered inside a Popover (e.g. the shared
 * Calendar closes itself after a day is picked). Returns null when not
 * inside a Popover, so callers are safe anywhere.
 */
export function usePopoverClose(): (() => void) | null {
  const context = React.useContext(PopoverContext)
  if (!context) return null
  const { setOpen } = context
  return () => setOpen(false)
}

export function Popover({ children }: PopoverProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  
  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block w-full">{children}</div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverTrigger must be used within Popover")
  
  const child = React.Children.only(children) as React.ReactElement<any>
  return React.cloneElement(child, {
    ref: context.triggerRef,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      context.setOpen(!context.open)
      if (child.props && typeof child.props.onClick === 'function') {
        child.props.onClick(e)
      }
    }
  })
}

export function PopoverContent({
  children,
  className = "",
  align = "start",
  avoidCollisions,
  collisionPadding,
  sideOffset,
}: {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  avoidCollisions?: boolean
  collisionPadding?: number
  sideOffset?: number
}) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverContent must be used within Popover")
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!context.open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        context.triggerRef.current &&
        !context.triggerRef.current.contains(e.target as Node)
      ) {
        context.setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [context])

  if (!context.open) return null

  return (
    <div
      ref={contentRef}
      className={`absolute left-0 mt-1 z-[9999] ${className}`}
    >
      {children}
    </div>
  )
}
