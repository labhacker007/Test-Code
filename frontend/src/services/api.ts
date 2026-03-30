import type {
  AgentNode,
  DetectionRule,
  LiveMetrics,
  PolicyState,
  QuarantineItem,
  SecurityEvent,
  WebSocketMessage,
} from '@/types'
import { useStore } from '@/store/useStore'

/** Vite proxies /api → /v1 and /ws → backend WebSocket */
const API_PREFIX = '/api'

async function parseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchEvents(params?: Record<string, string>): Promise<SecurityEvent[] | null> {
  const q = params ? `?${new URLSearchParams(params)}` : ''
  const res = await fetch(`${API_PREFIX}/events${q}`)
  const data = await parseJson<{ items?: SecurityEvent[]; events?: SecurityEvent[] }>(res)
  if (!data) return null
  return data.items ?? data.events ?? null
}

export async function fetchRules(): Promise<DetectionRule[] | null> {
  const res = await fetch(`${API_PREFIX}/rules`)
  const data = await parseJson<{ items?: DetectionRule[]; rules?: DetectionRule[] }>(res)
  if (!data) return null
  return data.items ?? data.rules ?? null
}

export async function patchRule(id: string, body: Partial<DetectionRule>): Promise<boolean> {
  const res = await fetch(`${API_PREFIX}/rules/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

export async function createRule(rule: Partial<DetectionRule>): Promise<DetectionRule | null> {
  const res = await fetch(`${API_PREFIX}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  })
  return parseJson<DetectionRule>(res)
}

export async function fetchAgents(): Promise<AgentNode[] | null> {
  const res = await fetch(`${API_PREFIX}/agents`)
  const data = await parseJson<{ items?: AgentNode[]; agents?: AgentNode[] }>(res)
  if (!data) return null
  return data.items ?? data.agents ?? null
}

export async function fetchMetrics(): Promise<Partial<LiveMetrics> | null> {
  const res = await fetch(`${API_PREFIX}/metrics`)
  return parseJson<LiveMetrics>(res)
}

export async function fetchPolicy(): Promise<Partial<PolicyState> | null> {
  const res = await fetch(`${API_PREFIX}/policy`)
  return parseJson<PolicyState>(res)
}

export async function updatePolicy(body: Partial<PolicyState>): Promise<boolean> {
  const res = await fetch(`${API_PREFIX}/policy`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

export async function postEmergencyBlock(active: boolean): Promise<boolean> {
  const res = await fetch(`${API_PREFIX}/emergency-block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  })
  return res.ok
}

export async function fetchQuarantine(): Promise<QuarantineItem[] | null> {
  const res = await fetch(`${API_PREFIX}/quarantine`)
  const data = await parseJson<{ items?: QuarantineItem[] }>(res)
  if (!data) return null
  return data.items ?? null
}

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

function randomVerdict(): SecurityEvent['verdict'] {
  const r = Math.random()
  if (r > 0.92) return 'deny'
  if (r > 0.78) return 'alert'
  return 'allow'
}

function mockEvent(): SecurityEvent {
  const types = [
    'prompt_injection',
    'pii_leak',
    'tool_abuse',
    'mcp_anomaly',
    'rag_drift',
    'jailbreak_attempt',
  ]
  const agents = ['ag-1', 'ag-2', 'ag-3']
  const type = types[Math.floor(Math.random() * types.length)]
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ts: Date.now(),
    type,
    agentId: agents[Math.floor(Math.random() * agents.length)],
    agentName: 'runtime',
    verdict: randomVerdict(),
    severity: Math.random() > 0.85 ? 'high' : 'medium',
    summary: `Synthetic ${type.replace(/_/g, ' ')} check`,
    latencyMs: Math.random() * 0.9,
    ruleId: 'r-pi-001',
  }
}

let mockTimer: ReturnType<typeof setInterval> | null = null

function startMockStream() {
  if (mockTimer) return
  const store = useStore.getState()
  mockTimer = setInterval(() => {
    const e = mockEvent()
    store.pushEvent(e)
    store.setMetrics({
      eventsPerSec: Math.min(500, store.metrics.eventsPerSec + (Math.random() - 0.5) * 8),
      blocksPerMin: store.metrics.blocksPerMin + (e.verdict === 'deny' ? 1 : 0) * 0.05,
      alertsPerMin: store.metrics.alertsPerMin + (e.verdict === 'alert' ? 1 : 0) * 0.05,
    })
    store.appendTimelinePoint({
      t: Date.now(),
      events: 15 + Math.random() * 40,
      blocks: e.verdict === 'deny' ? 4 + Math.random() * 6 : Math.random() * 3,
      alerts: e.verdict === 'alert' ? 3 + Math.random() * 5 : Math.random() * 2,
    })
  }, 2200)
}

function stopMockStream() {
  if (mockTimer) {
    clearInterval(mockTimer)
    mockTimer = null
  }
}

function handleWsMessage(raw: string) {
  let msg: WebSocketMessage | null = null
  try {
    msg = JSON.parse(raw) as WebSocketMessage
  } catch {
    return
  }
  const store = useStore.getState()
  if (!msg || typeof msg !== 'object' || !('type' in msg)) return
  switch (msg.type) {
    case 'event':
      store.pushEvent(msg.payload)
      break
    case 'metrics':
      store.setMetrics(msg.payload)
      break
    case 'agent':
      store.patchAgent(msg.payload.id, msg.payload)
      break
    default:
      break
  }
}

/** Connect WebSocket; falls back to low-rate mock events if the server is unavailable */
export function connectWebSocket(): () => void {
  const store = useStore.getState()
  let socket: WebSocket | null = null
  let closed = false

  try {
    socket = new WebSocket(wsUrl())
  } catch {
    store.setWsConnected(false)
    startMockStream()
    return () => stopMockStream()
  }

  socket.onopen = () => {
    store.setWsConnected(true)
    stopMockStream()
  }

  socket.onclose = () => {
    store.setWsConnected(false)
    if (!closed) startMockStream()
  }

  socket.onerror = () => {
    store.setWsConnected(false)
  }

  socket.onmessage = (ev) => {
    if (typeof ev.data === 'string') handleWsMessage(ev.data)
  }

  return () => {
    closed = true
    stopMockStream()
    socket?.close()
  }
}

export async function bootstrapApi(): Promise<void> {
  const store = useStore.getState()
  const [events, rules, agents, metrics, policy, quarantine] = await Promise.all([
    fetchEvents(),
    fetchRules(),
    fetchAgents(),
    fetchMetrics(),
    fetchPolicy(),
    fetchQuarantine(),
  ])
  store.hydrateFromApi({
    events: events ?? undefined,
    rules: rules ?? undefined,
    agents: agents ?? undefined,
    metrics: metrics ?? undefined,
    policy: policy ?? undefined,
    quarantine: quarantine ?? undefined,
  })
}

export function exportEventsJson(events: SecurityEvent[]): string {
  return JSON.stringify(events, null, 2)
}

export function exportEventsCsv(events: SecurityEvent[]): string {
  const headers = [
    'id',
    'ts',
    'type',
    'agentId',
    'verdict',
    'severity',
    'summary',
    'ruleId',
    'falsePositive',
  ]
  const rows = events.map((e) =>
    [
      e.id,
      e.ts,
      e.type,
      e.agentId,
      e.verdict,
      e.severity,
      JSON.stringify(e.summary),
      e.ruleId ?? '',
      e.falsePositive ? 'true' : 'false',
    ].join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
