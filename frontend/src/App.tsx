import { useEffect } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import {
  Activity,
  LayoutDashboard,
  ListTree,
  Radio,
  Server,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { clsx } from 'clsx'
import { bootstrapApi, connectWebSocket } from '@/services/api'
import { useStore } from '@/store/useStore'
import Dashboard from '@/components/Dashboard'
import EventFeed from '@/components/EventFeed'
import DetectionRules from '@/components/DetectionRules'
import PreventionControls from '@/components/PreventionControls'
import AgentFleet from '@/components/AgentFleet'

const nav = [
  { to: '/', label: 'Monitoring', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Event feed', icon: Radio },
  { to: '/detection', label: 'Detection', icon: ListTree },
  { to: '/prevention', label: 'Prevention', icon: Shield },
  { to: '/agents', label: 'Agents', icon: Server },
]

function Shell() {
  const wsConnected = useStore((s) => s.wsConnected)

  useEffect(() => {
    void bootstrapApi()
    const disconnect = connectWebSocket()
    return () => disconnect()
  }, [])

  return (
    <div className="min-h-screen flex bg-bg-primary">
      <aside className="w-60 shrink-0 flex flex-col border-r border-border-subtle bg-bg-secondary/95 backdrop-blur-xl">
        <div className="p-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShieldAlert className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted">
                Runtime AI
              </p>
              <p className="font-semibold text-text-primary leading-tight tracking-tight">
                Security Platform
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-bg-tertiary/80 px-3 py-2 ring-1 ring-border-subtle">
            <span
              className={clsx(
                'inline-flex h-2 w-2 rounded-full transition-shadow duration-500',
                wsConnected
                  ? 'bg-emerald-400 shadow-glow-success'
                  : 'bg-amber-400 animate-pulse-soft',
              )}
              aria-hidden
            />
            <span className="text-xs text-text-secondary">
              {wsConnected ? 'Live stream connected' : 'Reconnecting / demo'}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-250 ease-smooth',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/25'
                    : 'text-text-secondary hover:bg-bg-elevated/80 hover:text-text-primary',
                )
              }
            >
              <Icon
                className="h-4 w-4 shrink-0 opacity-90 transition-transform duration-250 group-hover:scale-105"
                aria-hidden
              />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border-subtle">
          <p className="text-[10px] leading-relaxed text-text-muted">
            MEDUSA analyzers · Vigil SOC · Sentinel-scale indicators.
          </p>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-border-subtle bg-bg-secondary/40 backdrop-blur-md flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-2.5 text-sm text-text-secondary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated/60 ring-1 ring-border-subtle">
              <Activity className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <span className="font-medium text-text-primary/90">Operations console</span>
          </div>
          <div className="hidden sm:block text-2xs font-mono text-text-muted tabular-nums">
            API /api → :8080/v1 · WS /ws
          </div>
        </header>
        <main className="flex-1 overflow-auto p-5 md:p-8 scrollbar-thin">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<EventFeed />} />
            <Route path="/detection" element={<DetectionRules />} />
            <Route path="/prevention" element={<PreventionControls />} />
            <Route path="/agents" element={<AgentFleet />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
