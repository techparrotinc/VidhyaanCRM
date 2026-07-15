import { ReactNode } from 'react'
import { Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

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
  variant?: 'primary' | 'outline' | 'danger' | 'quiet'
  loading?: boolean
  disabled?: boolean
}) {
  const base = 'w-full items-center justify-center rounded-2xl px-4 py-3.5'
  const styles = {
    primary: 'bg-brand',
    outline: 'border-[1.5px] border-brand bg-white',
    danger: 'border-[1.5px] border-bad bg-white',
    quiet: 'border border-line bg-white'
  }[variant]
  const textStyles = {
    primary: 'text-white',
    outline: 'text-brand',
    danger: 'text-bad',
    quiet: 'text-ink-secondary'
  }[variant]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${styles} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}
      style={
        variant === 'primary' && !disabled
          ? {
              shadowColor: '#1565D8',
              shadowOpacity: 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3
            }
          : undefined
      }
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1565D8'} />
      ) : (
        <Text className={`text-sm font-semibold ${textStyles}`}>{label}</Text>
      )}
    </Pressable>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-line/60 bg-white p-4 ${className}`}
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
      }}
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

export function IconCircle({ accent = 'brand', size = 40 }: { accent?: Accent; size?: number }) {
  return (
    <View
      className={`items-center justify-center rounded-full ${ACCENT_SOFT_BG[accent]}`}
      style={{ width: size, height: size }}
    >
      <View
        className={`rounded-full ${ACCENT_TEXT[accent].replace('text-', 'bg-')}`}
        style={{ width: size * 0.4, height: size * 0.4, opacity: 0.85 }}
      />
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
  return (
    <View className="overflow-hidden rounded-b-3xl">
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View className="flex-row items-center justify-between px-5 pb-6 pt-4">
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
  accent = 'brand'
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  onPress?: () => void
  accent?: Accent
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="flex-row items-center gap-3">
        <IconCircle accent={accent} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{title}</Text>
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
  return (
    <View className="flex-1 bg-brand-bg">
      {header}
      <View className={`flex-1 px-4 ${header ? 'pt-4' : 'pt-2'} ${className}`}>{children}</View>
    </View>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold tracking-tight text-ink">{children}</Text>
}
