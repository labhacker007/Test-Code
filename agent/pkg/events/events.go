package events

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	Version      string      `json:"version"`
	EventID      string      `json:"event_id"`
	EventType    string      `json:"event_type"`
	Timestamp    time.Time   `json:"timestamp"`
	AgentID      string      `json:"agent_id"`
	AgentVersion string      `json:"agent_version"`
	Device       DeviceInfo  `json:"device"`
	Data         interface{} `json:"data"`
	Verdict      *Verdict    `json:"verdict,omitempty"`
}

type DeviceInfo struct {
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	OSVersion string `json:"os_version"`
	Arch      string `json:"arch"`
	User      string `json:"user"`
}

type Verdict struct {
	Decision   string  `json:"decision"`
	Confidence float64 `json:"confidence"`
	Reason     string  `json:"reason"`
	RuleID     string  `json:"rule_id"`
}

type PackageInstallData struct {
	Ecosystem     string         `json:"ecosystem"`
	PackageName   string         `json:"package_name"`
	Version       string         `json:"version"`
	Registry      string         `json:"registry,omitempty"`
	Hash          *HashInfo      `json:"hash,omitempty"`
	InstallScript *InstallScript `json:"install_script,omitempty"`
}

type HashInfo struct {
	Algorithm string `json:"algorithm"`
	Value     string `json:"value"`
}

type InstallScript struct {
	Present            bool     `json:"present"`
	Hash               string   `json:"hash,omitempty"`
	SuspiciousPatterns []string `json:"suspicious_patterns,omitempty"`
}

type ExtensionData struct {
	IDE              string   `json:"ide"`
	ExtensionID      string   `json:"extension_id"`
	Version          string   `json:"version"`
	Publisher        string   `json:"publisher,omitempty"`
	Marketplace      string   `json:"marketplace"`
	Permissions      []string `json:"permissions,omitempty"`
	ActivationEvents []string `json:"activation_events,omitempty"`
}

type AIToolCallData struct {
	Client      string                 `json:"client"`
	ToolName    string                 `json:"tool_name"`
	Args        map[string]interface{} `json:"args,omitempty"`
	ContextHash string                 `json:"context_hash,omitempty"`
}

type FileAccessData struct {
	Path        string `json:"path"`
	Operation   string `json:"operation"`
	Process     string `json:"process,omitempty"`
	IsSensitive bool   `json:"is_sensitive"`
}

type NetworkConnectionData struct {
	Destination string `json:"destination"`
	Port        int    `json:"port"`
	Protocol    string `json:"protocol"`
	Process     string `json:"process,omitempty"`
}

func NewEvent(agentID, agentVersion string, eventType string, device DeviceInfo, data interface{}) Event {
	return Event{
		Version:      "1.0",
		EventID:      uuid.New().String(),
		EventType:    eventType,
		Timestamp:    time.Now().UTC(),
		AgentID:      agentID,
		AgentVersion: agentVersion,
		Device:       device,
		Data:         data,
	}
}

func NewPackageEvent(agentID, agentVersion string, device DeviceInfo, data PackageInstallData) Event {
	return NewEvent(agentID, agentVersion, "package_install", device, data)
}

func NewExtensionEvent(agentID, agentVersion string, device DeviceInfo, data ExtensionData) Event {
	return NewEvent(agentID, agentVersion, "extension_install", device, data)
}

func NewAIToolCallEvent(agentID, agentVersion string, device DeviceInfo, data AIToolCallData) Event {
	return NewEvent(agentID, agentVersion, "ai_tool_call", device, data)
}

func NewFileAccessEvent(agentID, agentVersion string, device DeviceInfo, data FileAccessData) Event {
	return NewEvent(agentID, agentVersion, "file_access", device, data)
}

func NewHeartbeatEvent(agentID, agentVersion string, device DeviceInfo) Event {
	return NewEvent(agentID, agentVersion, "agent_heartbeat", device, map[string]interface{}{
		"status": "running",
	})
}

func (e *Event) WithVerdict(decision string, confidence float64, reason string, ruleID string) *Event {
	e.Verdict = &Verdict{
		Decision:   decision,
		Confidence: confidence,
		Reason:     reason,
		RuleID:     ruleID,
	}
	return e
}
