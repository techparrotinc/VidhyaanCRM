'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { X, Send, Square, RotateCcw, Sparkles } from 'lucide-react'
import { useAiChat } from './useAiChat'

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

export function AiSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession()
  const chat = useAiChat()
  const [input, setInput] = useState('')
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Vidhyaan AI">
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />

      {/* drawer */}
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1565D8]">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">Vidhyaan AI</div>
              <div className="text-xs font-normal text-slate-400">
                {chat.remainingToday !== null
                  ? `${chat.remainingToday} messages left today`
                  : 'Your ERP copilot'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={chat.newConversation}
              title="New conversation"
              className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
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
                    Hi! I can help you use Vidhyaan — workflows, settings, and how-tos. Try one of
                    these:
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
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-[#1565D8] px-4 py-2.5 text-sm font-normal leading-relaxed text-white'
                        : 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm font-normal leading-relaxed text-slate-800'
                    }
                  >
                    {m.text}
                    {m.streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-text-bottom" />}
                  </div>
                </div>
              ))}
              {chat.error && (
                <p className="text-center text-xs font-normal text-red-500">{chat.error}</p>
              )}
            </div>

            {/* composer */}
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#1565D8]">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                  placeholder="Ask about Vidhyaan…"
                  className="max-h-32 flex-1 resize-none bg-transparent text-sm font-normal text-slate-800 outline-none placeholder:text-slate-400"
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
      </div>
    </div>
  )
}
