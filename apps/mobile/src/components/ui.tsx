import { ReactNode } from 'react'
import {
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  StyleSheet,
  Image
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { IconName } from '@/lib/icons'

/**
 * Base UI kit — direct translation of the validated wireframe primitives
 * (v7). NativeWind classes use the brand tokens from tailwind.config.js.
 */

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled
}: {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'outline' | 'danger' | 'quiet' | 'success'
  loading?: boolean
  disabled?: boolean
}) {
  const base = 'w-full items-center justify-center rounded-2xl px-4 py-3.5'
  const styles = {
    primary: 'bg-brand',
    outline: 'border-[1.5px] border-brand bg-white',
    danger: 'border-[1.5px] border-bad bg-white',
    quiet: 'border border-line bg-white',
    success: 'bg-good'
  }[variant]
  const textStyles = {
    primary: 'text-white',
    outline: 'text-brand',
    danger: 'text-bad',
    quiet: 'text-ink-secondary',
    success: 'text-white'
  }[variant]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${styles} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}
      style={
        !disabled && (variant === 'primary' || variant === 'success')
          ? {
              shadowColor: variant === 'success' ? '#16A34A' : '#1565D8',
              shadowOpacity: 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3
            }
          : undefined
      }
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'success' ? '#fff' : '#1565D8'} />
      ) : (
        <Text className={`text-sm font-semibold ${textStyles}`}>{label}</Text>
      )}
    </Pressable>
  )
}

export function Card({
  children,
  className = '',
  flat = true
}: {
  children: ReactNode
  className?: string
  /** Thin-border, near-flat surface (matches the reference design language). Set false for elevated contexts like modals. */
  flat?: boolean
}) {
  return (
    <View
      className={`rounded-2xl border bg-white p-4 ${flat ? 'border-line' : 'border-line/60'} ${className}`}
      style={
        flat
          ? {
              shadowColor: '#0F172A',
              shadowOpacity: 0.03,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1
            }
          : {
              shadowColor: '#0F172A',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2
            }
      }
    >
      {children}
    </View>
  )
}

/** Section accent — one per mobile tab. Drives gradient headers, icon chips, progress fills. */
export type Accent = 'brand' | 'fees' | 'attend' | 'events'

const ACCENT_GRADIENT: Record<Accent, [string, string]> = {
  brand: ['#1565D8', '#3B82F6'],
  fees: ['#7C3AED', '#A78BFA'],
  attend: ['#0D9488', '#2DD4BF'],
  events: ['#EA580C', '#FB923C']
}

const ACCENT_SOFT_BG: Record<Accent, string> = {
  brand: 'bg-brand-soft',
  fees: 'bg-fees-soft',
  attend: 'bg-attend-soft',
  events: 'bg-events-soft'
}

const ACCENT_TEXT: Record<Accent, string> = {
  brand: 'text-brand',
  fees: 'text-fees',
  attend: 'text-attend',
  events: 'text-events'
}

/** Raw hex per accent — Ionicons `color` needs a real value, not a className. */
export const ACCENT_HEX: Record<Accent, string> = {
  brand: '#1565D8',
  fees: '#7C3AED',
  attend: '#0D9488',
  events: '#EA580C'
}

export function IconCircle({
  accent = 'brand',
  size = 40,
  icon
}: {
  accent?: Accent
  size?: number
  icon?: IconName
}) {
  return (
    <View
      className={`items-center justify-center rounded-full ${ACCENT_SOFT_BG[accent]}`}
      style={{ width: size, height: size }}
    >
      {icon ? (
        <Ionicons name={icon} size={size * 0.5} color={ACCENT_HEX[accent]} />
      ) : (
        <View
          className={`rounded-full ${ACCENT_TEXT[accent].replace('text-', 'bg-')}`}
          style={{ width: size * 0.4, height: size * 0.4, opacity: 0.85 }}
        />
      )}
    </View>
  )
}

/**
 * Colorful hero header — replaces the plain PageTitle on the 4 top-level
 * tab screens. Gradient background per section accent; content sits on a
 * sibling (non-absolute) View so the parent sizes to it correctly.
 */
