"use client"

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Shield,
  Key,
  CreditCard,
  Bell,
  Mail,
  Cloud,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Save,
  Send,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminSettingsPage() {
  // Settings State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fields
  const [freePlanLeadCap, setFreePlanLeadCap] = useState(10)
  const [trialDurationDays, setTrialDurationDays] = useState(7)
  const [defaultOtpTtlMinutes, setDefaultOtpTtlMinutes] = useState(10)

  // Feature Flags
  const [enableWhatsapp, setEnableWhatsapp] = useState(false)
  const [enableCampaignModule, setEnableCampaignModule] = useState(false)
  const [enableAiFeatures, setEnableAiFeatures] = useState(false)
  const [enablePublicApiAccess, setEnablePublicApiAccess] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [enabledBillingCycles, setEnabledBillingCycles] = useState<string[]>(['MONTHLY', 'ANNUAL'])
  const [pricesIncludeGst, setPricesIncludeGst] = useState(false)

  // Business / seller details printed on subscription GST invoices
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessGstin, setBusinessGstin] = useState('')

  // Emails
  const [fromEmailAddress, setFromEmailAddress] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [fromName, setFromName] = useState('')

  // Notifications
  const [opsAlertEmail, setOpsAlertEmail] = useState('')
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')

  // Razorpay
  const [razorpayLiveKey, setRazorpayLiveKey] = useState('')
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('')
  const [showRazorpayKey, setShowRazorpayKey] = useState(false)

  // Storage
  const [doSpacesEndpoint, setDoSpacesEndpoint] = useState('')
  const [doSpacesBucket, setDoSpacesBucket] = useState('')
  const [doSpacesCdnUrl, setDoSpacesCdnUrl] = useState('')

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to load platform settings')
      const data = await res.json()
      
      setFreePlanLeadCap(data.freePlanLeadCap)
      setTrialDurationDays(data.trialDurationDays)
      setDefaultOtpTtlMinutes(data.defaultOtpTtlMinutes)
      
      setEnableWhatsapp(data.enableWhatsapp)
      setEnableCampaignModule(data.enableCampaignModule)
      setEnableAiFeatures(data.enableAiFeatures)
      setEnablePublicApiAccess(data.enablePublicApiAccess)
      setMaintenanceMode(data.maintenanceMode)
      setEnabledBillingCycles(data.enabledBillingCycles?.length ? data.enabledBillingCycles : ['MONTHLY', 'ANNUAL'])
      setPricesIncludeGst(!!data.pricesIncludeGst)
      setBusinessName(data.businessName || '')
      setBusinessAddress(data.businessAddress || '')
      setBusinessGstin(data.businessGstin || '')

      setFromEmailAddress(data.fromEmailAddress || '')
      setSupportEmail(data.supportEmail || '')
      setFromName(data.fromName || '')

      setOpsAlertEmail(data.opsAlertEmail || '')
      setSlackWebhookUrl(data.slackWebhookUrl || '')

      setRazorpayLiveKey(data.razorpayLiveKey || '')
      setRazorpayWebhookSecret(data.razorpayWebhookSecret || '')

      setDoSpacesEndpoint(data.doSpacesEndpoint || '')
      setDoSpacesBucket(data.doSpacesBucket || '')
      setDoSpacesCdnUrl(data.doSpacesCdnUrl || '')

      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error loading platform settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleToggleFlag = async (flagName: string, currentVal: boolean) => {
    try {
      const payload = { [flagName]: !currentVal }
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update feature flag')
      
      // Update local state
      if (flagName === 'enableWhatsapp') setEnableWhatsapp(!currentVal)
      if (flagName === 'enableCampaignModule') setEnableCampaignModule(!currentVal)
      if (flagName === 'enableAiFeatures') setEnableAiFeatures(!currentVal)
      if (flagName === 'enablePublicApiAccess') setEnablePublicApiAccess(!currentVal)
      if (flagName === 'maintenanceMode') setMaintenanceMode(!currentVal)

    } catch (err: any) {
      alert(err.message || 'Error updating feature flags')
    }
  }

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        freePlanLeadCap,
        trialDurationDays,
        defaultOtpTtlMinutes,
        fromEmailAddress,
        supportEmail,
        fromName,
        opsAlertEmail,
        slackWebhookUrl,
        razorpayLiveKey,
        razorpayWebhookSecret,
        doSpacesEndpoint,
        doSpacesBucket,
        doSpacesCdnUrl,
        businessName,
        businessAddress,
        businessGstin
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update settings parameters')
      alert('Platform configurations saved successfully!')
      await fetchSettings()
    } catch (err: any) {
      alert(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true)
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send test email')
      }
      alert('Success: Test email sent to your admin mailbox!')
    } catch (err: any) {
      alert(err.message || 'Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  const maskKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '********'
    return `${key.slice(0, 4)}****************${key.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 text-center max-w-md mx-auto mt-20 select-none text-red-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Settings</h3>
        <p className="text-sm mt-2 text-slate-500">{error}</p>
        <Button onClick={fetchSettings} className="mt-4 bg-blue-600 text-white font-bold text-xs py-2 px-4 shadow-sm">
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Platform Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure platform settings, feature flags, integrations and operations thresholds</p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 shadow-sm flex items-center gap-1.5 self-start"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configurations
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Forms (8 Cols) */}
        <form onSubmit={handleSaveAll} className="lg:col-span-8 space-y-6">
          {/* General Config Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-650" /> Platform Configurations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-450 mb-1.5">Free Plan Lead Cap</label>
                <input
                  type="number"
                  value={freePlanLeadCap}
                  onChange={(e) => setFreePlanLeadCap(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">Trial Duration (Days)</label>
                <input
                  type="number"
                  value={trialDurationDays}
                  onChange={(e) => setTrialDurationDays(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">Default OTP TTL (Mins)</label>
                <input
                  type="number"
                  value={defaultOtpTtlMinutes}
                  onChange={(e) => setDefaultOtpTtlMinutes(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Business / Invoice Details Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-blue-650" /> Business / Invoice Details (Seller)
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 -mt-2">
              Printed on every subscription GST invoice as the seller. Keep in sync with your Razorpay account business profile.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-450 mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="TechParrot Pvt. Ltd."
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">GSTIN</label>
                <input
                  type="text"
                  value={businessGstin}
                  onChange={(e) => setBusinessGstin(e.target.value.toUpperCase())}
                  placeholder="33ABCDE1234F1Z5"
                  maxLength={15}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium tracking-wider outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-slate-450 mb-1.5">Registered Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Full registered address incl. city, state, pincode"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Email Settings Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-650" /> Email Configurations (ZeptoMail)
              </h3>
              <Button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold py-1 px-3 border border-slate-200 shadow-xs flex items-center gap-1 disabled:opacity-50"
              >
                {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Test Email
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-450 mb-1.5">From Email Address</label>
                <input
                  type="email"
                  value={fromEmailAddress}
                  onChange={(e) => setFromEmailAddress(e.target.value)}
                  placeholder="noreply@vidhyaan.com"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@vidhyaan.com"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">From Name</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Vidhyaan Team"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Razorpay & Payment Gateway Settings */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-650" /> Razorpay Integrations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div className="relative">
                <label className="block text-slate-450 mb-1.5">Razorpay Live API Key</label>
                <div className="relative">
                  <input
                    type={showRazorpayKey ? 'text' : 'password'}
                    value={razorpayLiveKey}
                    onChange={(e) => setRazorpayLiveKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 pr-10 font-medium outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRazorpayKey(!showRazorpayKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showRazorpayKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">Webhook Secret Key</label>
                <input
                  type="password"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Storage & DO Spaces Settings */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-blue-650" /> Storage Solutions (DO Spaces / CDN)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-450 mb-1.5">Spaces Endpoint</label>
                <input
                  type="text"
                  value={doSpacesEndpoint}
                  onChange={(e) => setDoSpacesEndpoint(e.target.value)}
                  placeholder="sgp1.digitaloceanspaces.com"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">Bucket Name</label>
                <input
                  type="text"
                  value={doSpacesBucket}
                  onChange={(e) => setDoSpacesBucket(e.target.value)}
                  placeholder="vidhyaan-assets"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">CDN Custom URL</label>
                <input
                  type="text"
                  value={doSpacesCdnUrl}
                  onChange={(e) => setDoSpacesCdnUrl(e.target.value)}
                  placeholder="https://cdn.vidhyaan.com"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 flex justify-between items-center pt-2">
              <span>Estimated Storage Used: 4.86 GB (0.4% of total)</span>
            </div>
          </Card>
        </form>

        {/* Right Side: Feature Flags & Alerts (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Feature Flags Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-650" /> System Feature Flags
            </h3>

            <div className="space-y-4">
              {/* Whatsapp */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">WhatsApp Notifications</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Enables automated alerts via WhatsApp API</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag('enableWhatsapp', enableWhatsapp)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    enableWhatsapp ? 'bg-blue-600' : 'bg-slate-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    enableWhatsapp ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Campaign */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Campaign Module</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Enables bulk SMS and email campaigns</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag('enableCampaignModule', enableCampaignModule)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    enableCampaignModule ? 'bg-blue-600' : 'bg-slate-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    enableCampaignModule ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* AI Features */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">AI Enrichment Features</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Unlocks Gemini-powered response drafting</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag('enableAiFeatures', enableAiFeatures)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    enableAiFeatures ? 'bg-blue-600' : 'bg-slate-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    enableAiFeatures ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Public API */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Public API Access</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Unlocks access to developers portals</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag('enablePublicApiAccess', enablePublicApiAccess)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    enablePublicApiAccess ? 'bg-blue-600' : 'bg-slate-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    enablePublicApiAccess ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div>
                  <span className="text-xs font-bold text-slate-900 block text-red-650">Maintenance Mode</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Places entire platform under maintenance view</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag('maintenanceMode', maintenanceMode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    maintenanceMode ? 'bg-red-650 animate-pulse' : 'bg-slate-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </Card>

          {/* Billing Cycles Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-650" /> Billing Cycles
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 -mt-2">
              Cycles schools can subscribe with. At least one must stay enabled; annual is pre-selected for schools when available.
            </p>
            <div className="space-y-3">
              {[
                { key: 'MONTHLY', label: 'Monthly', hint: 'Full price, billed every month' },
                { key: 'QUARTERLY', label: '3 Months', hint: '3 × monthly price, billed quarterly' },
                { key: 'ANNUAL', label: 'Yearly', hint: 'Pay for 10 months — 2 months free' }
              ].map((cycle) => {
                const enabled = enabledBillingCycles.includes(cycle.key)
                return (
                  <div key={cycle.key} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{cycle.label}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{cycle.hint}</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = enabled
                          ? enabledBillingCycles.filter((c) => c !== cycle.key)
                          : [...enabledBillingCycles, cycle.key]
                        if (next.length === 0) {
                          alert('At least one billing cycle must stay enabled.')
                          return
                        }
                        const res = await fetch('/api/admin/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ enabledBillingCycles: next })
                        })
                        if (res.ok) setEnabledBillingCycles(next)
                        else alert('Failed to update billing cycles')
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        enabled ? 'bg-blue-600' : 'bg-slate-250'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                        enabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )
              })}

              {/* GST pricing mode */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Prices Include GST</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    On: catalog prices are final (GST carved out on the invoice). Off: 18% GST added at checkout.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const next = !pricesIncludeGst
                    const res = await fetch('/api/admin/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pricesIncludeGst: next })
                    })
                    if (res.ok) setPricesIncludeGst(next)
                    else alert('Failed to update GST pricing mode')
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    pricesIncludeGst ? 'bg-blue-600' : 'bg-slate-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    pricesIncludeGst ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </Card>

          {/* Ops Alert notifications Settings */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-blue-650" /> Alerts Channels
            </h3>
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-450 mb-1.5">Ops Email for Alerts</label>
                <input
                  type="email"
                  value={opsAlertEmail}
                  onChange={(e) => setOpsAlertEmail(e.target.value)}
                  placeholder="ops@vidhyaan.com"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 mb-1.5">Slack Webhook URL (Optional)</label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
