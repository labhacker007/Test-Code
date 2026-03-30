import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Activity, AlertTriangle, Ban, Gauge, Zap } from 'lucide-react'
import { useStore } from '@/store/useStore'
import ThreatTimeline from '@/components/ThreatTimeline'
import AgentFleet from '@/components/AgentFleet'

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1f2e',
      borderColor: '#2a3144',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#8b95b0', font: { size: 10 } },
    },
    y: {
      grid: { color: 'rgba(42,49,68,0.5)' },
      ticks: { color: '#8b95b0' },
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
          backgroundColor: 'rgba(0,212,255,0.35)',
          borderRadius: 4,
        },
      ],
    }),
    [lastBuckets],
  )

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Monitoring dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1 max-w-2xl">
          Real-time posture for the Runtime AI Security Platform — sub-ms detection indicators,
          fleet health, and threat volume aligned with Sentinel-style guardrails and MEDUSA-scale rule
          coverage.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Activity}
          label="Events / sec"
          value={metrics.eventsPerSec.toFixed(0)}
          hint="Live aggregate"
          accent="text-primary"
        />
        <MetricCard
          icon={Ban}
          label="Blocks / min"
          value={metrics.blocksPerMin.toFixed(0)}
          hint="Policy enforcement"
          accent="text-danger"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alerts / min"
          value={metrics.alertsPerMin.toFixed(0)}
          hint="SOC triage"
          accent="text-warning"
        />
        <MetricCard
          icon={Zap}
          label="Avg latency"
          value={`${metrics.avgLatencyMs.toFixed(2)} ms`}
          hint={`${metrics.subMsDetectionsPct.toFixed(1)}% sub-ms`}
          accent="text-success"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <ThreatTimeline />
          <div className="card p-4 h-[220px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" aria-hidden />
                Throughput (recent)
              </h3>
            </div>
            <div className="flex-1 min-h-0">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Detection coverage</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Active rules</dt>
                <dd className="font-mono text-text-primary">
                  {detectionStats.totalRules.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Analyzers</dt>
                <dd className="font-mono text-text-primary">{detectionStats.activeAnalyzers}+</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">FP reduction</dt>
                <dd className="font-mono text-success">{detectionStats.fpReductionPct}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">24h triggers</dt>
                <dd className="font-mono text-text-primary">
                  {detectionStats.triggers24h.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Top category</dt>
                <dd className="font-mono text-primary text-right truncate max-w-[140px]">
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
}: {
  icon: typeof Activity
  label: string
  value: string
  hint: string
  accent: string
}) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-text-secondary">{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} aria-hidden />
      </div>
      <p className={`text-2xl font-mono font-semibold ${accent}`}>{value}</p>
      <p className="text-[11px] text-text-secondary">{hint}</p>
    </div>
  )
}
