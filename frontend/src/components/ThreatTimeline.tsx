import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns'
import { useStore } from '@/store/useStore'

const TICK = '#94a3b8'
const GRID = 'rgba(30, 41, 59, 0.55)'
const TOOLTIP_BG = '#121826'
const TOOLTIP_BORDER = '#1e293b'

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        color: TICK,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
      },
    },
    tooltip: {
      backgroundColor: TOOLTIP_BG,
      borderColor: TOOLTIP_BORDER,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
    },
  },
  scales: {
    x: {
      grid: { color: GRID },
      ticks: { color: TICK, maxRotation: 0, font: { size: 10 } },
    },
    y: {
      grid: { color: GRID },
      ticks: { color: TICK },
      beginAtZero: true,
    },
  },
}

export default function ThreatTimeline() {
  const timeline = useStore((s) => s.timeline)

  const data = useMemo(
    () => ({
      labels: timeline.map((p) => format(p.t, 'HH:mm')),
      datasets: [
        {
          label: 'Events',
          data: timeline.map((p) => p.events),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Blocks',
          data: timeline.map((p) => p.blocks),
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Alerts',
          data: timeline.map((p) => p.alerts),
          borderColor: '#fbbf24',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }),
    [timeline],
  )

  return (
    <div className="card flex h-[300px] flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-text-primary">Threat timeline</h3>
        <span className="text-2xs font-medium uppercase tracking-widest text-text-muted">
          Last 24 buckets
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  )
}
