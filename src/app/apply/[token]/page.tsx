import { FormRenderer } from '@/components/forms/FormRenderer'

export const dynamic = 'force-dynamic'

export default async function ApplyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <FormRenderer token={token} />
}
