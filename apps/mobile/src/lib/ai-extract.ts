import * as FileSystem from 'expo-file-system/legacy'
import { api } from './api'

/**
 * Best-effort AI extraction of a photographed enquiry form / visiting card.
 * Mints a gateway JWT (same as chat) and posts the image to the gateway's
 * vision endpoint. Any failure — endpoint not shipped yet, no credits,
 * offline — resolves to null and the scan screen stays manual-entry.
 */

const GATEWAY = process.env.EXPO_PUBLIC_AI_GATEWAY_URL ?? 'https://ai.vidhyaan.com'

export interface ExtractedLead {
  name?: string
  phone?: string
  classOrCourse?: string
}

export async function extractLeadFromImage(imageUri: string): Promise<ExtractedLead | null> {
  try {
    const tokenRes = await api<{ success: true; data: { token: string } }>('/api/v1/ai/token')
    const token = tokenRes.data.token
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' })

    const res = await fetch(`${GATEWAY}/v1/ai/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind: 'lead_enquiry_form', imageBase64: base64 })
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => null)
    const data = json?.data ?? json
    if (!data || typeof data !== 'object') return null
    return {
      name: typeof data.name === 'string' ? data.name : undefined,
      phone: typeof data.phone === 'string' ? data.phone.replace(/\D/g, '').slice(-10) : undefined,
      classOrCourse: typeof data.classOrCourse === 'string' ? data.classOrCourse : undefined
    }
  } catch {
    return null
  }
}
