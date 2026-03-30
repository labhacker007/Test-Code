import { create } from 'zustand'
import type {
  AgentNode,
  DetectionRule,
  DetectionStats,
  LiveMetrics,
  PolicyState,
  QuarantineItem,
  SecurityEvent,
  TimelinePoint,
  Verdict,
} from '@/types'

const MAX_EVENTS = 500

export type EventFeedFilter = {
  verdict: Verdict | 'all'
  type: string | 'all'
  agentId: string | 'all'
  query: string
}

const defaultFilters: EventFeedFilter = {
  verdict: 'all',
  type: 'all',
  agentId: 'all',
  query: '',
}

const seedRules: DetectionRule[] = [
  {
    id: 'r-pi-001',
    name: 'Direct prompt injection',
    category: 'prompt_injection',
    enabled: true,
    description: 'MEDUSA-style patterns for delimiter and instruction override.',
    patternCount: 120,
    fpRate: 0.02,
    severity: 'high',
  },
  {
    id: 'r-mcp-014',
    name: 'MCP tool abuse',
    category: 'mcp_protocol',
    enabled: true,
    description: 'Suspicious MCP method sequencing and exfiltration.',
    patternCount: 48,
    fpRate: 0.05,
    severity: 'critical',
  },
  {
    id: 'r-rag-022',
    name: 'RAG poisoning indicator',
    category: 'rag_security',
    enabled: false,
    description: 'Chunk hash drift and retrieval anomalies.',
    patternCount: 32,
    fpRate: 0.12,
    severity: 'medium',
  },
]

const seedAgents: AgentNode[] = [
  {
    id: 'ag-1',
    name: 'prod-llm-gateway',
    host: 'gw-01.internal',
    status: 'online',
    version: '2.4.1',
    eventsPerSec: 142,
    lastSeen: Date.now(),
    region: 'us-east-1',
  },
  {
    id: 'ag-2',
    name: 'cursor-runtime',
    host: 'dev-07.internal',
    status: 'online',
    version: '2.4.0',
    eventsPerSec: 89,
    lastSeen: Date.now(),
    region: 'us-west-2',
  },
  {
    id: 'ag-3',
    name: 'batch-inference',
    host: 'gpu-03.internal',
    status: 'degraded',
    version: '2.3.9',
    eventsPerSec: 12,
    lastSeen: Date.now() - 120_000,
    region: 'eu-west-1',
  },
]

function seedEvents(): SecurityEvent[] {
  const now = Date.now()
  return [
    {
      id: 'seed-1',
      ts: now - 120_000,
      type: 'prompt_injection',
      agentId: 'ag-1',
      verdict: 'deny',
      severity: 'high',
      summary: 'Instruction override via system role injection',
      latencyMs: 0.35,
      ruleId: 'r-pi-001',
    },
    {
      id: 'seed-2',
      ts: now - 90_000,
      type: 'pii_leak',
      agentId: 'ag-2',
      verdict: 'alert',
      severity: 'medium',
      summary: 'Potential email in model output',
      latencyMs: 0.22,
    },
    {
      id: 'seed-3',
      ts: now - 60_000,
      type: 'tool_abuse',
      agentId: 'ag-1',
      verdict: 'allow',
      severity: 'low',
      summary: 'Tool call within policy envelope',
      latencyMs: 0.18,
    },
  ]
}

function buildTimeline(): TimelinePoint[] {
  const now = Date.now()
  const step = 60_000
  return Array.from({ length: 24 }, (_, i) => {
    const t = now - (23 - i) * step
    const base = 20 + Math.sin(i / 3) * 15
    return {
      t,
      events: Math.round(base + Math.random() * 25),
      blocks: Math.round(base * 0.08 + Math.random() * 6),
      alerts: Math.round(base * 0.12 + Math.random() * 8),
    }
  })
}

interface AppState {
  events: SecurityEvent[]
  rules: DetectionRule[]
  detectionStats: DetectionStats
  agents: AgentNode[]
  metrics: LiveMetrics
  timeline: TimelinePoint[]
  policy: PolicyState
  quarantine: QuarantineItem[]
  filters: EventFeedFilter
  selectedEventId: string | null
  selectedAgentId: string | null
  wsConnected: boolean
  listAllowInput: string
  listDenyInput: string

  pushEvent: (e: SecurityEvent) => void
  setEvents: (events: SecurityEvent[]) => void
  setRules: (rules: DetectionRule[]) => void
  toggleRule: (id: string) => void
  setRuleFlaggedFp: (id: string, flagged: boolean) => void
  addRule: (rule: Omit<DetectionRule, 'id'> & { id?: string }) => void
  setAgents: (agents: AgentNode[]) => void
  patchAgent: (id: string, patch: Partial<AgentNode>) => void
  setMetrics: (m: Partial<LiveMetrics>) => void
  setTimeline: (t: TimelinePoint[]) => void
  appendTimelinePoint: (p: TimelinePoint) => void
  setPolicy: (p: Partial<PolicyState>) => void
  setPolicyMode: (mode: PolicyState['mode']) => void
  setEmergencyBlock: (v: boolean) => void
  addAllow: (entry: string) => void
  removeAllow: (entry: string) => void
  addDeny: (entry: string) => void
  removeDeny: (entry: string) => void
  setQuarantine: (q: QuarantineItem[]) => void
  updateQuarantineStatus: (id: string, status: QuarantineItem['status']) => void
  setFilters: (f: Partial<EventFeedFilter>) => void
  resetFilters: () => void
  setSelectedEventId: (id: string | null) => void
  setSelectedAgentId: (id: string | null) => void
  setWsConnected: (v: boolean) => void
  setListAllowInput: (s: string) => void
  setListDenyInput: (s: string) => void
  hydrateFromApi: (data: {
    events?: SecurityEvent[]
    rules?: DetectionRule[]
    agents?: AgentNode[]
    metrics?: Partial<LiveMetrics>
    policy?: Partial<PolicyState>
    quarantine?: QuarantineItem[]
    detectionStats?: Partial<DetectionStats>
  }) => void
}

