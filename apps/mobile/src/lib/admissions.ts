import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api, uploadFile } from './api'

/** Wire contract for the existing /api/v1/admissions* routes (composer-
 *  routed, mobile Bearer already works). Simplified pipeline: stage picker
 *  instead of kanban drag (mobile-app-plan §3.2). */

export const admissionStageSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().nullable(),
  order: z.number(),
  isTerminal: z.boolean(),
  count: z.number()
})
export type AdmissionStage = z.infer<typeof admissionStageSchema>

export function useAdmissionStages() {
  return useQuery({
    queryKey: ['admission-stages'],
    queryFn: async () => {
      const json = await api<{ success: true; data: { pipeline: AdmissionStage[] } }>('/api/v1/admissions/pipeline')
      return json.data.pipeline
    }
  })
}

export const admissionSchema = z.object({
  id: z.string(),
  admissionCode: z.string(),
  applicantName: z.string(),
  parentName: z.string(),
  phone: z.string(),
  gradeSought: z.string().nullable(),
  stageId: z.string().nullable(),
  stage: z.object({ id: z.string(), name: z.string(), color: z.string().nullable() }).nullable(),
  createdAt: z.coerce.date()
})
export type Admission = z.infer<typeof admissionSchema>

const admissionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(admissionSchema),
  pagination: z.object({ total: z.number() })
})

export function useAdmissions(stageId: string | null, search: string) {
  return useQuery({
    queryKey: ['admissions', stageId, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30' })
      if (stageId) params.set('stageId', stageId)
      if (search.trim()) params.set('search', search.trim())
      const json = await api<unknown>(`/api/v1/admissions?${params}`)
      const parsed = admissionsResponseSchema.parse(json)
      return { admissions: parsed.data, total: parsed.pagination.total }
    }
  })
}

export function useMoveAdmissionStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { admissionId: string; stageId: string }) =>
      api(`/api/v1/admissions/${args.admissionId}`, { method: 'PUT', body: JSON.stringify({ stageId: args.stageId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['admission-stages'] })
    }
  })
}

/** Camera capture → S3 (via /api/v1/files/upload) → register on the
 *  admission (/api/v1/admissions/[id]/documents). Two server round trips,
 *  matching the only upload path that actually exists in this codebase
 *  (server-proxied multipart, not a presigned-URL direct upload). */
export function useUploadAdmissionDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { admissionId: string; uri: string; fileName: string; mimeType: string; docName: string }) => {
      const { url } = await uploadFile({
        uri: args.uri,
        fileName: args.fileName,
        mimeType: args.mimeType,
        category: 'admissions'
      })
      return api(`/api/v1/admissions/${args.admissionId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ name: args.docName, type: args.mimeType, url })
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admissions'] })
  })
}
