package scanner

import (
	"crypto/sha256"
	"encoding/hex"
	"log"

	"github.com/labhacker007/Test-Code/agent/internal/policy"
	"github.com/labhacker007/Test-Code/agent/internal/transport"
	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

type AIScanner struct {
	policy    *policy.Engine
	transport *transport.Transport
}

func NewAIScanner(p *policy.Engine, t *transport.Transport) *AIScanner {
	return &AIScanner{
		policy:    p,
		transport: t,
	}
}

func (s *AIScanner) ScanToolCall(client, toolName string, args map[string]interface{}, context []byte) *events.Verdict {
	// Hash the input context for prompt injection detection
	contextHash := ""
	if len(context) > 0 {
		hash := sha256.Sum256(context)
		contextHash = "sha256:" + hex.EncodeToString(hash[:])
	}

	// Redact sensitive args
	sanitizedArgs := s.sanitizeArgs(args)

	// Create event
	device := getCurrentDevice()
	data := events.AIToolCallData{
		Client:      client,
		ToolName:    toolName,
		Args:        sanitizedArgs,
		ContextHash: contextHash,
	}

	event := events.NewAIToolCallEvent("", "", device, data)

	// Evaluate policy
	verdict := s.policy.Evaluate(&event)
	event.Verdict = verdict

	// Send to cloud
	s.transport.Send(&event)

	log.Printf("AI tool call: %s/%s -> %s (confidence: %.2f)",
		client, toolName, verdict.Decision, verdict.Confidence)

	return verdict
}

func (s *AIScanner) sanitizeArgs(args map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})

	for key, val := range args {
		switch v := val.(type) {
		case string:
			// Truncate long strings, redact paths
			if len(v) > 1000 {
				sanitized[key] = v[:1000] + "... (truncated)"
			} else {
				sanitized[key] = v
			}
		case int, int64, float64, bool:
			sanitized[key] = v
		case map[string]interface{}:
			sanitized[key] = "<object>"
		case []interface{}:
			sanitized[key] = "<array>"
		default:
			sanitized[key] = "<redacted>"
		}
	}

	return sanitized
}
