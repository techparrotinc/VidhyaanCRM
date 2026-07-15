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
          light: '#3B82F6',
          soft: '#E8F0FC',
          bg: '#F8FAFC'
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          faint: '#94A3B8',
          onDark: '#FFFFFF'
        },
        line: {
          DEFAULT: '#CBD5E1',
          soft: '#E2E8F0'
        },
        good: { DEFAULT: '#16A34A', bg: '#EAF7EE' },
        bad: { DEFAULT: '#DC2626', bg: '#FDECEC' },
        warn: { DEFAULT: '#B45309', bg: '#FDF3E3' },
        // Section accents — one per mobile tab, used for gradient headers,
        // icon chips, and progress fills. Each pairs a saturated DEFAULT
        // with a light `soft` tint for backgrounds/badges.
        fees: { DEFAULT: '#7C3AED', light: '#A78BFA', soft: '#F3EEFE' },
        attend: { DEFAULT: '#0D9488', light: '#2DD4BF', soft: '#E6FBF8' },
        events: { DEFAULT: '#EA580C', light: '#FB923C', soft: '#FFF1E7' }
      }
    }
  },
  plugins: []
}
