/** Vidhyaan design tokens — mirrors the web design system (CLAUDE.md). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1565D8',
          soft: '#E8F0FC',
          bg: '#F8FAFC'
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          faint: '#94A3B8'
        },
        line: {
          DEFAULT: '#CBD5E1',
          soft: '#E2E8F0'
        },
        good: { DEFAULT: '#16A34A', bg: '#EAF7EE' },
        bad: { DEFAULT: '#DC2626', bg: '#FDECEC' },
        warn: { DEFAULT: '#B45309', bg: '#FDF3E3' }
      }
    }
  },
  plugins: []
}
