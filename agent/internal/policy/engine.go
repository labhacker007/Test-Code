package policy

import (
	"context"
	"crypto/ed25519"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/labhacker007/Test-Code/agent/pkg/events"
	"github.com/labhacker007/Test-Code/agent/pkg/rules"
)

type PolicyBundle struct {
	Version   string        `json:"version"`
	PolicyID  string        `json:"policy_id"`
	IssuedAt  time.Time     `json:"issued_at"`
	ExpiresAt time.Time     `json:"expires_at"`
	Mode      string        `json:"mode"`
	Rules     []rules.Rule  `json:"rules"`
	Allowlist Allowlist     `json:"allowlist"`
	Denylist  Denylist      `json:"denylist"`
	Signature string        `json:"signature,omitempty"`
}

type Allowlist struct {
	Packages []PackagePattern `json:"packages"`
	Hashes   []string         `json:"hashes"`
	Domains  []string         `json:"domains"`
}

type Denylist struct {
	Packages []DenyPackage `json:"packages"`
	Hashes   []HashEntry   `json:"hashes"`
	Domains  []string      `json:"domains"`
}

type PackagePattern struct {
	Ecosystem      string `json:"ecosystem"`
	Name           string `json:"name"`
	VersionPattern string `json:"version_pattern,omitempty"`
}

type DenyPackage struct {
	Ecosystem string `json:"ecosystem"`
	Name      string `json:"name"`
	Reason    string `json:"reason"`
	Reference string `json:"reference,omitempty"`
}

type HashEntry struct {
	Value     string `json:"value"`
	Algorithm string `json:"algorithm"`
}

type Engine struct {
	bundle      *PolicyBundle
	ruleEngine  *rules.Engine
	mode        string
	policyPath  string
	publicKey   ed25519.PublicKey
}

func NewEngine(policyPath string, mode string) (*Engine, error) {
	engine := &Engine{
		policyPath: policyPath,
		mode:       mode,
		ruleEngine: rules.NewEngine(),
	}

	// Load initial policy
	if err := engine.LoadPolicy(); err != nil {
		log.Printf("Warning: Failed to load policy from %s: %v", policyPath, err)
		// Continue with default policy
		engine.bundle = engine.defaultPolicy()
	}

	engine.ruleEngine.SetMode(engine.mode)
	engine.ruleEngine.LoadRules(engine.bundle.Rules)

	return engine, nil
}

func (e *Engine) LoadPolicy() error {
	data, err := os.ReadFile(e.policyPath)
	if err != nil {
		return err
	}

	var bundle PolicyBundle
	if err := json.Unmarshal(data, &bundle); err != nil {
		return err
	}

	// TODO: Verify signature when public key is configured
	// if e.publicKey != nil && !e.verifySignature(&bundle) {
	//     return fmt.Errorf("invalid policy signature")
	// }

	e.bundle = &bundle
	e.ruleEngine.LoadRules(bundle.Rules)
	
	log.Printf("Loaded policy %s with %d rules", bundle.PolicyID, len(bundle.Rules))
	return nil
}

func (e *Engine) Evaluate(event *events.Event) *events.Verdict {
	// Check denylist first (highest priority)
	if e.isInDenylist(event) {
		return &events.Verdict{
			Decision:   "deny",
			Confidence: 1.0,
			Reason:     "Matches denylist",
			RuleID:     "DENYLIST",
		}
	}

	// Check allowlist
	if e.isInAllowlist(event) {
		return &events.Verdict{
			Decision:   "allow",
			Confidence: 1.0,
			Reason:     "Matches allowlist",
			RuleID:     "ALLOWLIST",
		}
	}

	// Evaluate rules
	return e.ruleEngine.Evaluate(event)
}

func (e *Engine) isInDenylist(event *events.Event) bool {
	if event.EventType == "package_install" {
		data, ok := event.Data.(events.PackageInstallData)
		if !ok {
			return false
		}

		for _, pkg := range e.bundle.Denylist.Packages {
			if pkg.Ecosystem == data.Ecosystem && pkg.Name == data.PackageName {
				return true
			}
		}

		if data.Hash != nil {
			for _, hash := range e.bundle.Denylist.Hashes {
				if hash.Algorithm == data.Hash.Algorithm && hash.Value == data.Hash.Value {
					return true
				}
			}
		}
	}

	return false
}

func (e *Engine) isInAllowlist(event *events.Event) bool {
	if event.EventType == "package_install" {
		data, ok := event.Data.(events.PackageInstallData)
		if !ok {
			return false
		}

		for _, pkg := range e.bundle.Allowlist.Packages {
			if pkg.Ecosystem == data.Ecosystem && pkg.Name == data.PackageName {
				// TODO: Check version pattern match
				return true
			}
		}

		if data.Hash != nil {
			for _, hash := range e.bundle.Allowlist.Hashes {
				if hash == data.Hash.Value {
					return true
				}
			}
		}
	}

	return false
}

func (e *Engine) RuleCount() int {
	return len(e.bundle.Rules)
}

func (e *Engine) StartPolicyUpdater(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := e.LoadPolicy(); err != nil {
				log.Printf("Policy update failed: %v", err)
			} else {
				log.Println("Policy updated successfully")
			}
		}
	}
}

func (e *Engine) defaultPolicy() *PolicyBundle {
	return &PolicyBundle{
		Version:   "1.0",
		PolicyID:  "default-policy",
		IssuedAt:  time.Now(),
		ExpiresAt: time.Now().Add(24 * time.Hour),
		Mode:      e.mode,
		Rules:     []rules.Rule{},
		Allowlist: Allowlist{
			Packages: []PackagePattern{
				{Ecosystem: "npm", Name: "react"},
				{Ecosystem: "npm", Name: "lodash"},
				{Ecosystem: "npm", Name: "express"},
				{Ecosystem: "pip", Name: "requests"},
				{Ecosystem: "pip", Name: "numpy"},
			},
			Hashes:  []string{},
			Domains: []string{"registry.npmjs.org", "pypi.org", "pypi.python.org"},
		},
		Denylist: Denylist{
			Packages: []DenyPackage{},
			Hashes:   []HashEntry{},
			Domains:  []string{},
		},
	}
}

func (e *Engine) verifySignature(bundle *PolicyBundle) bool {
	// TODO: Implement Ed25519 signature verification
	// 1. Marshal bundle without signature field to canonical JSON
	// 2. Verify signature using public key
	return false
}
