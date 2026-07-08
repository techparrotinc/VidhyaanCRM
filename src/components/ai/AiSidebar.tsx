'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { X, Send, Square, RotateCcw, Sparkles, Minus, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { useAiChat, AiMessage, FeedbackCategory } from './useAiChat'
import { AiFeedbackDialog } from './AiFeedbackDialog'

const SUGGESTIONS_BY_ROLE: Record<string, string[]> = {
  ORG_ADMIN: [
    'How do I promote students to the next academic year?',
    'How do I customize the fee reminder email?',
    'What are admission stages and how do I change them?'
  ],
  BRANCH_ADMIN: [
    'How do I move an admission to the next stage?',
    'How do I announce an event to parents?',
    'How do I add a new user to my school?'
  ],
  COUNSELLOR: [
    'How do I follow up on admission leads effectively?',
    'How do I convert a lead into an admission?',
    'What does each lead status mean?'
  ],
  RECEPTIONIST: [
    'How do I register a new enquiry?',
    'How do I schedule a school visit for a parent?'
  ],
  ACCOUNTANT: [
    'How do I record an offline fee payment?',
    'How do I send fee reminders to parents?',
    'How do I export invoices as PDF?'
  ],
  TEACHER: ['How do I view my students?', 'How do events and RSVPs work?']
}

export function AiSidebar({
  open,
  onClose,
  chat
}: {
  open: boolean
  onClose: () => void
  chat: ReturnType<typeof useAiChat> // state lives in the launcher — minimize keeps the conversation
}) {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [feedbackFor, setFeedbackFor] = useState<AiMessage | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyMessage = (m: AiMessage) => {
    void navigator.clipboard.writeText(m.text)
    setCopiedId(m.id)
    setTimeout(() => setCopiedId(null), 1500)
  }
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const role = (session?.user as any)?.role ?? 'ORG_ADMIN'
  const suggestions = SUGGESTIONS_BY_ROLE[role] ?? SUGGESTIONS_BY_ROLE.ORG_ADMIN

  useEffect(() => {
    if (open) {
      chat.checkEntitlement()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat.messages])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const submit = () => {
    if (!input.trim()) return
    chat.send(input)
    setInput('')
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    // portaled to <body> + very high z: no app header/sidebar stacking context
    // can cover the drawer or its controls
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Vidhyaan AI">
      {/* backdrop — click to minimize */}
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />

      {/* drawer */}
      {/* Neon-style width: comfortable reading pane on desktop, full-screen on mobile */}
      <div className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-[520px] xl:max-w-[640px]">
        {/* header — always visible, owns the controls */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1565D8]">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">Vidhyaan AI</div>
              <div className="text-xs font-normal text-slate-400">
                {chat.creditsLeft !== null
                  ? `${chat.creditsLeft} AI credit${chat.creditsLeft === 1 ? '' : 's'} left`
                  : 'Your Vidhyaan copilot'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={chat.newConversation}
              title="New conversation"
              aria-label="Start new conversation"
              className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <RotateCcw className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={onClose}
              title="Minimize — conversation is kept"
              aria-label="Minimize chat"
              className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <Minus className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              aria-label="Close chat"
              className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* not entitled */}
        {chat.entitled === false ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <Sparkles className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              AI Copilot is not enabled for your school
            </p>
            <p className="text-sm font-normal leading-relaxed text-slate-500">
              Ask your administrator to enable the AI Copilot add-on in subscription settings.
            </p>
          </div>
        ) : (
          <>
            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
              {chat.messages.length === 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-sm font-normal leading-relaxed text-slate-500">
                    Hi! I can help you run your school, learning centre or coaching institute on
                    Vidhyaan — workflows, settings, live numbers, and how-tos. Try one of these:
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => chat.send(s)}
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-normal text-slate-700 hover:border-[#1565D8] hover:bg-blue-50/50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chat.messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex flex-col items-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-[#1565D8] px-4 py-2.5 text-sm font-normal leading-relaxed text-white'
                        : 'max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm font-normal leading-relaxed text-slate-800'
                    }
                  >
                    {m.text}
                    {m.streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-text-bottom" />}
                    {!m.streaming && m.citations && m.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                        {m.citations.map((c) =>
                          c.appRoute ? (
                            <a
                              key={c.docId}
                              href={c.appRoute}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#1565D8] hover:border-[#1565D8]"
                            >
                              {c.title}
                            </a>
                          ) : (
                            <span
                              key={c.docId}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500"
                            >
                              {c.title}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  {/* action row — assistant messages only, after streaming */}
                  {m.role === 'assistant' && !m.streaming && m.text && (
                    <div className="mt-1 flex items-center gap-0.5 pl-1">
                      <button
                        onClick={() => copyMessage(m)}
                        title="Copy"
                        aria-label="Copy answer"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => chat.sendFeedback(m, 1)}
                        title="Good answer"
                        aria-label="Thumbs up"
                        className={`rounded-md p-1.5 hover:bg-slate-100 ${m.feedback === 1 ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setFeedbackFor(m)}
                        title="Bad answer — tell us why"
                        aria-label="Thumbs down"
                        className={`rounded-md p-1.5 hover:bg-slate-100 ${m.feedback === -1 ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {chat.error && (
                <p className="text-center text-xs font-normal text-red-500">{chat.error}</p>
              )}
              {chat.creditsLeft === 0 && (
                <Link
                  href="/settings/addons"
                  className="mx-auto block w-fit rounded-lg bg-[#1565D8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1255b8]"
                >
                  Top up AI credits →
                </Link>
              )}
            </div>

            {/* composer */}
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#1565D8]">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    // auto-grow with content, capped by max-h — no inner scroll jump
                    e.currentTarget.style.height = 'auto'
                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 128)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                      e.currentTarget.style.height = 'auto'
                    }
                  }}
                  placeholder="Ask about Vidhyaan…"
                  className="max-h-32 flex-1 resize-none bg-transparent text-sm font-normal leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                />
                {chat.status === 'streaming' ? (
                  <button
                    onClick={chat.stop}
                    title="Stop"
                    className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={!input.trim()}
                    title="Send"
                    className="rounded-lg bg-[#1565D8] p-2 text-white disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-xs font-normal text-slate-400">
                AI can make mistakes — verify important information.
              </p>
            </div>
          </>
        )}

        {/* negative-feedback dialog (bottom sheet inside the drawer) */}
        {feedbackFor && (
          <AiFeedbackDialog
            onClose={() => setFeedbackFor(null)}
            onSubmit={(categories: FeedbackCategory[], comment: string) =>
              chat.sendFeedback(feedbackFor, -1, categories, comment || undefined)
            }
          />
        )}
      </div>
    </div>,
    document.body
  )
}
