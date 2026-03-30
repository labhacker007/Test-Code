#!/bin/bash
# Test script to send sample events to mock cloud

CLOUD_URL="http://localhost:8080"
AGENT_ID="test-agent-local"

echo "Runtime AI Security - Integration Test"
echo "======================================"
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s "$CLOUD_URL/health")
echo "   Response: $HEALTH"
echo ""

# Test 2: Send benign package event
echo "2. Sending benign package event (npm/lodash)..."
curl -s -X POST "$CLOUD_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "'"$AGENT_ID"'",
    "events": [{
      "version": "1.0",
      "event_id": "test-001",
      "event_type": "package_install",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "agent_id": "'"$AGENT_ID"'",
      "agent_version": "0.1.0",
      "device": {
        "hostname": "test-laptop",
        "os": "darwin",
        "os_version": "25.4.0",
        "arch": "arm64",
        "user": "tester"
      },
      "data": {
        "ecosystem": "npm",
        "package_name": "lodash",
        "version": "4.17.21",
        "registry": "https://registry.npmjs.org"
      },
      "verdict": {
        "decision": "allow",
        "confidence": 1.0,
        "reason": "Package in allowlist",
        "rule_id": "ALLOWLIST"
      }
    }]
  }' | jq . 2>/dev/null || echo "   Sent (jq not available for pretty print)"

echo ""

# Test 3: Send suspicious package event
echo "3. Sending suspicious package event (pip/requsets - typosquat)..."
curl -s -X POST "$CLOUD_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "'"$AGENT_ID"'",
    "events": [{
      "version": "1.0",
      "event_id": "test-002",
      "event_type": "package_install",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "agent_id": "'"$AGENT_ID"'",
      "agent_version": "0.1.0",
      "device": {
        "hostname": "test-laptop",
        "os": "darwin",
        "os_version": "25.4.0",
        "arch": "arm64",
        "user": "tester"
      },
      "data": {
        "ecosystem": "pip",
        "package_name": "requsets",
        "version": "2.31.0",
        "registry": "https://pypi.org",
        "install_script": {
          "present": true,
          "hash": "abc123",
          "suspicious_patterns": ["curl", "eval", ".ssh"]
        }
      },
      "verdict": {
        "decision": "deny",
        "confidence": 0.9,
        "reason": "Typosquat + suspicious install script",
        "rule_id": "TYPOSQUAT_PIP_REQUESTS"
      }
    }]
  }' | jq . 2>/dev/null || echo "   Sent"

echo ""

# Test 4: Send AI tool call event
echo "4. Sending AI tool call event (shell_exec)..."
curl -s -X POST "$CLOUD_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "'"$AGENT_ID"'",
    "events": [{
      "version": "1.0",
      "event_id": "test-003",
      "event_type": "ai_tool_call",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "agent_id": "'"$AGENT_ID"'",
      "agent_version": "0.1.0",
      "device": {
        "hostname": "test-laptop",
        "os": "darwin",
        "os_version": "25.4.0",
        "arch": "arm64",
        "user": "tester"
      },
      "data": {
        "client": "cursor",
        "tool_name": "shell_exec",
        "args": {"command": "ls -la"}
      },
      "verdict": {
        "decision": "alert",
        "confidence": 0.7,
        "reason": "High-risk tool usage",
        "rule_id": "AI_TOOL_SHELL_EXEC"
      }
    }]
  }' | jq . 2>/dev/null || echo "   Sent"

echo ""
echo "✅ Test complete!"
echo ""
echo "Check mock cloud logs for received events:"
echo "   tail -f terminals/100495.txt"
