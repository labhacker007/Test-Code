package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labhacker007/Test-Code/agent/internal/hooks"
	"github.com/labhacker007/Test-Code/agent/internal/policy"
	"github.com/labhacker007/Test-Code/agent/internal/scanner"
	"github.com/labhacker007/Test-Code/agent/internal/transport"
	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

const version = "0.1.0"

type Config struct {
	AgentID       string
	CloudEndpoint string
	PolicyPath    string
	Mode          string
	LogLevel      string
}

func main() {
	cfg := parseFlags()

	log.Printf("Runtime AI Security Agent v%s starting", version)
	log.Printf("Agent ID: %s", cfg.AgentID)
	log.Printf("Mode: %s", cfg.Mode)
	log.Printf("Cloud endpoint: %s", cfg.CloudEndpoint)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize policy engine
	policyEngine, err := policy.NewEngine(cfg.PolicyPath, cfg.Mode)
	if err != nil {
		log.Fatalf("Failed to initialize policy engine: %v", err)
	}
	log.Printf("Policy engine initialized with %d rules", policyEngine.RuleCount())

	// Initialize event transport
	transport := transport.NewTransport(cfg.CloudEndpoint, cfg.AgentID, version)
	log.Println("Event transport initialized")

	// Initialize scanner modules
	packageScanner := scanner.NewPackageScanner(policyEngine, transport)
	extensionScanner := scanner.NewExtensionScanner(policyEngine, transport)
	aiScanner := scanner.NewAIScanner(policyEngine, transport)

	log.Println("Scanner modules initialized")

	// Start background workers
	go transport.Start(ctx)
	go policyEngine.StartPolicyUpdater(ctx, 5*time.Minute)

	// Install hooks
	if err := hooks.InstallPackageHooks(packageScanner); err != nil {
		log.Printf("Warning: Failed to install package hooks: %v", err)
	} else {
		log.Println("Package hooks installed")
	}

	if err := hooks.InstallIDEHooks(extensionScanner); err != nil {
		log.Printf("Warning: Failed to install IDE hooks: %v", err)
	} else {
		log.Println("IDE hooks installed")
	}

	if err := hooks.InstallAIHooks(aiScanner); err != nil {
		log.Printf("Warning: Failed to install AI hooks: %v", err)
	} else {
		log.Println("AI hooks installed")
	}

	// Send initial heartbeat
	deviceInfo := events.DeviceInfo{
		Hostname:  getHostname(),
		OS:        "darwin",
		OSVersion: "25.4.0",
		Arch:      "arm64",
		User:      os.Getenv("USER"),
	}

	heartbeat := events.NewHeartbeatEvent(cfg.AgentID, version, deviceInfo)
	transport.Send(&heartbeat)

	log.Println("Agent running. Press Ctrl+C to stop.")

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutdown signal received, cleaning up...")
	cancel()

	// Graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	transport.Shutdown(shutdownCtx)

	log.Println("Agent stopped")
}

func parseFlags() Config {
	cfg := Config{}

	flag.StringVar(&cfg.AgentID, "agent-id", generateAgentID(), "Unique agent identifier")
	flag.StringVar(&cfg.CloudEndpoint, "cloud-endpoint", "https://api.runtime-ai-security.example.com", "Cloud API endpoint")
	flag.StringVar(&cfg.PolicyPath, "policy-path", getDefaultPolicyPath(), "Path to policy bundle")
	flag.StringVar(&cfg.Mode, "mode", "permissive", "Operating mode: strict, permissive, audit_only")
	flag.StringVar(&cfg.LogLevel, "log-level", "info", "Log level: debug, info, warn, error")

	flag.Parse()
	return cfg
}

func generateAgentID() string {
	hostname := getHostname()
	return fmt.Sprintf("agent-%s-%d", hostname, time.Now().Unix())
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return hostname
}

func getDefaultPolicyPath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "./policy.json"
	}
	return fmt.Sprintf("%s/.runtime-ai-security/policy.json", home)
}
