import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Download,
  Filter,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { useStore } from '@/store/useStore'
import {
  downloadBlob,
  exportEventsCsv,
  exportEventsJson,
} from '@/services/api'
import type { SecurityEvent, Verdict } from '@/types'

function verdictClasses(v: Verdict) {
  switch (v) {
    case 'allow':
      return 'badge badge-success'
    case 'deny':
      return 'badge badge-danger'
    case 'alert':
      return 'badge badge-warning'
    default:
      return 'badge'
  }
}

export default function EventFeed() {
  const events = useStore((s) => s.events)
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)
  const selectedId = useStore((s) => s.selectedEventId)
  const setSelectedId = useStore((s) => s.setSelectedEventId)
  const location = useLocation()
  const [localQuery, setLocalQuery] = useState(filters.query)

  useEffect(() => {
    const agent = (location.state as { agentId?: string } | null)?.agentId
    if (agent) setFilters({ agentId: agent })
  }, [location.state, setFilters])

  useEffect(() => {
    const t = setTimeout(() => setFilters({ query: localQuery }), 200)
    return () => clearTimeout(t)
  }, [localQuery, setFilters])

  const types = useMemo(() => {
    const s = new Set(events.map((e) => e.type))
    return ['all', ...Array.from(s).sort()]
  }, [events])

  const agents = useMemo(() => {
    const s = new Set(events.map((e) => e.agentId))
    return ['all', ...Array.from(s).sort()]
  }, [events])

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return events.filter((e) => {
      if (filters.verdict !== 'all' && e.verdict !== filters.verdict) return false
      if (filters.type !== 'all' && e.type !== filters.type) return false
      if (filters.agentId !== 'all' && e.agentId !== filters.agentId) return false
      if (q) {
        const blob = `${e.summary} ${e.detail ?? ''} ${e.id} ${e.type} ${e.agentId}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [events, filters])

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const exportJson = () => {
    downloadBlob(
      `events-${format(Date.now(), 'yyyyMMdd-HHmmss')}.json`,
      exportEventsJson(filtered),
      'application/json',
    )
  }

  const exportCsv = () => {
    downloadBlob(
      `events-${format(Date.now(), 'yyyyMMdd-HHmmss')}.csv`,
      exportEventsCsv(filtered),
      'text/csv',
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-[1600px] min-h-[70vh]">
      <section className="flex-1 flex flex-col min-w-0 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Real-time event feed</h1>
          <p className="text-sm text-text-secondary mt-1">
            WebSocket stream with verdict coloring — filter by type, agent, and verdict (Vigil-style
            hunting).
          </p>
        </div>

        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary shrink-0" aria-hidden />
            <select
              className="bg-bg-secondary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary"
              value={filters.verdict}
              onChange={(e) =>
                setFilters({ verdict: e.target.value as typeof filters.verdict })
              }
            >
              <option value="all">All verdicts</option>
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
              <option value="alert">Alert</option>
            </select>
            <select
              className="bg-bg-secondary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary"
              value={filters.type}
              onChange={(e) => setFilters({ type: e.target.value })}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All types' : t}
                </option>
              ))}
            </select>
            <select
              className="bg-bg-secondary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary min-w-[140px]"
              value={filters.agentId}
              onChange={(e) => setFilters({ agentId: e.target.value })}
            >
              {agents.map((a) => (
                <option key={a} value={a}>
                  {a === 'all' ? 'All agents' : a}
                </option>
              ))}
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                className="w-full bg-bg-secondary border border-border rounded-md pl-8 pr-3 py-1.5 text-sm"
                placeholder="Search summary, id, payload…"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              onClick={() => {
                resetFilters()
                setLocalQuery('')
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="card flex-1 flex flex-col min-h-[400px] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary/40">
            <span className="text-xs text-text-secondary">
              {filtered.length} events · {events.length} buffered
            </span>
            <div className="flex gap-2">
              <button type="button" className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1" onClick={exportCsv}>
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                type="button"
                className="border border-border text-text-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 hover:border-primary/50"
                onClick={exportJson}
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-bg-card z-10 text-text-secondary text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Verdict</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Agent</th>
                  <th className="px-3 py-2 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={clsx(
                      'border-t border-border/80 cursor-pointer hover:bg-bg-secondary/60',
                      selectedId === e.id && 'bg-primary/10',
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-text-secondary whitespace-nowrap">
                      {format(e.ts, 'HH:mm:ss.SSS')}
                    </td>
                    <td className="px-3 py-2">
                      <span className={verdictClasses(e.verdict)}>{e.verdict}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-primary">{e.type}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.agentId}</td>
                    <td className="px-3 py-2 text-text-primary truncate max-w-[280px]">{e.summary}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-12 text-center text-text-secondary text-sm">
                      No events match filters. Connect the backend or wait for the demo stream.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="w-full lg:w-[400px] shrink-0">
        <div className="card p-4 sticky top-4 max-h-[calc(100vh-8rem)] overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Event inspection</h2>
            {selected && (
              <button
                type="button"
                className="p-1 rounded hover:bg-bg-secondary text-text-secondary"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {selected ? (
            <EventDetail event={selected} />
          ) : (
            <p className="text-sm text-text-secondary">Select a row to inspect raw fields and metadata.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

function EventDetail({ event }: { event: SecurityEvent }) {
  return (
    <dl className="space-y-3 text-sm">
      <DetailRow label="ID" value={event.id} mono />
      <DetailRow label="Timestamp" value={format(event.ts, 'yyyy-MM-dd HH:mm:ss.SSS')} mono />
      <DetailRow label="Verdict" value={event.verdict} />
      <DetailRow label="Severity" value={event.severity} />
      <DetailRow label="Type" value={event.type} mono />
      <DetailRow label="Agent" value={`${event.agentId}${event.agentName ? ` (${event.agentName})` : ''}`} mono />
      {event.ruleId && <DetailRow label="Rule" value={event.ruleId} mono />}
      {event.latencyMs != null && (
        <DetailRow label="Latency" value={`${event.latencyMs.toFixed(3)} ms`} mono />
      )}
      <div>
        <dt className="text-xs text-text-secondary uppercase tracking-wide mb-1">Summary</dt>
        <dd className="text-text-primary">{event.summary}</dd>
      </div>
      {event.detail && (
        <div>
          <dt className="text-xs text-text-secondary uppercase tracking-wide mb-1">Detail</dt>
          <dd className="font-mono text-xs text-text-primary whitespace-pre-wrap break-all bg-bg-secondary rounded p-2 border border-border">
            {event.detail}
          </dd>
        </div>
      )}
      {event.metadata && Object.keys(event.metadata).length > 0 && (
        <div>
          <dt className="text-xs text-text-secondary uppercase tracking-wide mb-2">Metadata</dt>
          <dd className="space-y-1">
            {Object.entries(event.metadata).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 text-xs font-mono">
                <span className="text-primary">{k}</span>
                <span className="text-text-primary truncate">{v}</span>
              </div>
            ))}
          </dd>
        </div>
      )}
    </dl>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-secondary shrink-0">{label}</dt>
      <dd className={clsx('text-text-primary text-right', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}
