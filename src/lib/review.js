// Review state lives in localStorage only (no backend). Keyed by content fingerprint,
// so editing a call's summary or transcript sends it back to "pending".

// Shown as a reminder of what to compare. Also used as one-click reject reasons.
export const ISSUES = [
  { id: 'facts', label: 'Wrong number / date', hint: 'numbers, amounts, dates and references' },
  { id: 'invented', label: 'Invented promise', hint: 'promises and next steps the agent actually said' },
  { id: 'outcome', label: 'Wrong outcome', hint: 'the outcome (accepted, resolved, retained)' },
  { id: 'missing', label: 'Missing info', hint: 'key issues or references that are left out' },
  { id: 'tone', label: 'Wrong tone', hint: "the customer's tone" },
]

const STORAGE_KEY = 'qa-review:v2'

export const emptyReview = () => ({
  status: 'pending',
  readToEnd: false,
  confirmed: false,
  flagsConfirmed: false,
  reasons: [],
  notes: '',
  decidedAt: null,
})

export function loadReviews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function saveReviews(reviews) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
}

// What is still needed before "Approve" is allowed. Empty array = approvable.
export function approvalBlockers(review, facts) {
  const blockers = []
  if (!review.readToEnd) blockers.push('read the whole transcript')
  if (facts.some((f) => !f.found) && !review.flagsConfirmed) blockers.push('confirm the red values')
  if (!review.confirmed) blockers.push('tick the confirmation')
  return blockers
}

export function exportResults(calls, reviews, keyOf, factsOf) {
  return calls.map((call) => {
    const r = { ...emptyReview(), ...reviews[keyOf(call)] }
    return {
      call_id: call.id,
      status: r.status,
      decided_at: r.decidedAt,
      reasons: r.reasons,
      notes: r.notes || null,
      values_not_in_transcript: factsOf(call).filter((f) => !f.found).map((f) => f.text),
    }
  })
}
