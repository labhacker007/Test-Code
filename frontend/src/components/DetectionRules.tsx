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
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Detection & rules</h1>
        <p className="page-subtitle">
          MEDUSA-scale catalog — enable analyzers, tune false positives, and add custom patterns.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        <StatBox label="Total rules (ref)" value={stats.totalRules.toLocaleString()} />
        <StatBox label="Analyzers" value={`${stats.activeAnalyzers}+`} accent="text-primary" />
        <StatBox label="FP reduction" value={`${stats.fpReductionPct}%`} accent="text-emerald-400" />
        <StatBox label="24h triggers" value={stats.triggers24h.toLocaleString()} />
      </div>

      <div className="table-shell overflow-hidden">
        <div className="border-b border-border-subtle bg-bg-secondary/40 px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
            </span>
            Rule inventory
          </h2>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="table-header-row text-left text-2xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Rule</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Patterns</th>
                <th className="px-5 py-3 font-medium">Est. FP rate</th>
                <th className="px-5 py-3 font-medium">State</th>
                <th className="px-5 py-3 font-medium">False positive</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border-subtle/60 transition-colors duration-200 hover:bg-bg-elevated/40"
                >
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium text-text-primary">{r.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
                      {r.description}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-xs text-primary">{r.category}</td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={clsx(
                        'badge',
                        r.severity === 'critical' && 'badge-danger',
                        r.severity === 'high' && 'badge-warning',
                        r.severity === 'medium' &&
                          'bg-sky-500/12 text-sky-300 ring-1 ring-sky-500/20',
                        r.severity === 'low' && 'badge-success',
                      )}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-xs tabular-nums text-text-secondary">
                    {r.patternCount ?? '—'}
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-xs tabular-nums text-text-secondary">
                    {r.fpRate != null ? `${(r.fpRate * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => void onToggle(r.id)}
                      className={clsx(
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
                        r.enabled
                          ? 'bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/25 hover:bg-emerald-500/18'
                          : 'bg-bg-elevated/80 text-text-muted ring-1 ring-border-subtle hover:text-text-primary',
                      )}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {r.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => setRuleFlaggedFp(r.id, !r.flaggedFp)}
                      className={clsx(
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200',
                        r.flaggedFp
                          ? 'bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/20'
                          : 'bg-bg-elevated/80 text-text-muted ring-1 ring-border-subtle hover:border-amber-500/30 hover:text-amber-400/90',
                      )}
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {r.flaggedFp ? 'Flagged' : 'Flag FP'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="mb-6 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
            <Plus className="h-4 w-4 text-primary" aria-hidden />
          </span>
          Custom rule
        </h2>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Name</label>
            <input
              required
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Block leaked system prompt patterns"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Category</label>
            <input
              className="input-field font-mono text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Severity</label>
            <select
              className="select-field w-full"
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
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Description / pattern notes
            </label>
            <textarea
              className="input-field min-h-[100px] resize-y"
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
    <div className="card p-5">
      <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={clsx('mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight', accent)}>
        {value}
      </p>
    </div>
  )
}
