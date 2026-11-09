// Heuristic aid, not a verdict: finds numbers, amounts, dates and reference codes in the
// summary and checks whether each value appears anywhere in the transcript.
// A value that is missing from the transcript is a strong sign of an error.
// A value that IS found can still be used wrongly, so the reviewer still has to check.

const WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8,
  ninth: 9, tenth: 10, once: 1, twice: 2, half: 0.5, dozen: 12,
}

const REF_RE = /\b[A-Z]{1,5}-?\d[\d-]*\b/g
const NUM_RE = /\d+(?:[.,]\d+)*/g
const WORD_RE = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\b`, 'gi')

const normNum = (s) => {
  const n = Number(s.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'))
  return Number.isFinite(n) ? String(n) : s
}

function collectValues(text) {
  const refs = new Set()
  const nums = new Set()
  for (const m of text.matchAll(REF_RE)) refs.add(m[0].toUpperCase())
  for (const m of text.matchAll(NUM_RE)) nums.add(normNum(m[0]))
  for (const m of text.matchAll(WORD_RE)) nums.add(String(WORDS[m[1].toLowerCase()]))
  return { refs, nums }
}

export function factCheck(summary, transcript) {
  const source = collectValues(transcript.map((t) => t.text).join('\n'))
  const items = []
  const taken = [] // character ranges already claimed by a reference code

  for (const m of summary.matchAll(REF_RE)) {
    const value = m[0].toUpperCase()
    items.push({ kind: 'reference', text: m[0], start: m.index, end: m.index + m[0].length, found: source.refs.has(value) })
    taken.push([m.index, m.index + m[0].length])
  }

  for (const m of summary.matchAll(NUM_RE)) {
    const start = m.index
    if (taken.some(([a, b]) => start >= a && start < b)) continue
    items.push({ kind: 'number', text: m[0], start, end: start + m[0].length, found: source.nums.has(normNum(m[0])) })
  }

  for (const m of summary.matchAll(WORD_RE)) {
    const value = String(WORDS[m[1].toLowerCase()])
    items.push({ kind: 'number', text: m[0], start: m.index, end: m.index + m[0].length, found: source.nums.has(value) })
  }

  items.sort((a, b) => a.start - b.start)
  return items.map((it, i) => ({ ...it, key: `${it.start}:${it.text}`, index: i }))
}