export function GradientHeader({
  title,
  subtitle,
  accent = 'brand',
  right
}: {
  title: string
  subtitle?: string
  accent?: Accent
  right?: ReactNode
}) {
  const [from, to] = ACCENT_GRADIENT[accent]
  const insets = useSafeAreaInsets()
  return (
    <View className="overflow-hidden rounded-b-3xl">
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Gradient itself bleeds under the status bar (edge-to-edge looks
          intentional); only the text content drops below it. */}
      <View
        className="flex-row items-center justify-between px-5 pb-6 pt-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-1">
          <Text className="text-2xl font-bold tracking-tight text-white">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-sm text-white/80">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  )
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex-1">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-ink-faint">{hint}</Text> : null}
    </Card>
  )
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  accent = 'brand',
  icon,
  badge
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  onPress?: () => void
  accent?: Accent
  icon?: IconName
  badge?: string
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="flex-row items-center gap-3">
        <IconCircle accent={accent} icon={icon} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="flex-shrink text-sm font-semibold text-ink">{title}</Text>
            {badge ? (
              <View className="rounded-full bg-events px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-white">{badge}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text className="text-xs text-ink-secondary">{subtitle}</Text> : null}
        </View>
        {right}
      </Card>
    </Pressable>
  )
}

export function Chip({
  label,
  tone = 'neutral',
  selected
}: {
  label: string
  tone?: 'neutral' | 'good' | 'bad' | 'warn' | Accent
  selected?: boolean
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line text-ink-secondary',
    good: 'border-transparent bg-good-bg text-good',
    bad: 'border-transparent bg-bad-bg text-bad',
    warn: 'border-transparent bg-warn-bg text-warn',
    brand: 'border-transparent bg-brand-soft text-brand',
    fees: 'border-transparent bg-fees-soft text-fees',
    attend: 'border-transparent bg-attend-soft text-attend',
    events: 'border-transparent bg-events-soft text-events'
  }
  return (
    <View
      className={`rounded-full border px-2.5 py-1 ${selected ? 'border-brand bg-brand' : tones[tone]}`}
    >
      <Text className={`text-[11px] font-semibold ${selected ? 'text-white' : ''}`}>{label}</Text>
    </View>
  )
}

export function Screen({
  children,
  className = '',
  header
}: {
  children: ReactNode
  className?: string
  header?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-brand-bg">
      {header}
      <View
        className={`flex-1 px-4 ${header ? 'pt-4' : ''} ${className}`}
        style={header ? undefined : { paddingTop: insets.top + 8 }}
      >
        {children}
      </View>
    </View>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold tracking-tight text-ink">{children}</Text>
}

/** Segmented pill toggle — selected = solid accent fill, unselected = white outline. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = 'brand'
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  accent?: Accent
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)} className="active:opacity-80">
            <View
              className={`rounded-full border px-3.5 py-1.5 ${
                selected ? 'border-transparent' : 'border-line bg-white'
              }`}
              style={selected ? { backgroundColor: ACCENT_HEX[accent] } : undefined}
            >
              <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-ink-secondary'}`}>
                {opt.label}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Pastel-background stat card — reuses the existing -soft accent tokens. */
/** Flat white/bordered KPI card — plain black number on white, no accent
 *  color wash, matching the reference dashboard wireframe exactly. */
export function PastelStat({
  label,
  value
}: {
  label: string
  value: string | number
  /** Unused — kept so existing call sites don't need to change. */
  accent?: Accent
}) {
  return (
    <View className="flex-1 rounded-2xl border border-line bg-white p-4">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">{label}</Text>
      <Text className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</Text>
    </View>
  )
}

export function Avatar({
  uri,
  name,
  size = 44,
  accent = 'brand'
}: {
  uri?: string | null
  name?: string
  size?: number
  accent?: Accent
}) {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    )
  }
  return (
    <View
      className={`items-center justify-center rounded-full ${ACCENT_SOFT_BG[accent]}`}
      style={{ width: size, height: size }}
    >
      <Text className={`font-bold ${ACCENT_TEXT[accent]}`} style={{ fontSize: size * 0.36 }}>
        {initials || '?'}
      </Text>
    </View>
  )
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search'
}: {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5">
      <Ionicons name="search-outline" size={18} color="#94A3B8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className="flex-1 text-sm text-ink"
      />
    </View>
  )
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle
}: {
  icon?: IconName
  title: string
  subtitle?: string
}) {
  return (
    <View className="mt-6 items-center px-6 py-8">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
        <Ionicons name={icon} size={26} color="#1565D8" />
      </View>
      <Text className="text-center text-sm font-semibold text-ink">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-xs text-ink-faint">{subtitle}</Text>
      ) : null}
    </View>
  )
}

