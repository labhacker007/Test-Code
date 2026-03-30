import { FormEvent, useState } from 'react'
import { Flag, Plus, Power, SlidersHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/store/useStore'
import { createRule, patchRule } from '@/services/api'
import type { DetectionRule, Severity } from '@/types'

export default function DetectionRules() {
  const rules = useStore((s) => s.rules)
  const stats = useStore((s) => s.detectionStats)
  const toggleRule = useStore((s) => s.toggleRule)
  const setRuleFlaggedFp = useStore((s) => s.setRuleFlaggedFp)
  const addRule = useStore((s) => s.addRule)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('custom')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const body: Partial<DetectionRule> = {
      name: name.trim(),
      category,
      description: description.trim() || 'User-defined rule',
      enabled: true,
      severity,
      patternCount: 1,
    }
    const created = await createRule(body)
    if (created) {
      addRule(created)
    } else {
      addRule({
        name: body.name!,
        category: body.category!,
        description: body.description!,
        enabled: true,
        severity: body.severity!,
        patternCount: 1,
      })
    }
    setName('')
    setDescription('')
    setSubmitting(false)
  }

  const onToggle = async (id: string) => {
    toggleRule(id)
    const next = useStore.getState().rules.find((x) => x.id === id)?.enabled
    if (next !== undefined) await patchRule(id, { enabled: next })
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Detection & rules</h1>
        <p className="text-sm text-text-secondary mt-1">
          MEDUSA-scale catalog — enable analyzers, tune false positives, and add custom patterns.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Total rules (ref)" value={stats.totalRules.toLocaleString()} />
        <StatBox label="Analyzers" value={`${stats.activeAnalyzers}+`} accent="text-primary" />
        <StatBox label="FP reduction" value={`${stats.fpReductionPct}%`} accent="text-success" />
        <StatBox label="24h triggers" value={stats.triggers24h.toLocaleString()} />
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden />
          Rule inventory
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-text-secondary border-b border-border">
              <tr>
                <th className="py-2 pr-3">Rule</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Severity</th>
                <th className="py-2 pr-3">Patterns</th>
                <th className="py-2 pr-3">Est. FP rate</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3">False positive</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-bg-secondary/40">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{r.description}</p>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-primary">{r.category}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={clsx(
                        'badge',
                        r.severity === 'critical' && 'badge-danger',
                        r.severity === 'high' && 'badge-warning',
                        r.severity === 'medium' && 'badge-warning',
                        r.severity === 'low' && 'badge-success',
                      )}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">{r.patternCount ?? '—'}</td>
                  <td className="py-3 pr-3 font-mono text-xs">
                    {r.fpRate != null ? `${(r.fpRate * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      onClick={() => void onToggle(r.id)}
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border',
                        r.enabled
                          ? 'border-success/50 text-success bg-success/10'
                          : 'border-border text-text-secondary',
                      )}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {r.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      onClick={() => setRuleFlaggedFp(r.id, !r.flaggedFp)}
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border',
                        r.flaggedFp
                          ? 'border-warning text-warning bg-warning/10'
                          : 'border-border text-text-secondary hover:border-warning/50',
                      )}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {r.flaggedFp ? 'Flagged' : 'Flag FP'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-primary" aria-hidden />
          Custom rule
        </h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1">Name</label>
            <input
              required
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Block leaked system prompt patterns"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Category</label>
            <input
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Severity</label>
            <select
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1">Description / pattern notes</label>
            <textarea
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm min-h-[88px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe matcher intent; backend compiles to runtime analyzers."
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Create rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  accent = 'text-text-primary',
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="card p-4">
      <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
      <p className={clsx('text-xl font-mono font-semibold mt-1', accent)}>{value}</p>
    </div>
  )
}
