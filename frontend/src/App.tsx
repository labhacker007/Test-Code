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
      <aside className="w-56 shrink-0 border-r border-border bg-bg-secondary/80 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" aria-hidden />
            <div>
              <p className="text-xs uppercase tracking-widest text-text-secondary">Runtime AI</p>
              <p className="font-semibold text-text-primary leading-tight">Security Platform</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={clsx(
                'inline-flex h-2 w-2 rounded-full',
                wsConnected ? 'bg-success shadow-[0_0_8px_#00ff88]' : 'bg-warning animate-pulse',
              )}
              aria-hidden
            />
            <span className="text-text-secondary">
              {wsConnected ? 'Live stream' : 'Reconnecting / demo'}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-bg-card text-primary border border-primary/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/60',
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border text-[10px] text-text-secondary leading-relaxed">
          Inspired by MEDUSA analyzers, Vigil SOC real-time hunting, Sentinel sub-ms indicators.
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border flex items-center justify-between px-6 bg-bg-secondary/40">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Activity className="w-4 h-4 text-primary" aria-hidden />
            <span>Operations console</span>
          </div>
          <div className="text-xs text-text-secondary font-mono">API /api → :8080/v1 · WS /ws</div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
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
