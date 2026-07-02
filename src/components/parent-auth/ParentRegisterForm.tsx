'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

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
  const [email, setEmail] = useState('')
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

    if (email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
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
          email: email.trim() || undefined,
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
      <div className="space-y-1.5 mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-805">
          Create Parent Account
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Find and apply to the best schools near you
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 animate-fadeIn">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-505">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
            required
          />
        </div>

        {/* Phone Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-505">
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
              className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-505">
              Email Address
            </label>
            <span className="text-[10px] font-medium text-slate-400">Optional but recommended</span>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
          />
        </div>

        {/* City Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-505">
            Your City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Terms Acceptance */}
        <div className="flex items-start gap-2.5 pt-1">
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
            <a href="/terms" target="_blank" className="text-[#1565D8] font-bold hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-[#1565D8] font-bold hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading || phone.length < 10 || name.length < 2 || !agreeTerms}
          className="w-full flex items-center justify-center py-3 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/25 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm mt-2"
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
        <div className="pt-5 border-t border-slate-100 text-center mt-5">
          <span className="text-xs text-slate-400 font-medium">
            Already have an account?{' '}
          </span>
          <Link
            href="/login"
            className="text-xs font-bold text-[#1565D8] hover:underline"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  )
}
