import StatusBadge from './StatusBadge.jsx'

export default function CallList({ calls, selectedId, onSelect, reviewOf, flagCountOf }) {
  return (
    <nav className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <ul className="flex-1 overflow-y-auto">
        {calls.map((call) => {
          const status = reviewOf(call).status
          const flags = flagCountOf(call)
          const active = call.id === selectedId
          return (
            <li key={call.id}>
              <button
                onClick={() => onSelect(call.id)}
                className={`w-full border-b border-slate-100 px-4 py-3 text-left transition ${
                  active ? 'bg-indigo-50 shadow-[inset_3px_0_0] shadow-indigo-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{call.customerName || call.id}</span>
                  <StatusBadge status={status} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="truncate">
                    {[call.topic, call.agentName && `Agent: ${call.agentName}`].filter(Boolean).join(' · ') || call.id}
                  </span>
                  {flags > 0 && status === 'pending' && (
                    <span className="shrink-0 font-medium text-amber-700" title="Summary values not found in transcript">
                      ⚠ {flags}
                    </span>
                  )}
                </div>
                {call.date && <div className="mt-0.5 text-xs text-slate-400">{call.date}</div>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
