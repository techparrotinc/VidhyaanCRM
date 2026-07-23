import {
  LayoutDashboard,
  CalendarClock,
  Award,
  FileText,
  Receipt,
  CalendarDays,
  CalendarCheck,
  Bookmark,
  Star,
  User,
  Bell,
  type LucideIcon
} from 'lucide-react'

export interface ParentNavItem {
  label: string
  /** Short label used on the mobile tab bar */
  mobileLabel?: string
  href: string
  icon: LucideIcon
  /**
   * Position on the mobile bottom tab bar (1-4). Items without a rank
   * live in the "More" sheet. The 5th tab is always "More".
   */
  mobileRank?: number
  /**
   * Item surfaces student-linked data (schedule/fees/attendance/etc).
   * Hidden for discovery parents (no linked ward) — only shown once a
   * school links/invites the parent to an enrolled student.
   */
  requiresEnrollment?: boolean
}

/**
 * Single source of truth for parent-portal navigation — consumed by
 * ParentSidebar (desktop) and ParentMobileNav (bottom tabs + More sheet).
 */
export const parentNavItems: ParentNavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard, mobileRank: 1 },
  { label: 'Schedule', href: '/parent/timetable', icon: CalendarClock, mobileRank: 2, requiresEnrollment: true },
  { label: 'Fees', href: '/parent/fees', icon: Receipt, mobileRank: 3, requiresEnrollment: true },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck, mobileRank: 4, requiresEnrollment: true },
  { label: 'Report Card', mobileLabel: 'Results', href: '/parent/results', icon: Award, requiresEnrollment: true },
  { label: 'Events', href: '/parent/events', icon: CalendarDays, requiresEnrollment: true },
  { label: 'My Applications', mobileLabel: 'Applications', href: '/parent/applications', icon: FileText },
  { label: 'Saved Schools', mobileLabel: 'Saved', href: '/parent/bookmarks', icon: Bookmark },
  { label: 'My Reviews', mobileLabel: 'Reviews', href: '/parent/reviews', icon: Star, requiresEnrollment: true },
  { label: 'Notifications', href: '/parent/notifications', icon: Bell },
  { label: 'My Profile', mobileLabel: 'Profile', href: '/parent/profile', icon: User }
]

/**
 * Visible nav for a parent given enrolment state. Discovery parents (no
 * linked ward) only see marketplace + account items; enrolled parents see
 * everything. Single source consumed by desktop sidebar + mobile nav + the
 * layout's direct-URL redirect guard.
 */
export function visibleParentNav(hasLinkedStudent: boolean): ParentNavItem[] {
  return parentNavItems.filter((i) => !i.requiresEnrollment || hasLinkedStudent)
}

/** Route prefixes only reachable by enrolled parents — used by the layout guard. */
export const enrollmentOnlyHrefs = parentNavItems
  .filter((i) => i.requiresEnrollment)
  .map((i) => i.href)
