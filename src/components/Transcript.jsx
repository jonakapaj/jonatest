import { useEffect, useRef } from 'react'

const VALUE_RE = /(\b[A-Z]{1,5}-?\d[\d-]*\b|\d+(?:[.,]\d+)*)/g

function emphasizeValues(text) {
  return text.split(VALUE_RE).map((part, i) =>
    i % 2 ? (
      <mark key={i} className="rounded bg-sky-100 px-0.5 font-semibold text-sky-900">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export default function Transcript({ transcript, readToEnd, onReachedEnd }) {
  const ref = useRef(null)

  const check = () => {
    const el = ref.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onReachedEnd()
  }

  // Short transcripts that fit without scrolling count as read.
  useEffect(() => {
    if (!readToEnd) check()
  })

  return (
    <section className="flex min-h-0 flex-col">
      <header className="flex items-center justify-between px-1 pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transcript</h2>
        <span className={`text-xs ${readToEnd ? 'text-emerald-600' : 'text-amber-700'}`}>
          {readToEnd ? '✓ Read to end' : 'Scroll to the end to unlock approval'}
        </span>
      </header>
      <div
        ref={ref}
        onScroll={readToEnd ? undefined : check}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4"
      >
        {transcript.map((turn, i) => {
          const agent = turn.speaker.toLowerCase() === 'agent'
          return (
            <div key={i} className={`flex gap-3 ${agent ? '' : 'flex-row-reverse text-right'}`}>
              <div className="w-12 shrink-0 pt-1 font-mono text-xs text-slate-400">{turn.timestamp}</div>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  agent ? 'bg-slate-100' : 'bg-indigo-50'
                }`}
              >
                <div className="mb-0.5 text-xs font-medium capitalize text-slate-500">{turn.speaker}</div>
                {emphasizeValues(turn.text)}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
