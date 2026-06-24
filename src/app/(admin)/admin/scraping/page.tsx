"use client"

import React, { useState, useEffect } from 'react'
import {
  Download,
  Upload,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Play,
  FileText,
  MapPin,
  Clock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ImportRow {
  school_name: string
  city: string
  state: string
  board: string
  phone: string
  email: string
  website: string
  address: string
  isValid: boolean
  errors: string[]
}

interface ScrapingLog {
  id: string
  source: string
  targetUrl: string | null
  schoolId: string | null
  status: string
  recordsIn: number
  recordsOut: number
  error: string | null
  createdAt: string
  payload: any
}

export default function ScrapingToolsPage() {
  const [logs, setLogs] = useState<ScrapingLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  
  // CSV Import State
  const [csvRows, setCsvRows] = useState<ImportRow[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  // Maps Search State (disabled)
  const [mapsCity, setMapsCity] = useState('')

  const fetchLogs = async () => {
    try {
      setLogsLoading(true)
      const res = await fetch('/api/admin/scraping/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (err) {
      console.error('Failed to load scraping logs:', err)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Simple CSV parser that handles quotes
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/)
    return lines
      .map(line => {
        const result = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      })
      .filter(row => row.some(val => val !== ''))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const parsed = parseCSV(text)
      if (parsed.length <= 1) {
        alert('CSV file is empty or missing data rows')
        return
      }

      const headers = parsed[0].map(h => h.toLowerCase().trim())
      const schoolNameIdx = headers.indexOf('school_name')
      const cityIdx = headers.indexOf('city')
      const stateIdx = headers.indexOf('state')
      const boardIdx = headers.indexOf('board')
      const phoneIdx = headers.indexOf('phone')
      const emailIdx = headers.indexOf('email')
      const websiteIdx = headers.indexOf('website')
      const addressIdx = headers.indexOf('address')

      if (schoolNameIdx === -1 || cityIdx === -1) {
        alert('CSV must contain at least "school_name" and "city" headers')
        return
      }

      const validatedRows: ImportRow[] = parsed.slice(1).map((row, index) => {
        const school_name = row[schoolNameIdx] || ''
        const city = row[cityIdx] || ''
        const state = stateIdx !== -1 ? row[stateIdx] || '' : ''
        const board = boardIdx !== -1 ? row[boardIdx] || '' : ''
        const phone = phoneIdx !== -1 ? row[phoneIdx] || '' : ''
        const email = emailIdx !== -1 ? row[emailIdx] || '' : ''
        const website = websiteIdx !== -1 ? row[websiteIdx] || '' : ''
        const address = addressIdx !== -1 ? row[addressIdx] || '' : ''

        const errors = []
        if (!school_name) errors.push('School name is required')
        if (!city) errors.push('City is required')
        if (email && !email.includes('@')) errors.push('Invalid email format')

        return {
          school_name,
          city,
          state,
          board,
          phone,
          email,
          website,
          address,
          isValid: errors.length === 0,
          errors
        }
      })

      setCsvRows(validatedRows)
      setPreviewOpen(true)
    }
    reader.readAsText(file)
  }

  const handleImportSchools = async () => {
    try {
      setImporting(true)
      const validRows = csvRows.filter(r => r.isValid)
      if (validRows.length === 0) {
        alert('No valid rows to import')
        return
      }

      const res = await fetch('/api/admin/scraping/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: csvFileName,
          rows: validRows
        })
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to import schools')
      }

      const data = await res.json()
      alert(`Successfully imported ${data.importedCount} of ${data.totalCount} schools!`)
      setCsvRows([])
      setCsvFileName('')
      setPreviewOpen(false)
      await fetchLogs()
    } catch (err: any) {
      alert(err.message || 'Failed to import schools')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,school_name,city,state,board,phone,email,website,address\nGreenwood International School,Bangalore,Karnataka,CBSE,+919988776655,info@greenwood.edu,https://greenwood.edu,Sarjapur Road"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "school_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const validCount = csvRows.filter(r => r.isValid).length
  const invalidCount = csvRows.length - validCount

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Scraping & Import Tools</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage directory imports and view live ingestion pipeline tracking logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Import & Maps Search (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Manual CSV Import */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-650" /> Manual School Ingestion
              </h3>
              <Button
                onClick={handleDownloadTemplate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold py-1 px-3 border border-slate-200 shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Template
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
              <Upload className="w-8 h-8 text-slate-400 shrink-0" />
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-slate-700 block">Upload directory CSV sheet</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">CSV must include school_name and city fields</span>
              </div>
              <div className="relative shrink-0 sm:ml-auto">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button className="bg-slate-900 text-white font-bold text-xs py-2 px-4 shadow-sm">
                  Choose File
                </Button>
              </div>
            </div>

            {csvFileName && (
              <div className="text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>Selected: {csvFileName} ({csvRows.length} rows loaded)</span>
              </div>
            )}

            {/* Validation Preview */}
            {previewOpen && csvRows.length > 0 && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-4">
                    <span className="text-green-600 font-bold">✓ {validCount} Valid rows</span>
                    {invalidCount > 0 && <span className="text-red-500 font-bold">✗ {invalidCount} Invalid rows</span>}
                  </div>
                  <Button
                    onClick={handleImportSchools}
                    disabled={importing || validCount === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-4 shadow-md shadow-blue-500/10 flex items-center gap-1"
                  >
                    {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Import Valid Schools
                  </Button>
                </div>

                {/* Preview Table */}
                <div className="max-h-56 overflow-auto border border-slate-200 rounded-lg text-xs scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2 pl-3">School Name</th>
                        <th className="p-2">City</th>
                        <th className="p-2">Board</th>
                        <th className="p-2">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {csvRows.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className={row.isValid ? 'bg-white' : 'bg-red-50/30'}>
                          <td className="p-2 pl-3 font-bold text-slate-900">{row.school_name}</td>
                          <td className="p-2 font-semibold">{row.city}</td>
                          <td className="p-2">{row.board || 'State'}</td>
                          <td className="p-2">
                            {row.isValid ? (
                              <span className="text-green-600 font-bold">✓ Ready</span>
                            ) : (
                              <span className="text-red-500 font-bold" title={row.errors.join(', ')}>
                                ✗ Error: {row.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 15 && (
                  <p className="text-[10px] text-slate-400 text-center font-semibold">+ {csvRows.length - 15} more rows loaded</p>
                )}
              </div>
            )}
          </Card>

          {/* Import History */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-650" /> Import History
              </h3>
              <p className="text-xs text-slate-400 mt-1">Review status and statistics of previous manual CSV uploads</p>
            </div>

            {logsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : logs.filter(l => l.source === 'CSV_IMPORT').length === 0 ? (
              <div className="py-8 text-center text-slate-450 text-xs">No manual imports found in history.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2 pl-3">Date</th>
                      <th className="p-2">File</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Imported</th>
                      <th className="p-2">Errors</th>
                      <th className="p-2 pr-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {logs
                      .filter(l => l.source === 'CSV_IMPORT')
                      .map((log) => {
                        const payload = log.payload as any
                        const fileName = payload?.fileName || 'manual_import.csv'
                        const total = log.recordsIn
                        const imported = log.recordsOut
                        const errors = total - imported
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-2 pl-3 text-slate-400 font-bold">{new Date(log.createdAt).toLocaleDateString()}</td>
                            <td className="p-2 font-bold text-slate-900 truncate max-w-[120px]" title={fileName}>{fileName}</td>
                            <td className="p-2 font-bold text-slate-850">{total}</td>
                            <td className="p-2 text-green-600 font-bold">{imported}</td>
                            <td className="p-2 text-red-500 font-bold">{errors}</td>
                            <td className="p-2 pr-3 text-right">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                                log.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-150' : 
                                log.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                'bg-red-50 text-red-700 border border-red-150'
                              }`}>{log.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Google Maps Search Ingestion */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-650" /> Google Maps API Search
              </h3>
              <p className="text-xs text-slate-400 mt-1">Search and ingest directories for local regions using maps scraping hooks</p>
            </div>

            <div className="flex gap-3 max-w-md relative">
              <input
                type="text"
                disabled
                placeholder="Enter city (e.g. Pune, Jaipur)..."
                value={mapsCity}
                onChange={(e) => setMapsCity(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 p-2 text-xs font-medium bg-slate-50 text-slate-400 cursor-not-allowed outline-hidden"
              />
              <Button disabled className="bg-slate-350 text-white font-bold text-xs px-4 py-2 shrink-0 cursor-not-allowed">
                Search Maps
              </Button>
              
              {/* Phase 2 badge overlay */}
              <span className="absolute -top-6 right-0 bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded-full text-[9px] font-bold">
                Coming in Phase 2
              </span>
            </div>
          </Card>
        </div>

        {/* Right Side: Scraping Logs (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scraping Logs */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4 min-h-[460px]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-650" /> Pipeline Ingestion Logs
            </h3>

            {logsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">No scraping logs found in database.</div>
            ) : (
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">{log.source}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                        log.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                      }`}>{log.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 pt-1 leading-normal font-semibold">
                      Records processed: {log.recordsOut} of {log.recordsIn}
                    </div>
                    {log.error && <p className="text-[9px] text-red-500 font-semibold truncate mt-0.5">{log.error}</p>}
                    <span className="text-[8px] text-slate-400 self-end mt-1 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
