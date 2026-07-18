// Shared between the server profile page (FAQPage JSON-LD) and the client
// profile UI (visible FAQ section) — Google requires the schema to match
// visible content, so both sides must build from the same source.

export interface SchoolFaqInput {
  name: string
  admissionOpen?: boolean | null
  gradesOffered?: string | null
  affiliations?: Array<{ board: string }> | null
  locations?: Array<{ city?: string | null }> | null
}

export function buildSchoolFaqs(s: SchoolFaqInput): Array<{ q: string; a: string }> {
  const faqs: Array<{ q: string; a: string }> = []
  const city = s.locations?.[0]?.city
  const boards = (s.affiliations ?? []).map((a) => a.board).filter(Boolean)

  if (boards.length) {
    faqs.push({
      q: `Which board is ${s.name} affiliated to?`,
      a: `${s.name} is affiliated to ${boards.join(' and ')}.`,
    })
  }

  if (s.gradesOffered) {
    faqs.push({
      q: `Which classes does ${s.name} offer?`,
      a: `${s.name} offers ${s.gradesOffered}.`,
    })
  }

  faqs.push({
    q: `Are admissions open at ${s.name}?`,
    a: s.admissionOpen
      ? `Yes, admissions are currently open at ${s.name}. You can send an enquiry or apply directly through Vidhyaan.`
      : `Admission status can change through the year. Send an enquiry on Vidhyaan and ${s.name} will respond with current availability.`,
  })

  faqs.push({
    q: `How do I apply to ${s.name}${city ? `, ${city}` : ''}?`,
    a: `Submit an enquiry from this page on Vidhyaan — your details go straight to the school's admission team, and you can track the application from your parent account.`,
  })

  return faqs
}
