import type { ComponentProps } from 'react'
import type { Ionicons } from '@expo/vector-icons'
import type { Accent } from '@/components/ui'

export type IconName = ComponentProps<typeof Ionicons>['name']

/**
 * One icon + accent per feature area. Single source of truth reused by tab
 * bars, IconCircle, ActivityTile, and home quick-action pills — never pick
 * a color/icon pair locally in a screen.
 */
export const FEATURE_ICONS = {
  home: { icon: 'home', activeIcon: 'home', accent: 'brand' },
  leads: { icon: 'people-outline', activeIcon: 'people', accent: 'brand' },
  attendance: { icon: 'calendar-outline', activeIcon: 'calendar', accent: 'attend' },
  fees: { icon: 'cash-outline', activeIcon: 'cash', accent: 'fees' },
  students: { icon: 'school-outline', activeIcon: 'school', accent: 'brand' },
  events: { icon: 'sparkles-outline', activeIcon: 'sparkles', accent: 'events' },
  admissions: { icon: 'document-text-outline', activeIcon: 'document-text', accent: 'brand' },
  reports: { icon: 'bar-chart-outline', activeIcon: 'bar-chart', accent: 'brand' },
  wallet: { icon: 'wallet-outline', activeIcon: 'wallet', accent: 'fees' },
  notices: { icon: 'mail-outline', activeIcon: 'mail', accent: 'brand' },
  whatsapp: { icon: 'logo-whatsapp', activeIcon: 'logo-whatsapp', accent: 'attend' },
  aiChat: { icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', accent: 'brand' },
  broadcast: { icon: 'megaphone-outline', activeIcon: 'megaphone', accent: 'events' },
  forms: { icon: 'clipboard-outline', activeIcon: 'clipboard', accent: 'brand' },
  more: { icon: 'ellipsis-horizontal-circle-outline', activeIcon: 'ellipsis-horizontal-circle', accent: 'brand' },
  contact: { icon: 'call-outline', activeIcon: 'call', accent: 'attend' },
  approvals: { icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle', accent: 'brand' },
  billingAlerts: { icon: 'alert-circle-outline', activeIcon: 'alert-circle', accent: 'events' },
  templates: { icon: 'copy-outline', activeIcon: 'copy', accent: 'brand' },
  pulse: { icon: 'pulse-outline', activeIcon: 'pulse', accent: 'brand' },
  search: { icon: 'search-outline', activeIcon: 'search', accent: 'brand' },
  back: { icon: 'chevron-back', activeIcon: 'chevron-back', accent: 'brand' },
  logout: { icon: 'log-out-outline', activeIcon: 'log-out', accent: 'brand' },
  profile: { icon: 'person-outline', activeIcon: 'person', accent: 'brand' }
} satisfies Record<string, { icon: IconName; activeIcon: IconName; accent: Accent }>

export type FeatureKey = keyof typeof FEATURE_ICONS
