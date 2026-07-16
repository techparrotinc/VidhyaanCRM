import { useRef } from 'react'
import { TextInput, View, Pressable, Text } from 'react-native'

/** Six-box OTP input backed by one hidden TextInput (paste + SMS autofill safe).
 *  Also reused as the 4-digit PIN pad (`length={4} secure`). */
export function OtpInput({
  value,
  onChange,
  length = 6,
  secure = false
}: {
  value: string
  onChange: (v: string) => void
  length?: number
  /** Mask entered digits (PIN entry). Also disables SMS autofill hints. */
  secure?: boolean
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
            <Text className="text-xl font-bold text-ink">
              {secure && d.trim() ? '●' : d.trim()}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType={secure ? 'password' : 'oneTimeCode'}
        autoComplete={secure ? 'off' : 'sms-otp'}
        secureTextEntry={secure}
        className="absolute h-0 w-0 opacity-0"
        autoFocus
      />
    </Pressable>
  )
}
