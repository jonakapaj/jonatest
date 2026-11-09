import { useEffect, useMemo, useRef, useState } from 'react'
import CallList from './components/CallList.jsx'
import ReviewPanel from './components/ReviewPanel.jsx'
import { parseCalls, fingerprint } from './lib/calls.js'
import { factCheck } from './lib/factCheck.js'
import { approvalBlockers, emptyReview, exportResults, loadReviews, saveReviews } from './lib/review.js'

export default function App() {
  const [calls, setCalls] = useState([])
  const [source, setSource] = useState('')
  const [errors, setErrors] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [reviews, setReviews] = useState(loadReviews)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)

  useEffect(() => saveReviews(reviews), [reviews])

  const ingest = (json, name) => {
    try {
      const { calls, errors } = parseCalls(json)
      setCalls(calls)
      setErrors(errors)
      setSource(name)
      setSelectedId(calls[0]?.id ?? null)
    } catch (e) {
      setErrors([`${name}: ${e.message}`])
    }
  }

  const readFile = async (file) => {
    if (!file) return
    try {
      ingest(JSON.parse(await file.text()), file.name)
    } catch (e) {
      setErrors([`${file.name}: invalid JSON (${e.message})`])
    }
  }

  // Try data/calls.json (served by Vite) on startup. Uploading a file replaces it.
  useEffect(() => {
    fetch('/calls.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => ingest(json, 'calls.json'))
      .catch(() => {})
  }, [])

  const keys = useMemo(() => new Map(calls.map((c) => [c.id, fingerprint(c)])), [calls])
  const facts = useMemo(() => new Map(calls.map((c) => [c.id, factCheck(c.summary, c.transcript)])), [calls])
  const keyOf = (call) => keys.get(call.id)
  const factsOf = (call) => facts.get(call.id) ?? []
  const reviewOf = (call) => ({ ...emptyReview(), ...reviews[keyOf(call)] })

  const selected = calls.find((c) => c.id === selectedId)

  // ↑/↓ moves between calls (ignored while typing). There is deliberately no approve shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || !['ArrowUp', 'ArrowDown'].includes(e.key)) return
      const i = calls.findIndex((c) => c.id === selectedId)
      const next = calls[i + (e.key === 'ArrowDown' ? 1 : -1)]
      if (next) (e.preventDefault(), setSelectedId(next.id))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [calls, selectedId])

  const update = (call, patch) =>
    setReviews((prev) => ({ ...prev, [keyOf(call)]: { ...emptyReview(), ...prev[keyOf(call)], ...patch } }))

  const decide = (call, status) => {
    // Re-check the rules here as well as on the button, so approval can't bypass them.
    if (status === 'approved' && approvalBlockers(reviewOf(call), factsOf(call)).length) return
    update(call, { status, decidedAt: status === 'pending' ? null : new Date().toISOString() })
    if (status !== 'pending') {
      const i = calls.indexOf(call)
      const next = [...calls.slice(i + 1), ...calls.slice(0, i)].find((c) => reviewOf(c).status === 'pending')
      if (next) setSelectedId(next.id)
    }
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(exportResults(calls, reviews, keyOf, factsOf), null, 2)], {
      type: 'application/json',
    })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `qa-results-${new Date().toISOString().slice(0, 10)}.json`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const counts = calls.reduce((acc, c) => ({ ...acc, [reviewOf(c).status]: (acc[reviewOf(c).status] ?? 0) + 1 }), {})

  return (
    <div
      className="flex h-screen flex-col"
      onDragOver={(e) => (e.preventDefault(), setDragging(true))}
      onDragLeave={(e) => e.currentTarget.contains(e.relatedTarget) || setDragging(false)}
      onDrop={(e) => (e.preventDefault(), setDragging(false), readFile(e.dataTransfer.files[0]))}
    >
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="font-semibold">Summary QA Review</h1>
        {source && <span className="text-xs text-slate-500">{source}</span>}
        {calls.length > 0 && (
          <span className="text-xs text-slate-500">
            {counts.pending ?? 0} pending · {counts.approved ?? 0} approved · {counts.rejected ?? 0} rejected
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <input ref={fileInput} type="file" accept=".json,application/json" hidden
            onChange={(e) => (readFile(e.target.files[0]), (e.target.value = ''))} />
          <button onClick={() => fileInput.current.click()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Load JSON
          </button>
          <button onClick={download} disabled={!calls.length}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
            Export results
          </button>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      {calls.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <button onClick={() => fileInput.current.click()}
            className={`rounded-xl border-2 border-dashed px-12 py-16 text-center text-slate-500 ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}`}>
            <div className="font-medium text-slate-700">Drop a calls JSON file here, or click to choose one</div>
            <div className="mt-1 text-xs">
              Format: {'{ "calls": [ { call_id, summary, transcript: [ { speaker, timestamp, text } ] } ] }'}
            </div>
          </button>
        </div>
      ) : (
        <div className={`flex min-h-0 flex-1 ${dragging ? 'opacity-50' : ''}`}>
          <CallList calls={calls} selectedId={selectedId} onSelect={setSelectedId}
            reviewOf={reviewOf} flagCountOf={(c) => factsOf(c).filter((f) => !f.found).length} />
          {selected && (
            <ReviewPanel call={selected} review={reviewOf(selected)} facts={factsOf(selected)}
              onChange={(patch) => update(selected, patch)} onDecide={(s) => decide(selected, s)} />
          )}
        </div>
      )}
    </div>
  )
}
