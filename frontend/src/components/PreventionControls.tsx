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
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Prevention controls</h1>
        <p className="text-sm text-text-secondary mt-1">
          Policy posture, allow/deny surfaces, emergency stop, and quarantine review (NeMo-style
          rails + runtime blocking).
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => void applyMode(m.id)}
            className={clsx(
              'text-left card p-4 border-2 transition-all',
              policy.mode === m.id ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" aria-hidden />
              <span className="font-semibold text-text-primary">{m.label}</span>
            </div>
            <p className="text-xs text-text-secondary">{m.hint}</p>
          </button>
        ))}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-danger/40">
        <div>
          <h2 className="text-sm font-semibold text-danger flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" aria-hidden />
            Emergency block
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Immediately short-circuit risky traffic paths across all agents. Use during active
            incident response.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void flipEmergency()}
          className={clsx(
            'px-5 py-3 rounded-lg font-semibold text-sm shrink-0 transition-colors',
            policy.emergencyBlock
              ? 'bg-success/20 text-success border border-success/50'
              : 'bg-danger text-white hover:bg-danger/90',
          )}
        >
          {policy.emergencyBlock ? 'Lift emergency' : 'Activate emergency block'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-success" aria-hidden />
            Allowlist
          </h3>
          <form onSubmit={onAllowSubmit} className="flex gap-2 mb-3">
            <input
              className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="host or pattern"
              value={listAllowInput}
              onChange={(e) => setListAllowInput(e.target.value)}
            />
            <button type="submit" className="btn-primary flex items-center gap-1">
              <ListPlus className="w-4 h-4" />
              Add
            </button>
          </form>
          <ul className="space-y-1.5 text-sm">
            {policy.allowlist.map((x) => (
              <li
                key={x}
                className="flex items-center justify-between gap-2 font-mono text-xs bg-bg-secondary rounded px-2 py-1.5 border border-border"
              >
                <span className="text-text-primary truncate">{x}</span>
                <button
                  type="button"
                  className="text-text-secondary hover:text-danger shrink-0"
                  onClick={() => removeAllow(x)}
                  aria-label={`Remove ${x}`}
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-danger" aria-hidden />
            Denylist
          </h3>
          <form onSubmit={onDenySubmit} className="flex gap-2 mb-3">
            <input
              className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="host or pattern"
              value={listDenyInput}
              onChange={(e) => setListDenyInput(e.target.value)}
            />
            <button type="submit" className="btn-danger flex items-center gap-1">
              <ListPlus className="w-4 h-4" />
              Add
            </button>
          </form>
          <ul className="space-y-1.5 text-sm">
            {policy.denylist.map((x) => (
              <li
                key={x}
                className="flex items-center justify-between gap-2 font-mono text-xs bg-bg-secondary rounded px-2 py-1.5 border border-border"
              >
                <span className="text-text-primary truncate">{x}</span>
                <button
                  type="button"
                  className="text-text-secondary hover:text-danger shrink-0"
                  onClick={() => removeDeny(x)}
                  aria-label={`Remove ${x}`}
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Quarantine queue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-text-secondary border-b border-border">
              <tr>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2 pr-3">Preview</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quarantine.map((q) => (
                <tr key={q.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                    {format(q.ts, 'MMM d HH:mm')}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{q.agentId}</td>
                  <td className="py-2 pr-3 max-w-[200px] truncate">{q.reason}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] text-text-secondary max-w-[240px] truncate">
                    {q.payloadPreview}
                  </td>
                  <td className="py-2 pr-3">
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
                  <td className="py-2 pr-3 flex flex-wrap gap-1">
                    {q.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-success/50 text-success hover:bg-success/10"
                          onClick={() => updateQuarantineStatus(q.id, 'released')}
                        >
                          Release
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-danger/50 text-danger hover:bg-danger/10"
                          onClick={() => updateQuarantineStatus(q.id, 'blocked')}
                        >
                          Block
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quarantine.length === 0 && (
            <p className="text-sm text-text-secondary py-6 text-center">Quarantine is empty.</p>
          )}
        </div>
      </div>
    </div>
  )
}