export const useStore = create<AppState>((set) => ({
  events: seedEvents(),
  rules: seedRules,
  detectionStats: {
    totalRules: 7300,
    activeAnalyzers: 76,
    fpReductionPct: 96.8,
    triggers24h: 18420,
    topCategory: 'prompt_injection',
  },
  agents: seedAgents,
  metrics: {
    eventsPerSec: 128,
    blocksPerMin: 42,
    alertsPerMin: 18,
    avgLatencyMs: 0.4,
    subMsDetectionsPct: 94.2,
  },
  timeline: buildTimeline(),
  policy: {
    mode: 'blocking',
    emergencyBlock: false,
    allowlist: ['api.openai.com', 'internal-embeddings.local'],
    denylist: ['known-bad-cdn.example', 'paste.evil'],
  },
  quarantine: [
    {
      id: 'q-1',
      agentId: 'ag-2',
      reason: 'High-confidence injection + tool call',
      ts: Date.now() - 3600_000,
      payloadPreview: '{"role":"system","content":"ignore previous..."}',
      status: 'pending',
    },
  ],
  filters: { ...defaultFilters },
  selectedEventId: null,
  selectedAgentId: null,
  wsConnected: false,
  listAllowInput: '',
  listDenyInput: '',

  pushEvent: (e) =>
    set((s) => ({
      events: [e, ...s.events].slice(0, MAX_EVENTS),
    })),

  setEvents: (events) => set({ events }),

  setRules: (rules) => set({ rules }),

  toggleRule: (id) =>
    set((s) => ({
      rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })),

  setRuleFlaggedFp: (id, flagged) =>
    set((s) => ({
      rules: s.rules.map((r) => (r.id === id ? { ...r, flaggedFp: flagged } : r)),
    })),

  addRule: (rule) =>
    set((s) => ({
      rules: [
        ...s.rules,
        {
          ...rule,
          id: rule.id ?? `r-${Date.now()}`,
        },
      ],
    })),

  setAgents: (agents) => set({ agents }),

  patchAgent: (id, patch) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  setMetrics: (m) =>
    set((s) => ({
      metrics: { ...s.metrics, ...m },
    })),

  setTimeline: (timeline) => set({ timeline }),

  appendTimelinePoint: (p) =>
    set((s) => ({
      timeline: [...s.timeline.slice(-47), p],
    })),

  setPolicy: (p) =>
    set((s) => ({
      policy: { ...s.policy, ...p },
    })),

  setPolicyMode: (mode) =>
    set((s) => ({
      policy: { ...s.policy, mode },
    })),

  setEmergencyBlock: (emergencyBlock) =>
    set((s) => ({
      policy: { ...s.policy, emergencyBlock },
    })),

  addAllow: (entry) => {
    const t = entry.trim()
    if (!t) return
    set((s) => ({
      policy: {
        ...s.policy,
        allowlist: [...new Set([...s.policy.allowlist, t])],
      },
      listAllowInput: '',
    }))
  },

  removeAllow: (entry) =>
    set((s) => ({
      policy: {
        ...s.policy,
        allowlist: s.policy.allowlist.filter((x) => x !== entry),
      },
    })),

  addDeny: (entry) => {
    const t = entry.trim()
    if (!t) return
    set((s) => ({
      policy: {
        ...s.policy,
        denylist: [...new Set([...s.policy.denylist, t])],
      },
      listDenyInput: '',
    }))
  },

  removeDeny: (entry) =>
    set((s) => ({
      policy: {
        ...s.policy,
        denylist: s.policy.denylist.filter((x) => x !== entry),
      },
    })),

  setQuarantine: (quarantine) => set({ quarantine }),

  updateQuarantineStatus: (id, status) =>
    set((s) => ({
      quarantine: s.quarantine.map((q) => (q.id === id ? { ...q, status } : q)),
    })),

  setFilters: (f) =>
    set((s) => ({
      filters: { ...s.filters, ...f },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),

  setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),

  setWsConnected: (wsConnected) => set({ wsConnected }),

  setListAllowInput: (listAllowInput) => set({ listAllowInput }),

  setListDenyInput: (listDenyInput) => set({ listDenyInput }),

  hydrateFromApi: (data) =>
    set((s) => ({
      events: data.events ?? s.events,
      rules: data.rules ?? s.rules,
      agents: data.agents ?? s.agents,
      metrics: { ...s.metrics, ...data.metrics },
      policy: { ...s.policy, ...data.policy },
      quarantine: data.quarantine ?? s.quarantine,
      detectionStats: { ...s.detectionStats, ...data.detectionStats },
    })),
}))
