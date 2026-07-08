'use client'

import { useCallback, useRef, useState } from 'react'
import { useAcademicYearStore } from '@/stores/academic-year.store'

const GATEWAY = process.env.NEXT_PUBLIC_AI_GATEWAY_URL ?? 'https://ai.vidhyaan.com'

export type AiCitation = { docId: string; title: string; appRoute: string }

export type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  citations?: AiCitation[]
  serverMessageId?: string // gateway message id — feedback targets this
  feedback?: 1 | -1
}

export type FeedbackCategory = 'didnt_answer' | 'inaccurate' | 'irrelevant_citations' | 'other'

export type AiChatState = {
  messages: AiMessage[]
  status: 'idle' | 'streaming' | 'error'
  error: string | null
  entitled: boolean | null // null = unknown yet
  remainingToday: number | null
  creditsLeft: number | null // AI credit wallet balance (free + purchased)
}

type TokenCache = { token: string; expiresAt: number }

/**
 * Chat state + transport. Token minted by the ERP (module-gated) and cached
 * until ~30s before expiry; SSE parsed from a POST fetch stream.
 */
export function useAiChat() {
  const [state, setState] = useState<AiChatState>({
    messages: [],
    status: 'idle',
    error: null,
    entitled: null,
    remainingToday: null,
    creditsLeft: null
  })
  const tokenRef = useRef<TokenCache | null>(null)
  const sessionRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const getToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current && tokenRef.current.expiresAt > Date.now() + 30_000) {
      return tokenRef.current.token
    }
    const res = await fetch('/api/v1/ai/token')
    if (res.status === 403 || res.status === 402) {
      setState((s) => ({ ...s, entitled: false }))
      return null
    }
    if (!res.ok) throw new Error(`token mint failed (${res.status})`)
    const json = await res.json()
    tokenRef.current = {
      token: json.data.token,
      expiresAt: Date.now() + json.data.expiresIn * 1000
    }
    setState((s) => ({
      ...s,
      entitled: true,
      creditsLeft: typeof json.data.creditsRemaining === 'number' ? json.data.creditsRemaining : s.creditsLeft
    }))
    return json.data.token
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || state.status === 'streaming') return

      const userMsg: AiMessage = { id: crypto.randomUUID(), role: 'user', text: trimmed }
      const assistantMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: '',
        streaming: true
      }
      setState((s) => ({
        ...s,
        status: 'streaming',
        error: null,
        messages: [...s.messages, userMsg, assistantMsg]
      }))

      const patchAssistant = (patch: Partial<AiMessage>) =>
        setState((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, ...patch } : m))
        }))

      try {
        const token = await getToken()
        if (!token) {
          patchAssistant({ text: 'AI Copilot is not enabled for your school.', streaming: false })
          setState((s) => ({ ...s, status: 'idle' }))
          return
        }

        const academicYearId = useAcademicYearStore.getState().selectedYearId ?? undefined
        abortRef.current = new AbortController()
        const res = await fetch(`${GATEWAY}/v1/ai/chat`, {
          method: 'POST',
          signal: abortRef.current.signal,
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: sessionRef.current,
            message: trimmed,
            context: {
              route: window.location.pathname,
              ...(academicYearId ? { academicYearId } : {})
            }
          })
        })
        if (res.status === 402) {
          setState((s) => ({ ...s, creditsLeft: 0 }))
          patchAssistant({
            text: 'Your AI credits are used up for now. Top up in Settings → Add-ons to keep chatting.',
            streaming: false
          })
          setState((s) => ({ ...s, status: 'idle' }))
          return
        }
        if (res.status === 429) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.message ?? 'Daily AI limit reached.')
        }
        if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let acc = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            let evt: any
            try {
              evt = JSON.parse(line.slice(6))
            } catch {
              continue
            }
            if (evt.type === 'meta') sessionRef.current = evt.conversationId
            if (evt.type === 'citation') {
              setState((s) => ({
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, citations: [...(m.citations ?? []), evt.citation] }
                    : m
                )
              }))
            }
            if (evt.type === 'token') {
              acc += evt.text
              patchAssistant({ text: acc })
            }
            if (evt.type === 'usage') {
              setState((s) => ({
                ...s,
                creditsLeft: typeof evt.creditsRemaining === 'number' ? evt.creditsRemaining : s.creditsLeft
              }))
            }
            if (evt.type === 'done') {
              setState((s) => ({
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, serverMessageId: evt.messageId } : m
                )
              }))
            }
            if (evt.type === 'error') throw new Error(evt.message)
          }
        }
        patchAssistant({ streaming: false })
        setState((s) => ({ ...s, status: 'idle' }))
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          patchAssistant({ streaming: false })
          setState((s) => ({ ...s, status: 'idle' }))
          return
        }
        patchAssistant({
          text: assistantMsg.text || 'Something went wrong. Please try again.',
          streaming: false
        })
        setState((s) => ({ ...s, status: 'error', error: err?.message ?? 'Unknown error' }))
      }
    },
    [getToken, state.status]
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const sendFeedback = useCallback(
    async (msg: AiMessage, rating: 1 | -1, categories: FeedbackCategory[] = [], comment?: string) => {
      if (!msg.serverMessageId) return
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) => (m.id === msg.id ? { ...m, feedback: rating } : m))
      }))
      try {
        const token = await getToken()
        if (!token) return
        await fetch(`${GATEWAY}/v1/ai/feedback`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ messageId: msg.serverMessageId, rating, categories, comment })
        })
      } catch {
        // feedback is best-effort; never surface an error for it
      }
    },
    [getToken]
  )

  const newConversation = useCallback(() => {
    sessionRef.current = null
    setState((s) => ({ ...s, messages: [], status: 'idle', error: null }))
  }, [])

  const checkEntitlement = useCallback(async () => {
    try {
      await getToken()
    } catch {
      setState((s) => ({ ...s, entitled: s.entitled ?? null }))
    }
  }, [getToken])

  return { ...state, send, stop, newConversation, checkEntitlement, sendFeedback }
}
