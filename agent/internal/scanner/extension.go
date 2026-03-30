package scanner

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
	"github.com/labhacker007/Test-Code/agent/internal/policy"
	"github.com/labhacker007/Test-Code/agent/internal/transport"
	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

type ExtensionScanner struct {
	policy    *policy.Engine
	transport *transport.Transport
	watcher   *fsnotify.Watcher
}

func NewExtensionScanner(p *policy.Engine, t *transport.Transport) *ExtensionScanner {
	return &ExtensionScanner{
		policy:    p,
		transport: t,
	}
}

func (s *ExtensionScanner) ScanExtension(ide, extensionPath string) *events.Verdict {
	// Read extension manifest
	manifestPath := filepath.Join(extensionPath, "package.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		log.Printf("Error reading extension manifest: %v", err)
		return nil
	}

	var manifest map[string]interface{}
	if err := json.Unmarshal(data, &manifest); err != nil {
		log.Printf("Error parsing extension manifest: %v", err)
		return nil
	}

	// Extract metadata
	extensionID := extractString(manifest, "name")
	version := extractString(manifest, "version")
	publisher := extractString(manifest, "publisher")

	// Extract permissions and activation events
	permissions := s.extractPermissions(manifest)
	activationEvents := s.extractActivationEvents(manifest)

	// Determine marketplace
	marketplace := "sideload"
	if strings.Contains(extensionPath, ".vscode") {
		marketplace = "vscode"
	} else if strings.Contains(extensionPath, ".cursor") {
		marketplace = "cursor"
	}

	// Create event
	device := getCurrentDevice()
	eventData := events.ExtensionData{
		IDE:              ide,
		ExtensionID:      extensionID,
		Version:          version,
		Publisher:        publisher,
		Marketplace:      marketplace,
		Permissions:      permissions,
		ActivationEvents: activationEvents,
	}

	event := events.NewExtensionEvent("", "", device, eventData)

	// Evaluate policy
	verdict := s.policy.Evaluate(&event)
	event.Verdict = verdict

	// Send to cloud
	s.transport.Send(&event)

	log.Printf("Extension scan: %s/%s@%s -> %s (confidence: %.2f)",
		publisher, extensionID, version, verdict.Decision, verdict.Confidence)

	return verdict
}

func (s *ExtensionScanner) WatchExtensionDirs(dirs []string) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	s.watcher = watcher

	for _, dir := range dirs {
		if err := watcher.Add(dir); err != nil {
			log.Printf("Warning: Failed to watch %s: %v", dir, err)
			continue
		}
		log.Printf("Watching extension directory: %s", dir)
	}

	go s.watchLoop()
	return nil
}

func (s *ExtensionScanner) watchLoop() {
	for {
		select {
		case event, ok := <-s.watcher.Events:
			if !ok {
				return
			}
			if event.Op&fsnotify.Create == fsnotify.Create {
				if isExtensionDir(event.Name) {
					log.Printf("New extension detected: %s", event.Name)
					s.ScanExtension("vscode", event.Name)
				}
			}
		case err, ok := <-s.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("Watcher error: %v", err)
		}
	}
}

func (s *ExtensionScanner) hashExtensionDir(path string) string {
	// Simplified: hash the package.json
	manifestPath := filepath.Join(path, "package.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return ""
	}
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func (s *ExtensionScanner) extractPermissions(manifest map[string]interface{}) []string {
	perms := []string{}

	// Check contributes section
	if contributes, ok := manifest["contributes"].(map[string]interface{}); ok {
		if commands, ok := contributes["commands"].([]interface{}); ok && len(commands) > 0 {
			perms = append(perms, "commands")
		}
		if _, ok := contributes["configuration"]; ok {
			perms = append(perms, "configuration")
		}
	}

	// Check for network access indicators
	if deps, ok := manifest["dependencies"].(map[string]interface{}); ok {
		for dep := range deps {
			if strings.Contains(dep, "http") || strings.Contains(dep, "request") || strings.Contains(dep, "axios") {
				perms = append(perms, "network")
				break
			}
		}
	}

	return perms
}

func (s *ExtensionScanner) extractActivationEvents(manifest map[string]interface{}) []string {
	if activationEvents, ok := manifest["activationEvents"].([]interface{}); ok {
		events := make([]string, len(activationEvents))
		for i, event := range activationEvents {
			if str, ok := event.(string); ok {
				events[i] = str
			}
		}
		return events
	}
	return []string{}
}

func extractString(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}

func isExtensionDir(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	if !info.IsDir() {
		return false
	}
	manifestPath := filepath.Join(path, "package.json")
	_, err = os.Stat(manifestPath)
	return err == nil
}
