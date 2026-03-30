package analysis

import (
	"log"
	"strings"
)

type Analyzer struct {
	// TODO: Add reputation DB, LLM client
}

type Verdict struct {
	Decision   string  `json:"decision"`
	Confidence float64 `json:"confidence"`
	Reason     string  `json:"reason"`
	Severity   string  `json:"severity"`
	References []string `json:"references,omitempty"`
}

func NewAnalyzer() *Analyzer {
	return &Analyzer{}
}

func (a *Analyzer) Analyze(event map[string]interface{}) *Verdict {
	eventType, _ := event["event_type"].(string)

	switch eventType {
	case "package_install":
		return a.analyzePackage(event)
	case "extension_install":
		return a.analyzeExtension(event)
	case "ai_tool_call":
		return a.analyzeAIToolCall(event)
	default:
		return &Verdict{
			Decision:   "allow",
			Confidence: 0.5,
			Reason:     "Unknown event type",
			Severity:   "info",
		}
	}
}

func (a *Analyzer) analyzePackage(event map[string]interface{}) *Verdict {
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return a.defaultVerdict()
	}

	packageName, _ := data["package_name"].(string)
	ecosystem, _ := data["ecosystem"].(string)

	// Typosquatting detection (simplified)
	if a.isTyposquat(packageName, ecosystem) {
		return &Verdict{
			Decision:   "deny",
			Confidence: 0.85,
			Reason:     "Potential typosquatting attack",
			Severity:   "high",
			References: []string{"https://arxiv.org/pdf/2506.14466"},
		}
	}

	// Install script analysis
	if installScript, ok := data["install_script"].(map[string]interface{}); ok {
		if present, _ := installScript["present"].(bool); present {
			if patterns, ok := installScript["suspicious_patterns"].([]interface{}); ok && len(patterns) >= 3 {
				return &Verdict{
					Decision:   "deny",
					Confidence: 0.75,
					Reason:     "Suspicious install script patterns detected",
					Severity:   "high",
				}
			}
		}
	}

	// TODO: Reputation lookup
	// TODO: LLM semantic analysis for uncertain cases

	return &Verdict{
		Decision:   "allow",
		Confidence: 0.6,
		Reason:     "No strong signals detected",
		Severity:   "info",
	}
}

func (a *Analyzer) analyzeExtension(event map[string]interface{}) *Verdict {
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return a.defaultVerdict()
	}

	// Check for overly broad activation
	if activationEvents, ok := data["activation_events"].([]interface{}); ok {
		for _, ae := range activationEvents {
			if aeStr, ok := ae.(string); ok && aeStr == "*" {
				return &Verdict{
					Decision:   "alert",
					Confidence: 0.7,
					Reason:     "Extension activates on all events",
					Severity:   "medium",
				}
			}
		}
	}

	// Check marketplace
	if marketplace, ok := data["marketplace"].(string); ok && marketplace == "sideload" {
		return &Verdict{
			Decision:   "alert",
			Confidence: 0.6,
			Reason:     "Sideloaded extension (not from official marketplace)",
			Severity:   "medium",
		}
	}

	return a.defaultVerdict()
}

func (a *Analyzer) analyzeAIToolCall(event map[string]interface{}) *Verdict {
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return a.defaultVerdict()
	}

	toolName, _ := data["tool_name"].(string)

	// High-risk tools require stricter analysis
	highRiskTools := []string{"shell_exec", "execute_command", "write_file", "delete_file"}
	for _, risky := range highRiskTools {
		if toolName == risky {
			// TODO: Deeper analysis of args and context
			return &Verdict{
				Decision:   "allow",
				Confidence: 0.7,
				Reason:     "High-risk tool requires monitoring",
				Severity:   "medium",
			}
		}
	}

	return a.defaultVerdict()
}

func (a *Analyzer) isTyposquat(packageName, ecosystem string) bool {
	// Simplified typosquat detection
	// TODO: Use edit distance, popular package list
	popularPackages := map[string][]string{
		"npm": {"react", "vue", "angular", "lodash", "express", "axios"},
		"pip": {"requests", "numpy", "pandas", "django", "flask"},
	}

	popular := popularPackages[ecosystem]
	for _, pop := range popular {
		if a.editDistance(packageName, pop) == 1 {
			log.Printf("Typosquat detected: %s similar to %s", packageName, pop)
			return true
		}
	}

	// Common typosquat patterns
	typosquatPatterns := []string{"requ", "lodsh", "reactt"}
	for _, pattern := range typosquatPatterns {
		if strings.Contains(packageName, pattern) {
			return true
		}
	}

	return false
}

func (a *Analyzer) editDistance(s1, s2 string) int {
	// Simple Levenshtein distance (naive implementation)
	if s1 == s2 {
		return 0
	}
	if len(s1) == 0 {
		return len(s2)
	}
	if len(s2) == 0 {
		return len(s1)
	}

	// Simplified: only detect single-char difference
	if len(s1) != len(s2) {
		if abs(len(s1)-len(s2)) == 1 {
			return 1
		}
		return 99
	}

	diff := 0
	for i := 0; i < len(s1); i++ {
		if s1[i] != s2[i] {
			diff++
		}
	}
	return diff
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func (a *Analyzer) defaultVerdict() *Verdict {
	return &Verdict{
		Decision:   "allow",
		Confidence: 0.5,
		Reason:     "No suspicious patterns detected",
		Severity:   "info",
	}
}
