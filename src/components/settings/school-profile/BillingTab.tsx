"use client"

import React, { useState, useEffect } from 'react'
import { Loader2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]'
const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500'

/**
 * Billing details (Bill-To address + GSTIN) — printed on subscription GST
 * invoices. Self-contained: loads from /api/v1/billing, saves via
 * /api/v1/billing/profile.
 */
export default function BillingTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [gstin, setGstin] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  // Ship-To (optional — invoices fall back to the billing address)
  const [shipSame, setShipSame] = useState(true)
  const [shipAddressLine, setShipAddressLine] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipState, setShipState] = useState('')
  const [shipPincode, setShipPincode] = useState('')
  // Printed as "P.O.#" on GST invoices when set
  const [poNumber, setPoNumber] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/billing')
        const data = await res.json()
        if (res.ok && data.billingProfile) {
          setGstin(data.billingProfile.gstin || '')
          const parts = data.billingProfile.addressParts || {}
          setAddressLine(parts.addressLine || '')
          setCity(parts.city || '')
          setState(parts.state || '')
          setPincode(parts.pincode || '')
          const ship = data.billingProfile.shippingParts
          if (ship?.addressLine) {
            setShipSame(false)
            setShipAddressLine(ship.addressLine || '')
            setShipCity(ship.city || '')
            setShipState(ship.state || '')
            setShipPincode(ship.pincode || '')
          }
          setPoNumber(data.billingProfile.poNumber || '')
        }
      } catch (e) {
        console.error('Failed to load billing profile:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/v1/billing/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstin: gstin || '',
          addressLine, city, state, pincode,
          // Same-as-billing clears the stored Ship-To so invoices fall back
          shippingAddressLine: shipSame ? '' : shipAddressLine,
          shippingCity: shipSame ? '' : shipCity,
          shippingState: shipSame ? '' : shipState,
          shippingPincode: shipSame ? '' : shipPincode,
          poNumber: poNumber || ''
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.details ? Object.values(data.details).flat().join(', ') : data.error
        throw new Error(detail || 'Failed to save billing details')
      }
      setMessage({ type: 'success', text: 'Billing details saved — they will appear on your next GST invoice.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#1565D8]" /> Billing Details
        </h3>
        <p className="text-xs text-slate-400">
          Bill-To address and GSTIN printed on your Vidhyaan subscription GST invoices.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className={labelCls}>GSTIN (optional)</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            placeholder="e.g. 33ABCDE1234F1Z5"
            maxLength={15}
            className={`${inputCls} tracking-wider md:w-80`}
          />
          <p className="text-[11px] text-slate-400">Add your GSTIN to claim input tax credit on subscription invoices.</p>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className={labelCls}>Billing Address</label>
          <input
            type="text"
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Door No, Street Name, Locality"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>City</label>
          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>State</label>
          <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Pincode</label>
          <input
            type="text"
            required
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="600001"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2 pt-2">
          <label className={labelCls}>Ship-To Address</label>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shipSame}
              onChange={(e) => setShipSame(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-[#1565D8]"
            />
            Same as billing address
          </label>
        </div>

        {!shipSame && (
          <>
            <div className="space-y-1.5 md:col-span-2">
              <input
                type="text"
                value={shipAddressLine}
                onChange={(e) => setShipAddressLine(e.target.value)}
                placeholder="Door No, Street Name, Locality"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>City</label>
              <input type="text" value={shipCity} onChange={(e) => setShipCity(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>State</label>
              <input type="text" value={shipState} onChange={(e) => setShipState(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Pincode</label>
              <input
                type="text"
                value={shipPincode}
                onChange={(e) => setShipPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="600001"
                className={inputCls}
              />
            </div>
          </>
        )}

        <div className="space-y-1.5 md:col-span-2 pt-2">
          <label className={labelCls}>P.O. Number (optional)</label>
          <input
            type="text"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Printed as P.O.# on your GST invoices"
            maxLength={50}
            className={`${inputCls} md:w-80`}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Billing Details'}
        </Button>
      </div>
    </form>
  )
}
