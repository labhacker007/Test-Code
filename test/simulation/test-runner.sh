#!/bin/bash
# Automated Test Runner for Simulation Environment

set -e

echo "🧪 Runtime AI Security - Simulation Test Runner"
echo "================================================"
echo ""

CLOUD_API="${CLOUD_API:-http://cloud-api:8080}"
AGENT_API="${AGENT_API:-http://runtime-agent:9090}"
RESULTS_DIR="${RESULTS_DIR:-/results}"

mkdir -p "$RESULTS_DIR"
RESULTS_FILE="$RESULTS_DIR/test-results-$(date +%Y%m%d-%H%M%S).json"

echo "Configuration:"
echo "  Cloud API: $CLOUD_API"
echo "  Agent API: $AGENT_API"
echo "  Results: $RESULTS_FILE"
echo ""

# Wait for services
echo "Waiting for services to be ready..."
for i in {1..30}; do
  if curl -sf "$CLOUD_API/health" >/dev/null 2>&1; then
    echo "  ✓ Cloud API ready"
    break
  fi
  sleep 2
done

# Initialize results
cat > "$RESULTS_FILE" << EOF
{
  "test_run_id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "scenarios": []
}
EOF

# Test scenarios
declare -a SCENARIOS=(
  "typosquat:requsets"
  "malicious_script:malicious-script-test"
  "benign:lodash"
  "ai_shell:shell_exec"
  "prompt_injection:file_read"
)

PASSED=0
FAILED=0

for scenario in "${SCENARIOS[@]}"; do
  IFS=':' read -r type package <<< "$scenario"
  
  echo ""
  echo "Testing: $type - $package"
  echo "---"
  
  case "$type" in
    typosquat|malicious_script|benign)
      # Simulate package install event
      RESPONSE=$(curl -sf -X POST "$CLOUD_API/v1/events" \
        -H "Content-Type: application/json" \
        -d "{
          \"agent_id\": \"test-runner\",
          \"events\": [{
            \"version\": \"1.0\",
            \"event_id\": \"$(uuidgen)\",
            \"event_type\": \"package_install\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"agent_id\": \"test-runner\",
            \"agent_version\": \"0.1.0\",
            \"device\": {
              \"hostname\": \"test-runner\",
              \"os\": \"linux\",
              \"os_version\": \"alpine\",
              \"arch\": \"amd64\",
              \"user\": \"tester\"
            },
            \"data\": {
              \"ecosystem\": \"npm\",
              \"package_name\": \"$package\",
              \"version\": \"1.0.0\"
            }
          }]
        }" 2>&1)
      
      if [ $? -eq 0 ]; then
        echo "  ✓ Event submitted"
        ((PASSED++))
      else
        echo "  ✗ Event submission failed"
        ((FAILED++))
      fi
      ;;
      
    ai_shell|prompt_injection)
      # Simulate AI tool call
      RESPONSE=$(curl -sf -X POST "$CLOUD_API/v1/events" \
        -H "Content-Type: application/json" \
        -d "{
          \"agent_id\": \"test-runner\",
          \"events\": [{
            \"version\": \"1.0\",
            \"event_id\": \"$(uuidgen)\",
            \"event_type\": \"ai_tool_call\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"agent_id\": \"test-runner\",
            \"agent_version\": \"0.1.0\",
            \"device\": {
              \"hostname\": \"test-runner\",
              \"os\": \"linux\",
              \"os_version\": \"alpine\",
              \"arch\": \"amd64\",
              \"user\": \"tester\"
            },
            \"data\": {
              \"client\": \"cursor\",
              \"tool_name\": \"$package\",
              \"args\": {
                \"command\": \"echo MIMIC: rm -rf /\"
              }
            }
          }]
        }" 2>&1)
      
      if [ $? -eq 0 ]; then
        echo "  ✓ Event submitted"
        ((PASSED++))
      else
        echo "  ✗ Event submission failed"
        ((FAILED++))
      fi
      ;;
  esac
  
  sleep 1
done

echo ""
echo "================================================"
echo "Test Summary:"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "  Total: $((PASSED + FAILED))"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