/**
 * Plain-white header for pushed/detail screens — rounded-square colored
 * back-button + centered title. Distinct from GradientHeader, which is only
 * for tab-root screens.
 */
export function DetailHeader({
  title,
  onBack,
  accent = 'brand',
  right
}: {
  title: string
  onBack: () => void
  accent?: Accent
  right?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="flex-row items-center justify-between bg-white px-4 pb-3"
      style={{ paddingTop: insets.top + 12 }}
    >
      <Pressable
        onPress={onBack}
        className={`h-9 w-9 items-center justify-center rounded-xl ${ACCENT_SOFT_BG[accent]} active:opacity-70`}
      >
        <Ionicons name="chevron-back" size={20} color={ACCENT_HEX[accent]} />
      </Pressable>
      <Text className="flex-1 text-center text-base font-bold text-ink" numberOfLines={1}>
        {title}
      </Text>
      <View className="h-9 w-9 items-center justify-center">{right}</View>
    </View>
  )
}

/** Home-screen quick-action pill: icon button + label, meant for a horizontal ScrollView row. */
export function IconPill({
  icon,
  label,
  accent = 'brand',
  onPress
}: {
  icon: IconName
  label: string
  accent?: Accent
  onPress?: () => void
}) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1.5 active:opacity-70">
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${ACCENT_SOFT_BG[accent]}`}>
        <Ionicons name={icon} size={22} color={ACCENT_HEX[accent]} />
      </View>
      <Text className="max-w-[64px] text-center text-[11px] font-medium text-ink-secondary" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * Illustration-banner substitute — gradient card w/ an oversized low-opacity
 * icon as a decorative motif, plus a small solid icon badge for the "real"
 * content marker. No art assets required.
 */
export function BannerCard({
  title,
  subtitle,
  icon,
  accent = 'brand',
  onPress
}: {
  title: string
  subtitle?: string
  icon: IconName
  accent?: Accent
  onPress?: () => void
}) {
  const [from, to] = ACCENT_GRADIENT[accent]
  return (
    <Pressable onPress={onPress} className="active:opacity-90">
      <View className="overflow-hidden rounded-2xl">
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons
          name={icon}
          size={96}
          color="rgba(255,255,255,0.18)"
          style={{ position: 'absolute', right: -16, bottom: -20 }}
        />
        <View className="p-4">
          <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-white/25">
            <Ionicons name={icon} size={16} color="#fff" />
          </View>
          <Text className="text-base font-bold text-white">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-xs text-white/85">{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  )
}

/** Home-screen "Activities" grid cell — icon, label, freshness meta text, optional unseen badge. */
export function ActivityTile({
  icon,
  label,
  meta,
  unseen,
  accent = 'brand',
  onPress
}: {
  icon: IconName
  label: string
  meta?: string
  unseen?: number
  accent?: Accent
  onPress?: () => void
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 active:opacity-80">
      <Card className="gap-1">
        <View className="flex-row items-center justify-between">
          <IconCircle accent={accent} icon={icon} size={36} />
          {unseen ? (
            <View className="rounded-full bg-bad px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">{unseen}</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-1 text-sm font-semibold text-ink">{label}</Text>
        {meta ? <Text className="text-[11px] text-ink-faint">{meta}</Text> : null}
      </Card>
    </Pressable>
  )
}

/** Small uppercase divider label for date-grouped list sections. */
export function DateSectionHeader({ label }: { label: string }) {
  return (
    <View className="my-2 items-center">
      <Text className="rounded-full bg-line-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-secondary">
        {label}
      </Text>
    </View>
  )
}
