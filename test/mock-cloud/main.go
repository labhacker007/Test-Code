package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Simple mock cloud server for local testing without Docker

func main() {
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/v1/events", handleEvents)
	http.HandleFunc("/v1/policy/", handlePolicy)

	fmt.Println("Mock Cloud API Server")
	fmt.Println("=====================")
	fmt.Println("Listening on http://localhost:8080")
	fmt.Println("")
	fmt.Println("Endpoints:")
	fmt.Println("  GET  /health          - Health check")
	fmt.Println("  POST /v1/events       - Receive agent events")
	fmt.Println("  GET  /v1/policy/:id   - Serve policy bundle")
	fmt.Println("")
	fmt.Println("Press Ctrl+C to stop")

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %s %s", time.Now().Format("15:04:05"), r.Method, r.URL.Path)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"version": "mock-0.1.0",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	agentID := payload["agent_id"]
	events := payload["events"].([]interface{})

	log.Printf("[%s] POST /v1/events - Agent: %s, Events: %d",
		time.Now().Format("15:04:05"), agentID, len(events))

	// Print first event for inspection
	if len(events) > 0 {
		eventData, _ := json.MarshalIndent(events[0], "  ", "  ")
		fmt.Printf("\n📦 Sample Event:\n  %s\n\n", string(eventData))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "accepted",
		"events_received": len(events),
	})
}

func handlePolicy(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %s %s", time.Now().Format("15:04:05"), r.Method, r.URL.Path)

	policy := map[string]interface{}{
		"version":    "1.0",
		"policy_id":  "mock-policy",
		"issued_at":  time.Now().Format(time.RFC3339),
		"expires_at": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		"mode":       "permissive",
		"rules":      []interface{}{},
		"allowlist": map[string]interface{}{
			"packages": []map[string]string{
				{"ecosystem": "npm", "name": "react"},
				{"ecosystem": "npm", "name": "lodash"},
				{"ecosystem": "pip", "name": "requests"},
			},
			"hashes":  []string{},
			"domains": []string{"registry.npmjs.org", "pypi.org"},
		},
		"denylist": map[string]interface{}{
			"packages": []interface{}{},
			"hashes":   []interface{}{},
			"domains":  []string{},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(policy)
}
