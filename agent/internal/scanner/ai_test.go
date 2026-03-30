package scanner

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"sync"
	"time"

	"github.com/labhacker007/Test-Code/agent/pkg/events"
	"github.com/labhacker007/Test-Code/agent/pkg/rules"
)

// AIScanner monitors AI tool calls
type AIScanner struct {
	policy    *policy.Engine
	transport *transport.Transport
	loopCache *loopDetector
}

type loopDetector struct {
	calls map[string][]time.Time
	mu    sync.RWMutex
}

func newLoopDetector() *loopDetector {
	ld := &loopDetector{
		calls: make(map[string][]time.Time),
	}
	
	// Cleanup old entries every minute
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for range ticker.C {
			ld.cleanup()
		}
	}()
	
	return ld
}

func (ld *loopDetector) checkLoop(toolName string, args map[string]interface{}, threshold int, windowSeconds int) bool {
	// Create signature
	sig := createSignature(toolName, args)
	
	ld.mu.Lock()
	defer ld.mu.Unlock()
	
	now := time.Now()
	window := time.Duration(windowSeconds) * time.Second
	
	// Get existing calls for this signature
	calls := ld.calls[sig]
	
	// Filter to calls within window
	validCalls := []time.Time{}
	for _, callTime := range calls {
		if now.Sub(callTime) < window {
			validCalls = append(validCalls, callTime)
		}
	}
	
	// Add current call
	validCalls = append(validCalls, now)
	ld.calls[sig] = validCalls
	
	// Check if threshold exceeded
	return len(validCalls) > threshold
}

func (ld *loopDetector) cleanup() {
	ld.mu.Lock()
	defer ld.mu.Unlock()
	
	now := time.Now()
	maxAge := 10 * time.Minute
	
	for sig, calls := range ld.calls {
		// Filter old calls
		validCalls := []time.Time{}
		for _, callTime := range calls {
			if now.Sub(callTime) < maxAge {
				validCalls = append(validCalls, callTime)
			}
		}
		
		if len(validCalls) == 0 {
			delete(ld.calls, sig)
		} else {
			ld.calls[sig] = validCalls
		}
	}
}

func createSignature(toolName string, args map[string]interface{}) string {
	// Simple hash of tool + args
	data := toolName
	for k, v := range args {
		data += k + "=" + stringify(v)
	}
	
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:8]) // Use first 8 bytes
}

func stringify(v interface{}) string {
	switch val := v.(type) {
	case string:
		return val
	case int, int64, float64, bool:
		return string(rune(val.(int)))
	default:
		return ""
	}
}

// ScanAIToolCall checks an AI tool call for security issues
func ScanAIToolCall(client, toolName string, args map[string]interface{}, ruleEngine *rules.Engine) *ScanResult {
	start := time.Now()

	result := CheckAITool(toolName, args, ruleEngine)
	
	// Add loop detection
	loopDetector := getGlobalLoopDetector()
	if loopDetector.checkLoop(toolName, args, 4, 5) { // 5 calls in 5 seconds
		result.Decision = "alert"
		result.Confidence = 0.90
		result.Reason = "Loop detected: repetitive tool calls"
		result.MatchedRules = append(result.MatchedRules, "AI_TOOL_LOOP_DETECTED")
		result.LoopDetected = true
	}
	
	result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
	return result
}

var globalLoopDetector *loopDetector
var loopDetectorOnce sync.Once

func getGlobalLoopDetector() *loopDetector {
	loopDetectorOnce.Do(func() {
		globalLoopDetector = newLoopDetector()
	})
	return globalLoopDetector
}

// ScanMCPServer validates MCP server configuration
func ScanMCPServer(config map[string]interface{}, ruleEngine *rules.Engine) *ScanResult {
	return CheckMCPServer(config, ruleEngine)
}
