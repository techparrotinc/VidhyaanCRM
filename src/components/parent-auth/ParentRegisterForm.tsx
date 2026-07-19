'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import GoogleSignInButton from './GoogleSignInButton'
import { AppSelect } from '@/components/ui/app-select'

const CITIES = [
  'Chennai',
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'New Delhi',
  'Pune',
  'Coimbatore',
  'Madurai',
  'Kochi',
  'Jaipur'
]

interface ParentRegisterFormProps {
  onRegistered: (phone: string) => void
  showLoginLink?: boolean
}

export default function ParentRegisterForm({
  onRegistered,
  showLoginLink = true
}: ParentRegisterFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Chennai')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/parent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          city
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create account')
        return
      }

      onRegistered(phone)

    } catch (err) {
      console.error(err)
      setError('Network connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="space-y-1 mb-5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          Create Parent Account
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Find and apply to the best schools near you
        </p>
      </div>

      {/* Google SSO — verified email, no bounce risk; phone collected once after */}
      <div className="mb-4">
        <GoogleSignInButton label="Sign up with Google" />
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">or register with phone</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 animate-fadeIn">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* Name Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#1565D8] transition-all text-sm"
            required
          />
        </div>

        {/* Phone Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Phone Number
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-600 font-semibold select-none text-sm border-r border-slate-200 pr-3">
              +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
              placeholder="10-digit mobile number"
              disabled={loading}
              className="w-full pl-16 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#1565D8] transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* City Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Your City
          </label>
          <AppSelect
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </AppSelect>
        </div>

        {/* Terms Acceptance */}
        <div className="flex items-start gap-2.5 pt-0.5">
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            disabled={loading}
            className="mt-0.5 w-4 h-4 rounded text-[#1565D8] border-slate-300 focus:ring-[#1565D8]"
            required
          />
          <label htmlFor="terms" className="text-xs text-slate-500 font-medium leading-relaxed select-none">
            I agree to the{' '}
            <a href="/terms-of-service" target="_blank" className="text-[#1565D8] font-bold hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" target="_blank" className="text-[#1565D8] font-bold hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading || phone.length < 10 || name.length < 2 || !agreeTerms}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-[#1565D8] to-[#0c4ca5] hover:from-[#1150ad] hover:to-[#093e8c] disabled:from-[#1565D8]/50 disabled:to-[#0c4ca5]/50 text-white font-bold rounded-xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/20 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm mt-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account & Verify Phone'
          )}
        </button>
      </form>

      {/* Bottom Login Link */}
      {showLoginLink && (
        <div className="pt-4 border-t border-slate-100 text-center mt-4">
          <span className="text-xs text-slate-400 font-medium">
            Already have an account?{' '}
          </span>
          <Link
            href="/parent/login"
            className="text-xs font-bold text-[#1565D8] hover:underline"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  )
}
