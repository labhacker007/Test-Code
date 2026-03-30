import { FormEvent } from 'react'
import { AlertOctagon, Ban, CheckCircle2, ListPlus, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { useStore } from '@/store/useStore'
import { postEmergencyBlock, updatePolicy } from '@/services/api'
import type { PolicyMode } from '@/types'

const modes: { id: PolicyMode; label: string; hint: string }[] = [
  { id: 'permissive', label: 'Permissive', hint: 'Log-only; minimal blocking' },
  { id: 'monitor', label: 'Monitor', hint: 'Alert-heavy; selective block' },
  { id: 'blocking', label: 'Blocking', hint: 'Enforce deny paths' },
]

export default function PreventionControls() {
  const policy = useStore((s) => s.policy)
  const setPolicyMode = useStore((s) => s.setPolicyMode)
  const setEmergencyBlock = useStore((s) => s.setEmergencyBlock)
  const addAllow = useStore((s) => s.addAllow)
  const addDeny = useStore((s) => s.addDeny)
  const removeAllow = useStore((s) => s.removeAllow)
  const removeDeny = useStore((s) => s.removeDeny)
  const listAllowInput = useStore((s) => s.listAllowInput)
  const listDenyInput = useStore((s) => s.listDenyInput)
  const setListAllowInput = useStore((s) => s.setListAllowInput)
  const setListDenyInput = useStore((s) => s.setListDenyInput)
  const quarantine = useStore((s) => s.quarantine)
  const updateQuarantineStatus = useStore((s) => s.updateQuarantineStatus)

  const applyMode = async (mode: PolicyMode) => {
    setPolicyMode(mode)
    await updatePolicy({ mode })
  }

  const flipEmergency = async () => {
    const next = !policy.emergencyBlock
    setEmergencyBlock(next)
    await postEmergencyBlock(next)
  }

  const onAllowSubmit = (e: FormEvent) => {
    e.preventDefault()
    addAllow(listAllowInput)
  }

  const onDenySubmit = (e: FormEvent) => {
    e.preventDefault()
    addDeny(listDenyInput)
  }

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Prevention controls</h1>
        <p className="page-subtitle">
          Policy posture, allow/deny surfaces, emergency stop, and quarantine review (NeMo-style rails
          + runtime blocking).
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => void applyMode(m.id)}
            className={clsx(
              'group text-left rounded-2xl border bg-bg-card/80 p-5 transition-all duration-250 ease-smooth',
              'shadow-panel-sm hover:shadow-panel',
              policy.mode === m.id
                ? 'border-primary/50 bg-primary/8 ring-1 ring-primary/25 shadow-glow-primary'
                : 'border-border-subtle hover:border-border/60',
            )}
          >
            <div className="mb-2 flex items-center gap-2.5">
              <span
                className={clsx(
                  'flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-colors',
                  policy.mode === m.id
                    ? 'bg-primary/15 ring-primary/25'
                    : 'bg-bg-elevated/80 ring-border-subtle group-hover:bg-bg-elevated',
                )}
              >
                <Shield
                  className={clsx(
                    'h-4 w-4',
                    policy.mode === m.id ? 'text-primary' : 'text-text-muted',
                  )}
                  aria-hidden
                />
              </span>
              <span className="font-semibold tracking-tight text-text-primary">{m.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-text-muted">{m.hint}</p>
          </button>
        ))}
      </div>

      <div className="card flex flex-col gap-5 border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:p-6">
        <div className="min-w-0 space-y-1.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-400">
            <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden />
            Emergency block
          </h2>
          <p className="max-w-xl text-xs leading-relaxed text-text-muted">
            Immediately short-circuit risky traffic paths across all agents. Use during active incident
            response.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void flipEmergency()}
          className={clsx(
            'shrink-0 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-250',
            policy.emergencyBlock
              ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
              : 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 hover:shadow-rose-400/30',
          )}
        >
          {policy.emergencyBlock ? 'Lift emergency' : 'Activate emergency block'}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <div className="card p-5 md:p-6">
          <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
            </span>
            Allowlist
          </h3>
          <form onSubmit={onAllowSubmit} className="mb-4 flex gap-2">
            <input
              className="input-field flex-1 font-mono text-sm"
              placeholder="host or pattern"
              value={listAllowInput}
              onChange={(e) => setListAllowInput(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0 px-4">
              <ListPlus className="h-4 w-4" />
              Add
            </button>
          </form>
          <ul className="space-y-2 text-sm">
            {policy.allowlist.map((x) => (
              <li
                key={x}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-secondary/60 px-3 py-2.5 font-mono text-xs transition-colors hover:bg-bg-elevated/50"
              >
                <span className="truncate text-text-primary">{x}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => removeAllow(x)}
                  aria-label={`Remove ${x}`}
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5 md:p-6">
          <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20">
              <Ban className="h-4 w-4 text-rose-400" aria-hidden />
            </span>
            Denylist
          </h3>
          <form onSubmit={onDenySubmit} className="mb-4 flex gap-2">
            <input
              className="input-field flex-1 font-mono text-sm"
              placeholder="host or pattern"
              value={listDenyInput}
              onChange={(e) => setListDenyInput(e.target.value)}
            />
            <button type="submit" className="btn-danger shrink-0 px-4">
              <ListPlus className="h-4 w-4" />
              Add
            </button>
          </form>
          <ul className="space-y-2 text-sm">
            {policy.denylist.map((x) => (
              <li
                key={x}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-secondary/60 px-3 py-2.5 font-mono text-xs transition-colors hover:bg-bg-elevated/50"
              >
                <span className="truncate text-text-primary">{x}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => removeDeny(x)}
                  aria-label={`Remove ${x}`}
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="table-shell overflow-hidden">
        <div className="border-b border-border-subtle bg-bg-secondary/40 px-5 py-4">
          <h3 className="text-sm font-semibold tracking-tight text-text-primary">Quarantine queue</h3>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="table-header-row text-left text-2xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Preview</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quarantine.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-border-subtle/60 transition-colors hover:bg-bg-elevated/35"
                >
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-text-muted">
                    {format(q.ts, 'MMM d HH:mm')}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-text-secondary">{q.agentId}</td>
                  <td className="max-w-[200px] truncate px-5 py-3">{q.reason}</td>
                  <td className="max-w-[240px] truncate px-5 py-3 font-mono text-[11px] text-text-muted">
                    {q.payloadPreview}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={clsx(
                        'badge',
                        q.status === 'pending' && 'badge-warning',
                        q.status === 'released' && 'badge-success',
                        q.status === 'blocked' && 'badge-danger',
                      )}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {q.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg border border-emerald-500/35 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
                            onClick={() => updateQuarantineStatus(q.id, 'released')}
                          >
                            Release
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-500/35 px-2.5 py-1 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                            onClick={() => updateQuarantineStatus(q.id, 'blocked')}
                          >
                            Block
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quarantine.length === 0 && (
            <p className="py-10 text-center text-sm text-text-muted">Quarantine is empty.</p>
          )}
        </div>
      </div>
    </div>
  )
}
