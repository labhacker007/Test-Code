import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Activity, AlertTriangle, Ban, Gauge, Zap } from 'lucide-react'
import { useStore } from '@/store/useStore'
import ThreatTimeline from '@/components/ThreatTimeline'
import AgentFleet from '@/components/AgentFleet'

const CHART_TEXT = '#94a3b8'
const CHART_GRID = 'rgba(30, 41, 59, 0.65)'
const CHART_TOOLTIP_BG = '#121826'
const CHART_TOOLTIP_BORDER = '#1e293b'

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: CHART_TOOLTIP_BG,
      borderColor: CHART_TOOLTIP_BORDER,
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: CHART_TEXT, font: { size: 10, family: "'JetBrains Mono', monospace" } },
    },
    y: {
      grid: { color: CHART_GRID },
      ticks: { color: CHART_TEXT, font: { size: 10 } },
      beginAtZero: true,
    },
  },
}

export default function Dashboard() {
  const metrics = useStore((s) => s.metrics)
  const detectionStats = useStore((s) => s.detectionStats)
  const timeline = useStore((s) => s.timeline)

  const lastBuckets = useMemo(() => timeline.slice(-12), [timeline])

  const barData = useMemo(
    () => ({
      labels: lastBuckets.map((_, i) => `-${12 - i}m`),
      datasets: [
        {
          label: 'Events',
          data: lastBuckets.map((p) => p.events),
          backgroundColor: 'rgba(56, 189, 248, 0.45)',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    }),
    [lastBuckets],
  )

  return (
    <div className="max-w-7xl space-y-8 animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Monitoring dashboard</h1>
        <p className="page-subtitle">
          Real-time posture for the Runtime AI Security Platform — sub-ms detection indicators, fleet
          health, and threat volume aligned with Sentinel-style guardrails and MEDUSA-scale rule
          coverage.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <MetricCard
          icon={Activity}
          label="Events / sec"
          value={metrics.eventsPerSec.toFixed(0)}
          hint="Live aggregate"
          accent="text-primary"
          iconBg="bg-primary/10"
        />
        <MetricCard
          icon={Ban}
          label="Blocks / min"
          value={metrics.blocksPerMin.toFixed(0)}
          hint="Policy enforcement"
          accent="text-rose-400"
          iconBg="bg-rose-500/10"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alerts / min"
          value={metrics.alertsPerMin.toFixed(0)}
          hint="SOC triage"
          accent="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <MetricCard
          icon={Zap}
          label="Avg latency"
          value={`${metrics.avgLatencyMs.toFixed(2)} ms`}
          hint={`${metrics.subMsDetectionsPct.toFixed(1)}% sub-ms`}
          accent="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ThreatTimeline />
          <div className="card p-5 flex h-[240px] flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
                  <Gauge className="h-4 w-4 text-primary" aria-hidden />
                </span>
                Throughput (recent)
              </h3>
            </div>
            <div className="min-h-0 flex-1">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold tracking-tight text-text-primary">
              Detection coverage
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <dt className="text-text-secondary">Active rules</dt>
                <dd className="font-mono text-sm tabular-nums text-text-primary">
                  {detectionStats.totalRules.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <dt className="text-text-secondary">Analyzers</dt>
                <dd className="font-mono text-sm tabular-nums text-text-primary">
                  {detectionStats.activeAnalyzers}+
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <dt className="text-text-secondary">FP reduction</dt>
                <dd className="font-mono text-sm tabular-nums text-emerald-400">
                  {detectionStats.fpReductionPct}%
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <dt className="text-text-secondary">24h triggers</dt>
                <dd className="font-mono text-sm tabular-nums text-text-primary">
                  {detectionStats.triggers24h.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-text-secondary shrink-0">Top category</dt>
                <dd className="font-mono text-right text-xs text-primary truncate max-w-[160px]">
                  {detectionStats.topCategory}
                </dd>
              </div>
            </dl>
          </div>
          <AgentFleet compact />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  iconBg,
}: {
  icon: typeof Activity
  label: string
  value: string
  hint: string
  accent: string
  iconBg: string
}) {
  return (
    <div className="card group p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/5 ${iconBg}`}
        >
          <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
        </span>
      </div>
      <p className={`mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight ${accent}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
    </div>
  )
}
