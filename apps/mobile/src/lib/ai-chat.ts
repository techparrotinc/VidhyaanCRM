import { useCallback, useRef, useState } from 'react'
import { fetch as expoFetch } from 'expo/fetch'
import { api } from './api'

/**
 * RN port of src/components/ai/useAiChat.ts. Two real platform differences
 * from the web version, everything else is the same protocol:
 *  - Streaming: RN's global `fetch` buffers the whole response (no working
 *    `body.getReader()`) — `expo/fetch` (SDK 50+) is Expo's fetch built
 *    specifically to support real streaming bodies; used only for the
 *    gateway calls, global fetch still handles everything else.
 *  - Token minting goes through this app's own `api()` (Bearer-aware
 *    already) instead of a raw same-origin fetch.
 * History/delete/feedback are not ported — out of scope for the mobile P2
 * ask (citations + action cards + streaming chat only).
 */

const GATEWAY = process.env.EXPO_PUBLIC_AI_GATEWAY_URL ?? 'https://ai.vidhyaan.com'

function randomId(): string {
  const g: any = globalThis as any
  if (g.crypto?.randomUUID) return g.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export type AiCitation = { docId: string; title: string; appRoute: string }

export type AiAction = {
  actionId: string
  humanSummary: string
  fields: { label: string; value: string }[]
  expiresAt: string
  status: 'pending' | 'confirming' | 'done' | 'error' | 'cancelled'
  resultText?: string
  resultLink?: string
}

export type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  citations?: AiCitation[]
  serverMessageId?: string
  action?: AiAction
}

export type AiChatState = {
  messages: AiMessage[]
  status: 'idle' | 'streaming' | 'error'
  error: string | null
  entitled: boolean | null
  creditsLeft: number | null
}

type TokenCache = { token: string; expiresAt: number }

export function useAiChat() {
  const [state, setState] = useState<AiChatState>({
    messages: [],
    status: 'idle',
    error: null,
    entitled: null,
    creditsLeft: null
  })
  const tokenRef = useRef<TokenCache | null>(null)
  const sessionRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const getToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current && tokenRef.current.expiresAt > Date.now() + 30_000) {
      return tokenRef.current.token
    }
    try {
      const json = await api<{ success: true; data: { token: string; expiresIn: number; creditsRemaining: number } }>(
        '/api/v1/ai/token'
      )
      tokenRef.current = { token: json.data.token, expiresAt: Date.now() + json.data.expiresIn * 1000 }
      setState((s) => ({ ...s, entitled: true, creditsLeft: json.data.creditsRemaining }))
      return json.data.token
    } catch {
      setState((s) => ({ ...s, entitled: false }))
      return null
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || state.status === 'streaming') return

      const userMsg: AiMessage = { id: randomId(), role: 'user', text: trimmed }
      const assistantMsg: AiMessage = { id: randomId(), role: 'assistant', text: '', streaming: true }
      setState((s) => ({ ...s, status: 'streaming', error: null, messages: [...s.messages, userMsg, assistantMsg] }))

      const patchAssistant = (patch: Partial<AiMessage>) =>
        setState((s) => ({ ...s, messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, ...patch } : m)) }))

      try {
        const token = await getToken()
        if (!token) {
          patchAssistant({ text: 'AI Copilot is not enabled for your school.', streaming: false })
          setState((s) => ({ ...s, status: 'idle' }))
          return
        }

        abortRef.current = new AbortController()
        const res = await expoFetch(`${GATEWAY}/v1/ai/chat`, {
          method: 'POST',
          signal: abortRef.current.signal,
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionRef.current,
            message: trimmed,
            context: { route: 'mobile' }
          })
        })

        if (res.status === 402) {
          setState((s) => ({ ...s, creditsLeft: 0 }))
          patchAssistant({ text: 'Your AI credits are used up for now. Top up on the web app to keep chatting.', streaming: false })
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
                  m.id === assistantMsg.id ? { ...m, citations: [...(m.citations ?? []), evt.citation] } : m
                )
              }))
            }
            if (evt.type === 'actionProposal') {
              setState((s) => ({
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsg.id
                    ? {
                        ...m,
                        action: {
                          actionId: evt.actionId,
                          humanSummary: evt.humanSummary,
                          fields: evt.fields,
                          expiresAt: evt.expiresAt,
                          status: 'pending'
                        }
                      }
                    : m
                )
              }))
            }
            if (evt.type === 'token') {
              acc += evt.text
              patchAssistant({ text: acc })
            }
            if (evt.type === 'usage') {
              setState((s) => ({ ...s, creditsLeft: typeof evt.creditsRemaining === 'number' ? evt.creditsRemaining : s.creditsLeft }))
            }
            if (evt.type === 'done') {
              setState((s) => ({
                ...s,
                messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, serverMessageId: evt.messageId } : m))
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
        patchAssistant({ text: assistantMsg.text || 'Something went wrong. Please try again.', streaming: false })
        setState((s) => ({ ...s, status: 'error', error: err?.message ?? 'Unknown error' }))
      }
    },
    [getToken, state.status]
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const patchAction = useCallback((msgId: string, patch: Partial<AiAction>) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === msgId && m.action ? { ...m, action: { ...m.action, ...patch } } : m))
    }))
  }, [])

  const confirmAction = useCallback(
    async (msg: AiMessage) => {
      if (!msg.action || msg.action.status !== 'pending') return
      patchAction(msg.id, { status: 'confirming' })
      try {
        const token = await getToken()
        if (!token) return
        const res = await expoFetch(`${GATEWAY}/v1/ai/action`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ actionId: msg.action.actionId, confirm: true, idempotencyKey: randomId() })
        })
        const json = await res.json().catch(() => null)
        if (res.ok && json?.result) {
          patchAction(msg.id, { status: 'done', resultText: json.result.summary, resultLink: json.result.link })
        } else {
          patchAction(msg.id, { status: 'error', resultText: json?.message ?? 'Could not complete this action.' })
        }
      } catch {
        patchAction(msg.id, { status: 'error', resultText: 'Network error — please try again.' })
      }
    },
    [getToken, patchAction]
  )

  const cancelAction = useCallback((msg: AiMessage) => patchAction(msg.id, { status: 'cancelled' }), [patchAction])

  const newConversation = useCallback(() => {
    sessionRef.current = null
    setState((s) => ({ ...s, messages: [], status: 'idle', error: null }))
  }, [])

  const checkEntitlement = useCallback(async () => {
    await getToken()
  }, [getToken])

  return { ...state, send, stop, newConversation, checkEntitlement, confirmAction, cancelAction }
}
