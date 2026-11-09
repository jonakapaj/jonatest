const STYLES = {
  pending: 'bg-slate-100 text-slate-600 ring-slate-300',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-300',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STYLES[status]}`}>
      {status}
    </span>
  )
}
