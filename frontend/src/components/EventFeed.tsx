import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Filter, RefreshCw, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { useStore } from '@/store/useStore'
import { downloadBlob, exportEventsCsv, exportEventsJson } from '@/services/api'
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
      return 'badge bg-bg-elevated text-text-muted ring-1 ring-border-subtle'
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
    <div className="flex min-h-[70vh] max-w-[1600px] flex-col gap-6 lg:flex-row lg:gap-8 animate-fade-in">
      <section className="flex min-w-0 flex-1 flex-col space-y-6">
        <header className="page-header">
          <h1 className="page-title">Real-time event feed</h1>
          <p className="page-subtitle">
            WebSocket stream with verdict coloring — filter by type, agent, and verdict (Vigil-style
            hunting).
          </p>
        </header>

        <div className="card p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-elevated/80 ring-1 ring-border-subtle">
              <Filter className="h-4 w-4 text-text-muted" aria-hidden />
            </span>
            <select
              className="select-field min-w-[128px]"
              value={filters.verdict}
              onChange={(e) => setFilters({ verdict: e.target.value as typeof filters.verdict })}
            >
              <option value="all">All verdicts</option>
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
              <option value="alert">Alert</option>
            </select>
            <select
              className="select-field min-w-[128px]"
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
              className="select-field min-w-[140px]"
              value={filters.agentId}
              onChange={(e) => setFilters({ agentId: e.target.value })}
            >
              {agents.map((a) => (
                <option key={a} value={a}>
                  {a === 'all' ? 'All agents' : a}
                </option>
              ))}
            </select>
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                className="input-field pl-10"
                placeholder="Search summary, id, payload…"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-text-muted transition-colors duration-250 hover:bg-bg-elevated hover:text-text-primary"
              onClick={() => {
                resetFilters()
                setLocalQuery('')
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="table-shell flex min-h-[400px] flex-1 flex-col overflow-hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border-subtle bg-bg-secondary/30 px-4 py-3 md:px-5">
            <span className="text-xs font-medium text-text-muted">
              <span className="tabular-nums text-text-secondary">{filtered.length}</span>
              <span className="mx-1.5 text-text-muted">·</span>
              <span className="text-text-muted">{events.length} buffered</span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary py-2 text-xs"
                onClick={exportCsv}
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
              <button type="button" className="btn-secondary py-2 text-xs" onClick={exportJson}>
                <Download className="h-3.5 w-3.5" />
                JSON
              </button>
            </div>
          </div>
          <div className="scrollbar-thin flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 table-header-row text-2xs font-semibold uppercase tracking-wider text-text-muted backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-5">Time</th>
                  <th className="px-4 py-3 font-medium md:px-5">Verdict</th>
                  <th className="px-4 py-3 font-medium md:px-5">Type</th>
                  <th className="px-4 py-3 font-medium md:px-5">Agent</th>
                  <th className="px-4 py-3 font-medium md:px-5">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={clsx(
                      'table-row-interactive cursor-pointer transition-colors duration-200',
                      selectedId === e.id && 'bg-primary/8 ring-1 ring-inset ring-primary/20',
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-muted md:px-5">
                      {format(e.ts, 'HH:mm:ss.SSS')}
                    </td>
                    <td className="px-4 py-3 md:px-5">
                      <span className={verdictClasses(e.verdict)}>{e.verdict}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary md:px-5">{e.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary md:px-5">
                      {e.agentId}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-text-primary md:px-5">
                      {e.summary}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-text-muted md:px-5">
                      No events match filters. Connect the backend or wait for the demo stream.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="w-full shrink-0 lg:w-[420px]">
        <div className="card sticky top-4 max-h-[calc(100vh-7rem)] overflow-auto p-5 scrollbar-thin">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Event inspection</h2>
            {selected && (
              <button
                type="button"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {selected ? (
            <EventDetail event={selected} />
          ) : (
            <p className="rounded-xl border border-dashed border-border-subtle bg-bg-secondary/40 px-4 py-8 text-center text-sm text-text-muted">
              Select a row to inspect raw fields and metadata.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

function EventDetail({ event }: { event: SecurityEvent }) {
  return (
    <dl className="space-y-4 text-sm">
      <DetailRow label="ID" value={event.id} mono />
      <DetailRow label="Timestamp" value={format(event.ts, 'yyyy-MM-dd HH:mm:ss.SSS')} mono />
      <DetailRow label="Verdict" value={event.verdict} />
      <DetailRow label="Severity" value={event.severity} />
      <DetailRow label="Type" value={event.type} mono />
      <DetailRow
        label="Agent"
        value={`${event.agentId}${event.agentName ? ` (${event.agentName})` : ''}`}
        mono
      />
      {event.ruleId && <DetailRow label="Rule" value={event.ruleId} mono />}
      {event.latencyMs != null && (
        <DetailRow label="Latency" value={`${event.latencyMs.toFixed(3)} ms`} mono />
      )}
      <div>
        <dt className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-text-muted">
          Summary
        </dt>
        <dd className="leading-relaxed text-text-primary">{event.summary}</dd>
      </div>
      {event.detail && (
        <div>
          <dt className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-text-muted">
            Detail
          </dt>
          <dd className="whitespace-pre-wrap break-all rounded-xl border border-border-subtle bg-bg-secondary/80 p-3 font-mono text-xs leading-relaxed text-text-primary">
            {event.detail}
          </dd>
        </div>
      )}
      {event.metadata && Object.keys(event.metadata).length > 0 && (
        <div>
          <dt className="mb-2 text-2xs font-semibold uppercase tracking-wider text-text-muted">
            Metadata
          </dt>
          <dd className="space-y-2">
            {Object.entries(event.metadata).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-3 rounded-lg bg-bg-elevated/50 px-3 py-2 text-xs font-mono ring-1 ring-border-subtle"
              >
                <span className="shrink-0 text-primary">{k}</span>
                <span className="truncate text-right text-text-primary">{v}</span>
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
    <div className="flex justify-between gap-3 border-b border-border-subtle/80 pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd className={clsx('text-right text-text-primary', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}
