export const fetcher = async (
  url: string
) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error(
      'API request failed'
    ) as any
    error.status = res.status
    throw error
  }
  return res.json()
}
