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
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" aria-hidden />
            Agent fleet
          </h3>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => navigate('/agents')}
          >
            Drill-down →
          </button>
        </div>
        <ul className="space-y-2">
          {agents.slice(0, 4).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between text-xs border border-border rounded-md px-2 py-1.5 bg-bg-secondary/50"
            >
              <span className="font-mono text-text-primary truncate">{a.name}</span>
              <span className={statusBadge(a.status)}>{a.status}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Agent fleet</h1>
        <p className="text-sm text-text-secondary mt-1">
          Live status, throughput, and region for each runtime sensor. Select an agent to correlate
          with events.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Nodes</p>
          <p className="text-2xl font-mono text-text-primary">{agents.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Healthy</p>
          <p className="text-2xl font-mono text-success">{online}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Aggregate EPS</p>
          <p className="text-2xl font-mono text-primary">
            {agents.reduce((s, a) => s + a.eventsPerSec, 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              setSelected(a.id === selectedId ? null : a.id)
              navigate('/events', { state: { agentId: a.id } })
            }}
            className={clsx(
              'text-left card p-4 border transition-all',
              selectedId === a.id ? 'border-primary ring-1 ring-primary/30' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-medium text-text-primary">{a.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{a.host}</p>
              </div>
              <span className={statusBadge(a.status)}>{a.status}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 text-text-secondary">
                <Cpu className="w-3.5 h-3.5" aria-hidden />
                <span>{a.eventsPerSec} evt/s</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Globe2 className="w-3.5 h-3.5" aria-hidden />
                <span>{a.region ?? '—'}</span>
              </div>
              <div className="col-span-2 text-text-secondary">
                v{a.version} · seen{' '}
                {formatDistanceToNow(a.lastSeen, {
                  addSuffix: true,
                })}
              </div>
            </dl>
            {selectedId === a.id && (
              <p className="mt-3 text-[11px] text-primary">Selected — open Event feed for filters</p>
            )}
          </button>
        ))}
      </div>

      {agents.some((a) => a.status === 'offline') && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
          <ServerCrash className="w-5 h-5 shrink-0" aria-hidden />
          <span>One or more agents are offline or stale — investigate host health and TLS to the
            control plane.</span>
        </div>
      )}
    </div>
  )
}
