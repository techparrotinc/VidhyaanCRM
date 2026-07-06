'use client'

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 select-none self-start">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
            value === opt.value
              ? 'bg-white text-[#1565D8] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
