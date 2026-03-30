import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns'
import { useStore } from '@/store/useStore'

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { color: '#8b95b0', boxWidth: 10, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#1a1f2e',
      borderColor: '#2a3144',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(42,49,68,0.6)' },
      ticks: { color: '#8b95b0', maxRotation: 0, font: { size: 10 } },
    },
    y: {
      grid: { color: 'rgba(42,49,68,0.6)' },
      ticks: { color: '#8b95b0' },
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
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Blocks',
          data: timeline.map((p) => p.blocks),
          borderColor: '#ff3366',
          backgroundColor: 'rgba(255,51,102,0.06)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Alerts',
          data: timeline.map((p) => p.alerts),
          borderColor: '#ffcc00',
          borderDash: [4, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }),
    [timeline],
  )

  return (
    <div className="card p-4 h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-primary">Threat timeline</h3>
        <span className="text-[10px] uppercase tracking-wider text-text-secondary">
          Last 24 buckets
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  )
}
