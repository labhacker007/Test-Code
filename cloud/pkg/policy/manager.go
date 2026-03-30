package policy

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

type Manager struct {
	db        *Database
	publicKey ed25519.PublicKey
	privateKey ed25519.PrivateKey
}

type Database interface {
	GetLatestPolicy() (*PolicyBundle, error)
	StorePolicy(*PolicyBundle) error
	GetPolicyForAgent(agentID string) (*PolicyBundle, error)
}

func NewManager(db Database) (*Manager, error) {
	// Generate signing keys (in production, load from secure storage)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}

	return &Manager{
		db:         db,
		publicKey:  publicKey,
		privateKey: privateKey,
	}, nil
}

func (m *Manager) CreatePolicy(rules []interface{}, allowlist, denylist map[string]interface{}, mode string) (*PolicyBundle, error) {
	policyID := fmt.Sprintf("policy-%d", time.Now().Unix())

	bundle := &PolicyBundle{
		Version:   "1.0",
		PolicyID:  policyID,
		IssuedAt:  time.Now(),
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days
		Mode:      mode,
		Rules:     rules,
		Allowlist: allowlist,
		Denylist:  denylist,
	}

	// Sign the bundle
	if err := m.signBundle(bundle); err != nil {
		return nil, err
	}

	// Store in database
	if err := m.db.StorePolicy(bundle); err != nil {
		return nil, err
	}

	log.Printf("Created and signed policy: %s", policyID)
	return bundle, nil
}

func (m *Manager) GetPolicyForAgent(agentID string) (*PolicyBundle, error) {
	// TODO: Support agent-specific policies
	return m.db.GetLatestPolicy()
}

func (m *Manager) UpdateRules(ruleUpdates []interface{}) error {
	// Get current policy
	current, err := m.db.GetLatestPolicy()
	if err != nil {
		return err
	}

	// Apply updates (simplified)
	current.Rules = append(current.Rules, ruleUpdates...)

	// Create new policy version
	_, err = m.CreatePolicy(current.Rules, current.Allowlist, current.Denylist, current.Mode)
	return err
}

func (m *Manager) signBundle(bundle *PolicyBundle) error {
	// Marshal without signature
	bundle.Signature = ""
	canonical, err := json.Marshal(bundle)
	if err != nil {
		return err
	}

	// Sign with private key
	signature := ed25519.Sign(m.privateKey, canonical)
	bundle.Signature = fmt.Sprintf("%x", signature)

	return nil
}

func (m *Manager) VerifyBundle(bundle *PolicyBundle) bool {
	if bundle.Signature == "" {
		return false
	}

	// Extract signature
	var sig []byte
	fmt.Sscanf(bundle.Signature, "%x", &sig)

	// Marshal without signature
	origSig := bundle.Signature
	bundle.Signature = ""
	canonical, err := json.Marshal(bundle)
	bundle.Signature = origSig

	if err != nil {
		return false
	}

	// Verify
	return ed25519.Verify(m.publicKey, canonical, sig)
}

func (m *Manager) StartPolicyDistribution(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Check if policy needs refresh
			current, err := m.db.GetLatestPolicy()
			if err != nil {
				log.Printf("Error fetching policy: %v", err)
				continue
			}

			if time.Now().After(current.ExpiresAt.Add(-24 * time.Hour)) {
				log.Println("Policy approaching expiry, consider refresh")
			}
		}
	}
}

type PolicyBundle struct {
	Version   string                 `json:"version"`
	PolicyID  string                 `json:"policy_id"`
	IssuedAt  time.Time              `json:"issued_at"`
	ExpiresAt time.Time              `json:"expires_at"`
	Mode      string                 `json:"mode"`
	Rules     []interface{}          `json:"rules"`
	Allowlist map[string]interface{} `json:"allowlist"`
	Denylist  map[string]interface{} `json:"denylist"`
	Signature string                 `json:"signature,omitempty"`
}
