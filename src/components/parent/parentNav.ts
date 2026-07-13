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
}

/**
 * Single source of truth for parent-portal navigation — consumed by
 * ParentSidebar (desktop) and ParentMobileNav (bottom tabs + More sheet).
 */
export const parentNavItems: ParentNavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard, mobileRank: 1 },
  { label: 'Schedule', href: '/parent/timetable', icon: CalendarClock, mobileRank: 2 },
  { label: 'Fees', href: '/parent/fees', icon: Receipt, mobileRank: 3 },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck, mobileRank: 4 },
  { label: 'Report Card', mobileLabel: 'Results', href: '/parent/results', icon: Award },
  { label: 'Events', href: '/parent/events', icon: CalendarDays },
  { label: 'My Applications', mobileLabel: 'Applications', href: '/parent/applications', icon: FileText },
  { label: 'Saved Schools', mobileLabel: 'Saved', href: '/parent/bookmarks', icon: Bookmark },
  { label: 'My Reviews', mobileLabel: 'Reviews', href: '/parent/reviews', icon: Star },
  { label: 'Notifications', href: '/parent/notifications', icon: Bell },
  { label: 'My Profile', mobileLabel: 'Profile', href: '/parent/profile', icon: User }
]
