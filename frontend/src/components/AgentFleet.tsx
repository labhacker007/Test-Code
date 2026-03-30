import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, Globe2, Radio, ServerCrash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { useStore } from '@/store/useStore'
import type { AgentNode } from '@/types'

function statusBadge(a: AgentNode['status']) {
  switch (a) {
    case 'online':
      return 'badge badge-success'
    case 'degraded':
      return 'badge badge-warning'
    default:
      return 'badge badge-danger'
  }
}

type Props = { compact?: boolean }

export default function AgentFleet({ compact = false }: Props) {
  const agents = useStore((s) => s.agents)
  const selectedId = useStore((s) => s.selectedAgentId)
  const setSelected = useStore((s) => s.setSelectedAgentId)
  const navigate = useNavigate()

  const online = useMemo(() => agents.filter((a) => a.status === 'online').length, [agents])

  if (compact) {
    return (
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <Radio className="h-4 w-4 text-primary" aria-hidden />
            </span>
            Agent fleet
          </h3>
          <button
            type="button"
            className="text-xs font-medium text-primary transition-colors hover:text-primary-dark"
            onClick={() => navigate('/agents')}
          >
            View all →
          </button>
        </div>
        <ul className="space-y-2">
          {agents.slice(0, 4).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-secondary/50 px-3 py-2.5 transition-colors hover:bg-bg-elevated/40"
            >
              <span className="truncate font-mono text-xs text-text-primary">{a.name}</span>
              <span className={statusBadge(a.status)}>{a.status}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Agent fleet</h1>
        <p className="page-subtitle">
          Live status, throughput, and region for each runtime sensor. Select an agent to correlate with
          events.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <div className="card p-5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Nodes</p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
            {agents.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Healthy</p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-emerald-400">
            {online}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
            Aggregate EPS
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-primary">
            {agents.reduce((s, a) => s + a.eventsPerSec, 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {agents.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              setSelected(a.id === selectedId ? null : a.id)
              navigate('/events', { state: { agentId: a.id } })
            }}
            className={clsx(
              'group text-left rounded-2xl border bg-bg-card/80 p-5 transition-all duration-250 ease-smooth',
              'shadow-panel-sm hover:shadow-panel',
              selectedId === a.id
                ? 'border-primary/45 ring-1 ring-primary/25 shadow-glow-primary'
                : 'border-border-subtle hover:border-border/50',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono font-medium tracking-tight text-text-primary">{a.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">{a.host}</p>
              </div>
              <span className={statusBadge(a.status)}>{a.status}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Cpu className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
                <span className="tabular-nums">{a.eventsPerSec} evt/s</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Globe2 className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
                <span>{a.region ?? '—'}</span>
              </div>
              <div className="col-span-2 text-text-muted">
                v{a.version} · seen{' '}
                {formatDistanceToNow(a.lastSeen, {
                  addSuffix: true,
                })}
              </div>
            </dl>
            {selectedId === a.id && (
              <p className="mt-4 rounded-lg bg-primary/10 px-2.5 py-1.5 text-2xs font-medium text-primary ring-1 ring-primary/20">
                Selected — open Event feed for filters
              </p>
            )}
          </button>
        ))}
      </div>

      {agents.some((a) => a.status === 'offline') && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-sm text-amber-200/90 ring-1 ring-amber-500/10">
          <ServerCrash className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <span className="leading-relaxed">
            One or more agents are offline or stale — investigate host health and TLS to the control
            plane.
          </span>
        </div>
      )}
    </div>
  )
}
