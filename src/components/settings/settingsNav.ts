import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Building2,
  CreditCard,
  GitMerge,
  CalendarDays,
  Key,
  Receipt,
  BookOpen,
  MessageCircle,
  Mail,
  Network,
  Puzzle,
  ShieldCheck,
  Wallet
} from 'lucide-react'

// Single source of truth for the settings navigation — the layout sidebar
// and the /settings landing grid both render from this.

export interface SettingsNavItem {
  name: string
  path: string
  icon: LucideIcon
  description: string
  /** Item is disabled with a lock + upgrade tooltip when true. */
  locked?: boolean
}

export interface SettingsNavSection {
  label: string
  items: SettingsNavItem[]
}

export function buildSettingsNav(opts: {
  isLearningCenter: boolean
  isWhatsappActive: boolean
}): SettingsNavSection[] {
  const { isLearningCenter, isWhatsappActive } = opts

  return [
    {
      label: 'General',
      items: [
        {
          name: 'School Profile',
          path: '/settings/school-profile',
          icon: Building2,
          description: 'Public profile, contact details, facilities and gallery'
        },
        {
          name: 'Branches',
          path: '/settings/branches',
          icon: Network,
          description: 'Campuses under your organization and the default branch'
        },
        {
          name: 'Academic Year',
          path: '/settings/academic-year',
          icon: CalendarDays,
          description: 'Academic sessions and the active year'
        },
        ...(!isLearningCenter
          ? [
              {
                name: 'Admission Pipeline',
                path: '/settings/pipeline',
                icon: GitMerge,
                description: 'Stages your admissions move through'
              },
              {
                name: 'Terms',
                path: '/settings/terms',
                icon: CalendarDays,
                description: 'Term dates used for fee schedules'
              }
            ]
          : [
              {
                name: 'Courses',
                path: '/settings/courses',
                icon: BookOpen,
                description: 'Courses, pricing and billing frequency'
              }
            ]),
        {
          name: 'Duplicate Detection',
          path: '/settings/deduplication',
          icon: ShieldCheck,
          description: 'Rules for catching duplicate leads, admissions and students'
        }
      ]
    },
    {
      label: 'Fees & Payments',
      items: [
        {
          name: 'Fee Plans',
          path: '/settings/fee-plans',
          icon: Receipt,
          description: 'Fee structures applied per grade'
        },
        {
          name: 'Payments',
          path: '/settings/payments',
          icon: CreditCard,
          description: 'Online payment gateway and payout policies'
        }
      ]
    },
    {
      label: 'Communication & Add-ons',
      items: [
        {
          name: 'Notification Preferences',
          path: '/settings/notifications',
          icon: Bell,
          description: 'Which events trigger emails and alerts'
        },
        {
          name: 'Email Templates',
          path: '/settings/email-templates',
          icon: Mail,
          description: 'Customize the emails sent to parents and leads'
        },
        {
          name: 'Add-ons',
          path: '/settings/addons',
          icon: Puzzle,
          description: 'SMS & WhatsApp credits, your own provider accounts'
        },
        {
          name: 'WhatsApp Templates',
          path: '/settings/whatsapp-templates',
          icon: MessageCircle,
          description: 'Approved message templates for campaigns',
          locked: !isWhatsappActive
        }
      ]
    },
    {
      label: 'Security',
      items: [
        {
          name: 'Two-Factor Auth',
          path: '/settings/security',
          icon: ShieldCheck,
          description: 'Authenticator app or SMS second factor, backup codes'
        }
      ]
    },
    {
      label: 'Developer',
      items: [
        {
          name: 'API Keys',
          path: '/settings/api-keys',
          icon: Key,
          description: 'Programmatic access to your workspace'
        }
      ]
    },
    {
      label: 'Billing',
      items: [
        {
          name: 'Billing & Subscription',
          path: '/settings/billing',
          icon: Wallet,
          description: 'Plan, invoices and payment history'
        }
      ]
    }
  ]
}
