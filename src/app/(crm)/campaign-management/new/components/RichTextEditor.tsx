'use client'

// Lightweight WYSIWYG email-body editor. contentEditable + a formatting
// toolbar (bold/italic/underline, alignment, font family + size, lists, link).
// Emits sanitized-enough HTML; the server re-sanitizes on send. Uses
// document.execCommand — deprecated but universally supported and dependency-
// free, which is the right trade-off for an internal composer.

import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, RemoveFormatting,
} from 'lucide-react'

export interface RichTextEditorHandle {
  insertText: (text: string) => void
  focus: () => void
}

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times', value: "'Times New Roman', serif" },
  { label: 'Courier', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
]
const SIZES = [
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '5' },
  { label: 'Huge', value: '6' },
]

export const RichTextEditor = forwardRef<RichTextEditorHandle, {
  initialHtml?: string
  onChange: (html: string) => void
  placeholder?: string
}>(function RichTextEditor({ initialHtml, onChange, placeholder }, ref) {
  const elRef = useRef<HTMLDivElement>(null)

  // Seed the DOM once; contentEditable is uncontrolled thereafter (re-setting
  // innerHTML on every keystroke would fight the caret).
  useEffect(() => {
    if (elRef.current && initialHtml != null && elRef.current.innerHTML === '') {
      elRef.current.innerHTML = initialHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => onChange(elRef.current?.innerHTML ?? '')

  const exec = (cmd: string, value?: string) => {
    elRef.current?.focus()
    document.execCommand(cmd, false, value)
    emit()
  }

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      elRef.current?.focus()
      document.execCommand('insertText', false, text)
      emit()
    },
    focus: () => elRef.current?.focus(),
  }))

  const Btn = ({ cmd, val, title, children }: { cmd: string; val?: string; title: string; children: React.ReactNode }) => (
    <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); exec(cmd, val) }} className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100">
      {children}
    </button>
  )

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-[#1565D8] focus-within:ring-2 focus-within:ring-[#1565D8]/20">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        <select onMouseDown={(e) => e.stopPropagation()} onChange={(e) => exec('fontName', e.target.value)} className="h-8 px-1.5 text-xs border border-slate-200 rounded bg-white text-slate-600 mr-1" defaultValue="" title="Font">
          {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select onMouseDown={(e) => e.stopPropagation()} onChange={(e) => exec('fontSize', e.target.value)} className="h-8 px-1.5 text-xs border border-slate-200 rounded bg-white text-slate-600 mr-1" defaultValue="3" title="Size">
          {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <Btn cmd="bold" title="Bold"><Bold className="w-4 h-4" /></Btn>
        <Btn cmd="italic" title="Italic"><Italic className="w-4 h-4" /></Btn>
        <Btn cmd="underline" title="Underline"><Underline className="w-4 h-4" /></Btn>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <Btn cmd="justifyLeft" title="Align left"><AlignLeft className="w-4 h-4" /></Btn>
        <Btn cmd="justifyCenter" title="Center"><AlignCenter className="w-4 h-4" /></Btn>
        <Btn cmd="justifyRight" title="Align right"><AlignRight className="w-4 h-4" /></Btn>
        <Btn cmd="justifyFull" title="Justify"><AlignJustify className="w-4 h-4" /></Btn>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <Btn cmd="insertUnorderedList" title="Bullet list"><List className="w-4 h-4" /></Btn>
        <Btn cmd="insertOrderedList" title="Numbered list"><ListOrdered className="w-4 h-4" /></Btn>
        <button type="button" title="Link" onMouseDown={(e) => { e.preventDefault(); const url = window.prompt('Link URL (or {{link}})'); if (url) exec('createLink', url) }} className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"><Link2 className="w-4 h-4" /></button>
        <Btn cmd="removeFormat" title="Clear formatting"><RemoveFormatting className="w-4 h-4" /></Btn>
      </div>

      {/* EDITOR */}
      <div
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder || 'Write your message…'}
        className="rte-body min-h-[200px] px-3 py-2.5 text-sm text-slate-800 focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_a]:text-[#1565D8] [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />
    </div>
  )
})
