'use client'

// Drag-and-drop block email builder. Composes an ordered EmailBlock[] rendered
// to HTML at send time (src/lib/campaign/renderEmail.ts). Native HTML5 drag —
// no external dependency.

import React, { useRef, useState } from 'react'
import {
  GripVertical, Trash2, Plus, Type, Heading, Image as ImageIcon,
  MousePointerClick, Minus, MoveVertical, Loader2,
} from 'lucide-react'
import type { EmailBlock } from '@/lib/campaign/renderEmail'
import { appAlert } from '@/components/ui/app-alert'

const ADD_MENU: { type: EmailBlock['type']; label: string; icon: any }[] = [
  { type: 'heading', label: 'Heading', icon: Heading },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'spacer', label: 'Spacer', icon: MoveVertical },
]

function newBlock(type: EmailBlock['type']): EmailBlock {
  switch (type) {
    case 'heading': return { type: 'heading', text: 'Your heading', level: 1 }
    case 'text': return { type: 'text', text: 'Write your message here. Use {{parentName}} to personalise.' }
    case 'image': return { type: 'image', url: '' }
    case 'button': return { type: 'button', label: 'Learn more', url: '' }
    case 'divider': return { type: 'divider' }
    case 'spacer': return { type: 'spacer', size: 24 }
  }
}

export function BlockBuilder({
  blocks,
  onChange,
}: {
  blocks: EmailBlock[]
  onChange: (b: EmailBlock[]) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const update = (i: number, patch: Partial<EmailBlock>) =>
    onChange(blocks.map((b, idx) => (idx === i ? ({ ...b, ...patch } as EmailBlock) : b)))
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i))
  const add = (type: EmailBlock['type']) => { onChange([...blocks, newBlock(type)]); setShowAdd(false) }

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= blocks.length) return
    const next = [...blocks]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    onChange(next)
  }

  async function uploadImage(i: number, file: File) {
    if (file.size > 5 * 1024 * 1024) { appAlert('Image too large (max 5MB)'); return }
    setUploadingIdx(i)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('category', 'campaigns')
      const res = await fetch('/api/v1/files/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success && json.url) update(i, { url: json.url } as Partial<EmailBlock>)
      else appAlert(json.error || 'Upload failed')
    } finally { setUploadingIdx(null) }
  }

  const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1565D8]'

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No blocks yet — add one below.
        </div>
      )}

      {blocks.map((b, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null) }}
          className={`flex items-start gap-2 rounded-xl border p-3 bg-white ${dragIdx === i ? 'border-[#1565D8] opacity-60' : 'border-slate-200'}`}
        >
          <div className="flex flex-col items-center pt-1 text-slate-300 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{b.type}</span>
            </div>

            {b.type === 'heading' && (
              <div className="flex gap-2">
                <input value={b.text} onChange={(e) => update(i, { text: e.target.value })} className={inputCls} placeholder="Heading text" />
                <select value={b.level ?? 1} onChange={(e) => update(i, { level: Number(e.target.value) as 1 | 2 })} className="px-2 text-sm border border-slate-200 rounded-lg">
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                </select>
              </div>
            )}

            {b.type === 'text' && (
              <textarea value={b.text} onChange={(e) => update(i, { text: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Paragraph text… supports {{parentName}} etc." />
            )}

            {b.type === 'image' && (
              <div className="space-y-2">
                {b.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.url} alt="" className="max-h-32 rounded-lg border border-slate-200" />
                ) : null}
                <div className="flex gap-2">
                  <input value={b.url} onChange={(e) => update(i, { url: e.target.value })} className={inputCls} placeholder="Image URL or upload →" />
                  <input ref={(el) => { fileRefs.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(i, f); e.target.value = '' }} />
                  <button type="button" onClick={() => fileRefs.current[i]?.click()} disabled={uploadingIdx === i} className="px-3 text-xs font-semibold text-[#1565D8] border border-slate-200 rounded-lg hover:bg-blue-50 disabled:opacity-50">
                    {uploadingIdx === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Upload'}
                  </button>
                </div>
              </div>
            )}

            {b.type === 'button' && (
              <div className="flex gap-2">
                <input value={b.label} onChange={(e) => update(i, { label: e.target.value })} className={inputCls} placeholder="Button label" />
                <input value={b.url} onChange={(e) => update(i, { url: e.target.value })} className={inputCls} placeholder="https://… or {{link}}" />
              </div>
            )}

            {b.type === 'divider' && <div className="border-t border-slate-200" />}

            {b.type === 'spacer' && (
              <div className="flex items-center gap-2">
                <input type="range" min={4} max={80} step={4} value={b.size ?? 24} onChange={(e) => update(i, { size: Number(e.target.value) })} className="flex-1 accent-[#1565D8]" />
                <span className="text-xs text-slate-400 w-10">{b.size ?? 24}px</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-xs">▲</button>
            <button type="button" onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-xs">▼</button>
            <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}

      {/* ADD BLOCK */}
      <div className="relative">
        <button type="button" onClick={() => setShowAdd((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-[#1565D8] hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add block
        </button>
        {showAdd && (
          <div className="mt-2 flex flex-wrap gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50">
            {ADD_MENU.map((m) => (
              <button key={m.type} type="button" onClick={() => add(m.type)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-[#1565D8] hover:text-[#1565D8]">
                <m.icon className="w-3.5 h-3.5" /> {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
