"use client"

import React, { useState, useEffect } from 'react'
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Lock,
  Plus,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Stage {
  id: string
  name: string
  color: string
  sortOrder: number
  isWon: boolean
  isLost: boolean
  requiresDocs: boolean
  requiresPayment: boolean
}

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add stage form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('blue')
  const [adding, setAdding] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const colors = ['blue', 'amber', 'orange', 'green', 'red', 'violet', 'indigo', 'cyan']

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/v1/settings/pipeline')
      if (!res.ok) throw new Error('Failed to fetch stages')
      const json = await res.json()
      setStages(json.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Error loading stages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStages()
  }, [])

  const getStageColorClass = (colorName: string) => {
    switch (colorName) {
      case 'blue': return 'bg-blue-500'
      case 'amber': return 'bg-amber-500'
      case 'orange': return 'bg-orange-500'
      case 'green': return 'bg-green-500'
      case 'red': return 'bg-red-500'
      case 'violet': return 'bg-violet-500'
      case 'indigo': return 'bg-indigo-500'
      case 'cyan': return 'bg-cyan-500'
      default: return 'bg-slate-500'
    }
  }

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStageName.trim()) return

    setAdding(true)
    try {
      const res = await fetch('/api/v1/settings/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageName,
          color: newStageColor
        })
      })

      if (!res.ok) throw new Error('Failed to add stage')
      
      setNewStageName('')
      setNewStageColor('blue')
      setShowAddForm(false)
      await fetchStages()
    } catch (err: any) {
      alert(err.message || 'Could not add stage')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdateStageName = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }

    try {
      const res = await fetch(`/api/v1/settings/pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName })
      })

      if (!res.ok) throw new Error('Failed to update stage name')
      await fetchStages()
    } catch (err: any) {
      alert(err.message || 'Could not update stage name')
    } finally {
      setEditingId(null)
    }
  }

  const handleToggleOption = async (id: string, field: 'requiresDocs' | 'requiresPayment', currentValue: boolean) => {
    try {
      const res = await fetch(`/api/v1/settings/pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue })
      })

      if (!res.ok) throw new Error('Failed to update stage settings')
      await fetchStages()
    } catch (err: any) {
      alert(err.message || 'Could not update stage settings')
    }
  }

  const handleDeleteStage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete stage "${name}"?`)) return

    try {
      const res = await fetch(`/api/v1/settings/pipeline/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Failed to delete stage')
      }
      
      await fetchStages()
    } catch (err: any) {
      alert(err.message || 'Could not delete stage')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= stages.length) return

    const currentStage = stages[index]
    const targetStage = stages[targetIndex]

    if (currentStage.isWon || currentStage.isLost || targetStage.isWon || targetStage.isLost) {
      return // cannot reorder terminal stages
    }

    try {
      const res = await fetch('/api/v1/settings/pipeline/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stages: [
            { id: currentStage.id, order: targetStage.sortOrder },
            { id: targetStage.id, order: currentStage.sortOrder }
          ]
        })
      })

      if (!res.ok) throw new Error('Failed to reorder stages')
      await fetchStages()
    } catch (err: any) {
      alert(err.message || 'Could not reorder stages')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
        <Button onClick={fetchStages} className="mt-4 bg-[#1565D8] text-white">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Admission Pipeline</h3>
          <p className="text-sm text-slate-500">Manage admission workflow stages, order, and document/payment rules.</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const isTerminal = stage.isWon || stage.isLost
            const isEditing = editingId === stage.id

            return (
              <div
                key={stage.id}
                className={`flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 ${
                  isTerminal ? 'opacity-85' : 'hover:border-blue-200'
                }`}
              >
                {/* Stage Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-bold text-slate-400 font-mono w-6">
                    #{index + 1}
                  </span>
                  <div className={`w-3 h-3 rounded-full shrink-0 ${getStageColorClass(stage.color)}`} />
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleUpdateStageName(stage.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateStageName(stage.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="text-sm font-semibold text-slate-800 border border-[#1565D8] rounded-md px-2 py-1 outline-none bg-white max-w-[150px] sm:max-w-xs"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      onClick={() => {
                        if (!isTerminal) {
                          setEditingId(stage.id)
                          setEditingName(stage.name)
                        }
                      }}
                      className={`text-sm font-semibold text-slate-800 truncate ${
                        !isTerminal ? 'cursor-pointer hover:underline decoration-blue-500 decoration-2' : ''
                      }`}
                    >
                      {stage.name}
                    </span>
                  )}
                </div>

                {/* Settings & Toggles */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  {/* Documents required toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                      Docs Req.
                    </span>
                    <input
                      type="checkbox"
                      checked={stage.requiresDocs}
                      onChange={() => handleToggleOption(stage.id, 'requiresDocs', stage.requiresDocs)}
                      disabled={isTerminal}
                      className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] cursor-pointer disabled:opacity-50"
                    />
                  </label>

                  {/* Payment required toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                      Pay Req.
                    </span>
                    <input
                      type="checkbox"
                      checked={stage.requiresPayment}
                      onChange={() => handleToggleOption(stage.id, 'requiresPayment', stage.requiresPayment)}
                      disabled={isTerminal}
                      className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] cursor-pointer disabled:opacity-50"
                    />
                  </label>

                  {/* Move & Delete Actions */}
                  <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                    {isTerminal ? (
                      <div className="p-2 text-slate-400" title="Terminal stage locked">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0 || stages[index - 1].isWon || stages[index - 1].isLost}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === stages.length - 1 || stages[index + 1].isWon || stages[index + 1].isLost}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStage(stage.id, stage.name)}
                          className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          title="Delete Stage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Stage Form & Button */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          {showAddForm ? (
            <form onSubmit={handleAddStage} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-800">Add Pipeline Stage</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="e.g. Follow-up Needed"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-[#1565D8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Color Indicator
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewStageColor(c)}
                        className={`w-6 h-6 rounded-full shrink-0 transition-all ${getStageColorClass(c)} ${
                          newStageColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adding || !newStageName.trim()}
                  className="bg-[#1565D8] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Stage'}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="border border-slate-200 bg-white text-[#1565D8] hover:bg-blue-50 font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Pipeline Stage
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
