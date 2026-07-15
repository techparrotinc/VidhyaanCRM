import { ReactNode } from 'react'
import { Pressable, Text, View, ActivityIndicator } from 'react-native'

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
  const base = 'w-full items-center justify-center rounded-xl px-4 py-3'
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
    <View className={`rounded-xl border border-line bg-white p-4 ${className}`}>{children}</View>
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
  onPress
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  onPress?: () => void
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="flex-row items-center gap-3">
        <View className="h-10 w-10 rounded-full bg-brand-soft" />
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
  tone?: 'neutral' | 'good' | 'bad' | 'warn'
  selected?: boolean
}) {
  const tones = {
    neutral: 'border-line text-ink-secondary',
    good: 'border-transparent bg-good-bg text-good',
    bad: 'border-transparent bg-bad-bg text-bad',
    warn: 'border-transparent bg-warn-bg text-warn'
  }[tone]
  return (
    <View
      className={`rounded-full border px-2.5 py-0.5 ${selected ? 'border-brand bg-brand' : tones}`}
    >
      <Text className={`text-[11px] font-semibold ${selected ? 'text-white' : ''}`}>{label}</Text>
    </View>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`flex-1 bg-brand-bg px-4 pt-2 ${className}`}>{children}</View>
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold tracking-tight text-ink">{children}</Text>
}
