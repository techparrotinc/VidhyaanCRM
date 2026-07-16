import { useRef } from 'react'
import { TextInput, View, Pressable, Text } from 'react-native'

/** Six-box OTP input backed by one hidden TextInput (paste + SMS autofill safe). */
export function OtpInput({
  value,
  onChange,
  length = 6
}: {
  value: string
  onChange: (v: string) => void
  length?: number
}) {
  const inputRef = useRef<TextInput>(null)
  const digits = value.padEnd(length).split('').slice(0, length)

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View className="flex-row justify-center gap-2.5">
        {digits.map((d, i) => (
          <View
            key={i}
            className={`h-14 w-11 items-center justify-center rounded-2xl border-[1.5px] ${
              i === value.length ? 'border-brand bg-brand-soft' : 'border-line bg-white'
            }`}
          >
            <Text className="text-xl font-bold text-ink">{d.trim()}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        className="absolute h-0 w-0 opacity-0"
        autoFocus
      />
    </Pressable>
  )
}
