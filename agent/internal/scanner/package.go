package scanner

import (
	"crypto/sha256"
	"encoding/hex"
	"log"

	"github.com/labhacker007/Test-Code/agent/internal/policy"
	"github.com/labhacker007/Test-Code/agent/internal/transport"
	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

type PackageScanner struct {
	policy    *policy.Engine
	transport *transport.Transport
}

func NewPackageScanner(p *policy.Engine, t *transport.Transport) *PackageScanner {
	return &PackageScanner{
		policy:    p,
		transport: t,
	}
}

func (s *PackageScanner) ScanPackage(ecosystem, name, version, registry string, content []byte) *events.Verdict {
	// Compute hash
	hash := sha256.Sum256(content)
	hashStr := hex.EncodeToString(hash[:])

	// Analyze install script
	installScript := s.analyzeInstallScript(content)

	// Create event
	device := getCurrentDevice()
	data := events.PackageInstallData{
		Ecosystem:   ecosystem,
		PackageName: name,
		Version:     version,
		Registry:    registry,
		Hash: &events.HashInfo{
			Algorithm: "sha256",
			Value:     hashStr,
		},
		InstallScript: installScript,
	}

	event := events.NewPackageEvent("", "", device, data)

	// Evaluate policy
	verdict := s.policy.Evaluate(&event)
	event.Verdict = verdict

	// Send to cloud
	s.transport.Send(&event)

	log.Printf("Package scan: %s/%s@%s -> %s (confidence: %.2f)",
		ecosystem, name, version, verdict.Decision, verdict.Confidence)

	return verdict
}

func (s *PackageScanner) analyzeInstallScript(content []byte) *events.InstallScript {
	contentStr := string(content)
	suspicious := []string{}

	// Simple pattern matching for suspicious behaviors
	patterns := map[string]string{
		"curl":        "Network access",
		"wget":        "Network access",
		"base64":      "Obfuscation",
		"eval":        "Dynamic code execution",
		"/dev/tcp":    "Network socket",
		"nc -":        "Netcat usage",
		"bash -i":     "Interactive shell",
		"chmod +x":    "Executable modification",
		"rm -rf":      "Destructive command",
		".ssh":        "SSH access",
		".aws":        "AWS credential access",
		"GITHUB_TOKEN": "Token access",
	}

	for pattern := range patterns {
		if contains(contentStr, pattern) {
			suspicious = append(suspicious, pattern)
		}
	}

	hash := sha256.Sum256(content)

	return &events.InstallScript{
		Present:            len(content) > 0,
		Hash:               hex.EncodeToString(hash[:]),
		SuspiciousPatterns: suspicious,
	}
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && bytesContains([]byte(s), []byte(substr))
}

func bytesContains(b, subslice []byte) bool {
	return len(b) >= len(subslice) && string(b[:len(b)]) != "" && 
		len(subslice) > 0 && indexOf(b, subslice) >= 0
}

func indexOf(s, sep []byte) int {
	n := len(sep)
	if n == 0 {
		return 0
	}
	if n > len(s) {
		return -1
	}
	c := sep[0]
	if n == 1 {
		for i := 0; i < len(s); i++ {
			if s[i] == c {
				return i
			}
		}
		return -1
	}
	for i := 0; i+n <= len(s); i++ {
		if s[i] == c && bytesEqual(s[i:i+n], sep) {
			return i
		}
	}
	return -1
}

func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func getCurrentDevice() events.DeviceInfo {
	// Simplified for MVP
	return events.DeviceInfo{
		Hostname:  "localhost",
		OS:        "darwin",
		OSVersion: "25.4.0",
		Arch:      "arm64",
		User:      "developer",
	}
}
