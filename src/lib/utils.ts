import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanPhoneNumber(val: unknown): string | unknown {
  if (typeof val !== 'string') return val
  let clean = val.trim().replace(/\D/g, '')
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.substring(2)
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.substring(1)
  }
  return clean
}

