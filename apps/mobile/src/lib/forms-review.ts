import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for the existing /api/v1/forms* routes (composer-routed,
 *  mobile Bearer already works — the list GET was admin-only until this
 *  round; opened to COUNSELLOR since it's read-only metadata, matching who
 *  this mobile screen is actually for). Approve/reject only, no schema edit. */

export const formSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),
  status: z.string(),
  _count: z.object({ submissions: z.number() })
})
export type FormSummary = z.infer<typeof formSummarySchema>

export function useForms() {
  return useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const json = await api<{ success: true; data: FormSummary[] }>('/api/v1/forms')
      return z.array(formSummarySchema).parse(json.data)
    }
  })
}

export const submissionSchema = z.object({
  id: z.string(),
  targetType: z.string(),
  targetLabel: z.string().nullable(),
  reviewStatus: z.string().nullable(),
  submittedAt: z.coerce.date(),
  fieldStates: z
    .object({ pending: z.array(z.string()).optional(), applied: z.array(z.string()).optional() })
    .nullable()
})
export type FormSubmission = z.infer<typeof submissionSchema>

const submissionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    form: z.object({ id: z.string(), name: z.string() }),
    submissions: z.array(submissionSchema)
  })
})

export function useFormSubmissions(formId: string) {
  return useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/forms/${formId}/submissions`)
      return submissionsResponseSchema.parse(json).data
    }
  })
}

export function useReviewSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { formId: string; submissionId: string; action: 'accept' | 'reject' }) =>
      api(`/api/v1/forms/${args.formId}/submissions/${args.submissionId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: args.action })
      }),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['form-submissions', vars.formId] })
  })
}
