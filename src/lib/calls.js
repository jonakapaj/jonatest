// Parses and validates uploaded call data. Accepts either { calls: [...] } or a bare array.
// Only the fields the review needs are required; everything else is optional.

export function parseCalls(json) {
  const list = Array.isArray(json) ? json : json?.calls
  if (!Array.isArray(list)) {
    throw new Error('Expected a JSON array of calls or an object with a "calls" array.')
  }

  const errors = []
  const calls = []
  const seen = new Set()

  list.forEach((raw, i) => {
    const label = raw?.call_id ? `"${raw.call_id}"` : `#${i + 1}`
    if (!raw || typeof raw !== 'object') return errors.push(`Call ${label}: not an object.`)
    if (typeof raw.summary !== 'string' || !raw.summary.trim())
      return errors.push(`Call ${label}: missing "summary".`)
    if (!Array.isArray(raw.transcript) || raw.transcript.length === 0)
      return errors.push(`Call ${label}: missing "transcript".`)

    const transcript = raw.transcript
      .filter((t) => t && typeof t.text === 'string')
      .map((t) => ({
        speaker: String(t.speaker ?? 'unknown'),
        timestamp: t.timestamp != null ? String(t.timestamp) : '',
        text: t.text,
      }))
    if (transcript.length === 0) return errors.push(`Call ${label}: transcript has no text.`)

    let id = raw.call_id != null ? String(raw.call_id) : `call_${i + 1}`
    if (seen.has(id)) {
      errors.push(`Call ${label}: duplicate call_id, renamed to "${id}#${i + 1}".`)
      id = `${id}#${i + 1}`
    }
    seen.add(id)

    calls.push({
      id,
      date: raw.date ?? '',
      durationSeconds: Number.isFinite(raw.duration_seconds) ? raw.duration_seconds : null,
      agentName: raw.agent_name ?? '',
      customerName: raw.customer_name ?? '',
      topic: raw.topic ?? '',
      transcript,
      summary: raw.summary,
    })
  })

  return { calls, errors }
}

// Stable fingerprint of the content under review. If the summary or transcript changes,
// the fingerprint changes and any previous approval no longer applies.
export function fingerprint(call) {
  const s = call.summary + '\u0000' + call.transcript.map((t) => `${t.speaker}:${t.text}`).join('\n')
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${call.id}::${(h >>> 0).toString(36)}`
}
