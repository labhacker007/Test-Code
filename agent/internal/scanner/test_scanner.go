package scanner

import (
	"strings"
	"time"

	"github.com/labhacker007/Test-Code/agent/pkg/rules"
)

// ScanResult contains detection verdict and metadata
type ScanResult struct {
	Decision        string   `json:"decision"`
	Confidence      float64  `json:"confidence"`
	Reason          string   `json:"reason"`
	MatchedRules    []string `json:"matched_rules"`
	MatchedPatterns []string `json:"matched_patterns,omitempty"`
	LoopDetected    bool     `json:"loop_detected,omitempty"`
	LatencyMs       float64  `json:"latency_ms"`
}

// ScanPackageInstall checks a package install without actually installing
func ScanPackageInstall(ecosystem, packageName, version string, installScript []byte, ruleEngine *rules.Engine) *ScanResult {
	start := time.Now()

	result := &ScanResult{
		Decision:     "allow",
		Confidence:   0.5,
		MatchedRules: []string{},
	}

	// Check 1: Typosquat detection
	if isTyposquat(packageName) {
		result.Decision = "deny"
		result.Confidence = 0.95
		result.Reason = "Typosquat of popular package detected"
		result.MatchedRules = append(result.MatchedRules, "TYPOSQUAT_DETECTED")
		result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
		return result
	}

	// Check 2: Allowlist
	if isInAllowlist(ecosystem, packageName) {
		result.Decision = "allow"
		result.Confidence = 1.0
		result.Reason = "Package in allowlist"
		result.MatchedRules = append(result.MatchedRules, "ALLOWLIST")
		result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
		return result
	}

	// Check 3: Install script patterns
	if installScript != nil && len(installScript) > 0 {
		suspiciousPatterns := analyzeInstallScript(installScript)
		if len(suspiciousPatterns) > 0 {
			result.Decision = "deny"
			result.Confidence = 0.90
			result.Reason = "Suspicious install script patterns detected"
			result.MatchedRules = append(result.MatchedRules, "MALICIOUS_INSTALL_SCRIPT")
			result.MatchedPatterns = suspiciousPatterns
			result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
			return result
		}
	}

	// Default: allow with low confidence (would go to LLM in production)
	result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
	return result
}

// CheckAITool checks AI tool calls for suspicious patterns
func CheckAITool(toolName string, args map[string]interface{}, ruleEngine *rules.Engine) *ScanResult {
	start := time.Now()

	result := &ScanResult{
		Decision:        "allow",
		Confidence:      0.5,
		MatchedRules:    []string{},
		MatchedPatterns: []string{},
	}

	// Check 1: High-risk tools
	highRiskTools := []string{"shell_exec", "exec", "system", "eval"}
	for _, risky := range highRiskTools {
		if strings.EqualFold(toolName, risky) {
			result.Decision = "alert"
			result.Confidence = 0.85

			// Check command patterns if shell_exec
			if cmd, ok := args["cmd"].(string); ok {
				patterns := detectDestructivePatterns(cmd)
				if len(patterns) > 0 {
					result.MatchedPatterns = patterns
					result.Reason = "High-risk tool with destructive command pattern"
					result.Confidence = 0.95
				} else {
					result.Reason = "High-risk tool usage"
				}
			} else if command, ok := args["command"].(string); ok {
				patterns := detectDestructivePatterns(command)
				if len(patterns) > 0 {
					result.MatchedPatterns = patterns
					result.Reason = "High-risk tool with destructive command pattern"
					result.Confidence = 0.95
				} else {
					result.Reason = "High-risk tool usage"
				}
			}

			result.MatchedRules = append(result.MatchedRules, "HIGH_RISK_SHELL_COMMAND")
			result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
			return result
		}
	}

	// Check 2: Credential access patterns
	if toolName == "file_read" || toolName == "read_file" {
		if path, ok := args["path"].(string); ok {
			if isCredentialPath(path) {
				result.Decision = "deny"
				result.Confidence = 0.98
				result.Reason = "Attempt to access sensitive credential file"
				result.MatchedRules = append(result.MatchedRules, "CREDENTIAL_ACCESS_ATTEMPT")
				result.MatchedPatterns = []string{path}
				result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
				return result
			}
		}
	}

	// Check 3: Network exfiltration
	if toolName == "http_request" || toolName == "fetch" || toolName == "request" {
		if url, ok := args["url"].(string); ok {
			if !isAllowedDomain(url) {
				if method, ok := args["method"].(string); ok && strings.ToUpper(method) == "POST" {
					result.Decision = "alert"
					result.Confidence = 0.80
					result.Reason = "HTTP POST to unknown domain (potential exfiltration)"
					result.MatchedRules = append(result.MatchedRules, "NETWORK_EXFIL_PATTERN")
					result.MatchedPatterns = []string{url}
					result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
					return result
				}
			}
		}
	}

	// Default: allow
	result.LatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
	return result
}

