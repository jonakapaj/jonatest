import Transcript from './Transcript.jsx'
import StatusBadge from './StatusBadge.jsx'
import { ISSUES, approvalBlockers } from '../lib/review.js'

function HighlightedSummary({ summary, facts }) {
  const parts = []
  let pos = 0
  for (const f of facts) {
    if (f.start < pos) continue
    parts.push(summary.slice(pos, f.start))
    parts.push(
      <mark
        key={f.key}
        title={f.found ? 'Appears in the transcript' : 'Not in the transcript'}
        className={`rounded px-0.5 font-semibold ${
          f.found ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-200 text-rose-900 underline decoration-rose-600 decoration-wavy'
        }`}
      >
        {summary.slice(f.start, f.end)}
      </mark>,
    )
    pos = f.end
  }
  parts.push(summary.slice(pos))
  return <p className="leading-relaxed">{parts}</p>
}

export default function ReviewPanel({ call, review, facts, onChange, onDecide }) {
  const decided = review.status !== 'pending'
  const flagged = facts.filter((f) => !f.found)
  const blockers = approvalBlockers(review, facts)

  const toggleReason = (id) =>
    onChange({ reasons: review.reasons.includes(id) ? review.reasons.filter((r) => r !== id) : [...review.reasons, id] })

  return (
    <main className="grid min-h-0 flex-1 grid-cols-2 gap-4 p-4">
      <Transcript
        key={call.id}
        transcript={call.transcript}
        readToEnd={review.readToEnd}
        onReachedEnd={() => onChange({ readToEnd: true })}
      />

      <section className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-x-3 text-sm text-slate-500">
          <span className="font-medium text-slate-800">{call.customerName || call.id}</span>
          {[call.topic, call.agentName && `Agent: ${call.agentName}`, call.date].filter(Boolean).map((x) => (
            <span key={x}>· {x}</span>
          ))}
          <span className="ml-auto"><StatusBadge status={review.status} /></span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h2>
          <HighlightedSummary summary={call.summary} facts={facts} />
          {flagged.length > 0 ? (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
              ⚠ <b>{flagged.map((f) => f.text).join(', ')}</b> {flagged.length > 1 ? "aren't" : "isn't"} in the transcript.
              This summary is probably wrong.
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              No mismatched numbers found. Wording, promises and tone still need checking by you.
            </p>
          )}
        </div>

        {decided ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <span>
              Marked <b>{review.status}</b>
              {review.reasons.length > 0 && ` — ${review.reasons.map((r) => ISSUES.find((i) => i.id === r)?.label).join(', ')}`}
            </span>
            <button onClick={() => onDecide('pending')} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
              Undo
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-rose-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-rose-700">Something wrong? Pick what (optional) and reject</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {ISSUES.map((i) => {
                  const on = review.reasons.includes(i.id)
                  return (
                    <button key={i.id} onClick={() => toggleReason(i.id)}
                      className={`rounded-full px-3 py-1 text-sm ring-1 ring-inset ${
                        on ? 'bg-rose-600 text-white ring-rose-600' : 'text-slate-700 ring-slate-300 hover:bg-rose-50'
                      }`}>
                      {i.label}
                    </button>
                  )
                })}
              </div>
              <input
                value={review.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Note (optional)"
                className="mb-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-rose-500 focus:outline-none"
              />
              <button onClick={() => onDecide('rejected')}
                className="w-full rounded-md bg-rose-600 py-2 font-semibold text-white hover:bg-rose-700">
                Reject
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-emerald-700">Everything correct?</h3>
              {flagged.length > 0 && (
                <label className="mb-2 flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 accent-rose-600" checked={review.flagsConfirmed}
                    onChange={(e) => onChange({ flagsConfirmed: e.target.checked })} />
                  <span>The red values are correct even though they're not in the transcript</span>
                </label>
              )}
              <label className="mb-3 flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 accent-emerald-600" checked={review.confirmed}
                  onChange={(e) => onChange({ confirmed: e.target.checked })} />
                <span>
                  I checked {ISSUES.map((i) => i.hint).join(', ')} against the transcript
                </span>
              </label>
              <button onClick={() => onDecide('approved')} disabled={blockers.length > 0}
                className="w-full rounded-md bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                Approve
              </button>
              {blockers.length > 0 && (
                <p className="mt-2 text-center text-xs text-slate-500">To approve, {blockers.join(', ')}.</p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
