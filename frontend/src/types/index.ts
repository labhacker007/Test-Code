/** Verdict from runtime policy / detection pipeline */
export type Verdict = 'allow' | 'deny' | 'alert'

/** Global policy posture (MEDUSA-style blocking vs observe) */
export type PolicyMode = 'permissive' | 'blocking' | 'monitor'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  id: string
  ts: number
  type: string
  agentId: string
  agentName?: string
  verdict: Verdict
  severity: Severity
  summary: string
  detail?: string
  ruleId?: string
  ruleName?: string
  falsePositive?: boolean
  latencyMs?: number
  metadata?: Record<string, string>
}

export interface DetectionRule {
  id: string
  name: string
  category: string
  enabled: boolean
  description: string
  patternCount?: number
  fpRate?: number
  /** Analyst-marked false positive for tuning (MEDUSA-style FP reduction) */
  flaggedFp?: boolean
  lastTriggered?: number
  severity: Severity
}

export interface DetectionStats {
  totalRules: number
  activeAnalyzers: number
  fpReductionPct: number
  triggers24h: number
  topCategory: string
}

export interface AgentNode {
  id: string
  name: string
  host: string
  status: 'online' | 'degraded' | 'offline'
  version: string
  eventsPerSec: number
  lastSeen: number
  region?: string
}

export interface QuarantineItem {
  id: string
  agentId: string
  reason: string
  ts: number
  payloadPreview: string
  status: 'pending' | 'released' | 'blocked'
}

export interface PolicyState {
  mode: PolicyMode
  emergencyBlock: boolean
  allowlist: string[]
  denylist: string[]
}

export interface LiveMetrics {
  eventsPerSec: number
  blocksPerMin: number
  alertsPerMin: number
  avgLatencyMs: number
  subMsDetectionsPct: number
}

export interface TimelinePoint {
  t: number
  events: number
  blocks: number
  alerts: number
}

export type WebSocketMessage =
  | { type: 'event'; payload: SecurityEvent }
  | { type: 'metrics'; payload: Partial<LiveMetrics> }
  | { type: 'agent'; payload: Partial<AgentNode> & { id: string } }
  | { type: 'ping' }