// CheckMCPServer validates MCP server security
func CheckMCPServer(config map[string]interface{}, ruleEngine *rules.Engine) *ScanResult {
	result := &ScanResult{
		Decision:     "allow",
		Confidence:   0.5,
		MatchedRules: []string{},
	}

	serverName, _ := config["mcp_server"].(string)

	// Check if server is trusted
	trustedServers := []string{"cursor-ide-browser", "filesystem", "calculator"}
	trusted := false
	for _, ts := range trustedServers {
		if serverName == ts {
			trusted = true
			break
		}
	}

	if !trusted {
		// Check claims
		if claims, ok := config["claims"].(map[string]interface{}); ok {
			if role, ok := claims["role"].(string); ok {
				if strings.Contains(role, "admin") || strings.Contains(role, "root") {
					result.Decision = "deny"
					result.Confidence = 0.95
					result.Reason = "Untrusted server claiming high privileges"
					result.MatchedRules = append(result.MatchedRules, "MCP_AGENT_IMPERSONATION")
					return result
				}
			}
		}

		result.Decision = "alert"
		result.Confidence = 0.70
		result.Reason = "Unknown MCP server"
		result.MatchedRules = append(result.MatchedRules, "MCP_UNKNOWN_SERVER")
	}

	return result
}

// Helper functions

func isTyposquat(packageName string) bool {
	popularPackages := map[string]bool{
		"requests":  true,
		"lodash":    true,
		"react":     true,
		"express":   true,
		"axios":     true,
		"webpack":   true,
		"typescript": true,
	}

	// Check for popular typosquats
	typosquats := map[string]string{
		"requsets":   "requests",
		"requiest":   "requests",
		"lodahs":     "lodash",
		"lodas":      "lodash",
		"reactt":     "react",
		"raect":      "react",
		"expres":     "express",
		"exppress":   "express",
	}

	if _, exists := typosquats[strings.ToLower(packageName)]; exists {
		return true
	}

	// Simple edit distance check
	for popular := range popularPackages {
		if editDistance(strings.ToLower(packageName), popular) <= 2 && 
		   packageName != popular {
			return true
		}
	}

	return false
}

func isInAllowlist(ecosystem, packageName string) bool {
	allowlist := map[string]bool{
		"npm:lodash":     true,
		"npm:react":      true,
		"npm:express":    true,
		"pip:requests":   true,
		"pip:numpy":      true,
		"pip:pandas":     true,
	}

	key := ecosystem + ":" + packageName
	return allowlist[strings.ToLower(key)]
}

func analyzeInstallScript(content []byte) []string {
	patterns := []string{}
	script := string(content)

	suspiciousPatterns := []string{
		"~/.ssh/",
		"~/.aws/",
		"~/.kube/",
		"curl http://",
		"wget http://",
		"eval(",
		"atob(",
		"base64 -d",
		"nc -",
		"/dev/tcp",
		"bash -i",
		"rm -rf",
		"dd if=",
		"GITHUB_TOKEN",
		"AWS_ACCESS_KEY",
	}

	for _, pattern := range suspiciousPatterns {
		if strings.Contains(script, pattern) {
			patterns = append(patterns, pattern)
		}
	}

	return patterns
}

func detectDestructivePatterns(command string) []string {
	patterns := []string{}
	cmd := strings.ToLower(command)

	destructive := []string{
		"rm -rf",
		"dd if=",
		"mkfs",
		"fdisk",
		":(){:|:&};:",  // Fork bomb
		"chmod 777",
		"chown root",
		"> /dev/",
	}

	for _, pattern := range destructive {
		if strings.Contains(cmd, pattern) {
			patterns = append(patterns, pattern)
		}
	}

	return patterns
}

func isCredentialPath(path string) bool {
	credentialPatterns := []string{
		"/.ssh/",
		"/.aws/",
		"/.gcp/",
		"/.azure/",
		"/.kube/",
		"/id_rsa",
		"/id_ed25519",
		"/.bashrc",
		"/.zshrc",
		"/.env",
		"/credentials",
		"/config",  // In .aws, .kube contexts
		"/token",
	}

	pathLower := strings.ToLower(path)
	for _, pattern := range credentialPatterns {
		if strings.Contains(pathLower, pattern) {
			// Additional check: is it in home directory
			if strings.HasPrefix(path, "~/") || strings.HasPrefix(path, "$HOME") || 
			   strings.Contains(path, "/Users/") || strings.Contains(path, "/home/") {
				return true
			}
		}
	}

	return false
}

func isAllowedDomain(url string) bool {
	allowedDomains := []string{
		"localhost",
		"127.0.0.1",
		"registry.npmjs.org",
		"pypi.org",
		"github.com",
		"githubusercontent.com",
	}

	urlLower := strings.ToLower(url)
	for _, domain := range allowedDomains {
		if strings.Contains(urlLower, domain) {
			return true
		}
	}

	return false
}

func editDistance(s1, s2 string) int {
	len1 := len(s1)
	len2 := len(s2)

	if len1 == 0 {
		return len2
	}
	if len2 == 0 {
		return len1
	}

	// Create DP matrix
	matrix := make([][]int, len1+1)
	for i := range matrix {
		matrix[i] = make([]int, len2+1)
		matrix[i][0] = i
	}
	for j := range matrix[0] {
		matrix[0][j] = j
	}

	// Compute Levenshtein distance
	for i := 1; i <= len1; i++ {
		for j := 1; j <= len2; j++ {
			cost := 0
			if s1[i-1] != s2[j-1] {
				cost = 1
			}

			matrix[i][j] = min(
				matrix[i-1][j]+1,      // deletion
				matrix[i][j-1]+1,      // insertion
				matrix[i-1][j-1]+cost, // substitution
			)
		}
	}

	return matrix[len1][len2]
}

func min(nums ...int) int {
	if len(nums) == 0 {
		return 0
	}
	m := nums[0]
	for _, n := range nums[1:] {
		if n < m {
			m = n
		}
	}
	return m
}
