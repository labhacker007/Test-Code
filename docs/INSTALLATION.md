# Installation Guide

## Endpoint Agent Installation

### Prerequisites

- Go 1.23+ (for building from source)
- macOS 11+, Linux (kernel 5.8+), or Windows 10+
- 50MB disk space
- Network access to cloud API endpoint

---

## macOS Installation

### Option A: From Binary (Recommended)

```bash
# Download latest release
curl -L https://github.com/labhacker007/Test-Code/releases/latest/download/agent-darwin-arm64 \
  -o runtime-ai-agent

# Verify hash (recommended)
echo "EXPECTED_HASH  runtime-ai-agent" | shasum -a 256 -c

# Install
chmod +x runtime-ai-agent
sudo mv runtime-ai-agent /usr/local/bin/

# Create config directory
mkdir -p ~/.runtime-ai-security

# Download default policy
curl -L https://github.com/labhacker007/Test-Code/releases/latest/download/default-policy.json \
  -o ~/.runtime-ai-security/policy.json
```

### Option B: Build from Source

```bash
git clone https://github.com/labhacker007/Test-Code.git
cd Test-Code/agent
go build -o bin/runtime-ai-agent ./cmd/agent
sudo cp bin/runtime-ai-agent /usr/local/bin/
```

### Configure and Start

```bash
# Create config
cat > ~/.runtime-ai-security/config.yaml <<EOF
cloud_endpoint: https://api.your-company.com
mode: permissive
log_level: info
EOF

# Run agent (foreground for testing)
runtime-ai-agent

# Or run as background service (LaunchAgent)
sudo cp deployment/macos/com.runtime-ai-security.agent.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.runtime-ai-security.agent.plist
```

---

## Linux Installation

### Option A: Package Manager (.deb)

```bash
# Download package
curl -L https://github.com/labhacker007/Test-Code/releases/latest/download/runtime-ai-agent_amd64.deb \
  -o runtime-ai-agent.deb

# Verify signature
curl -L https://github.com/labhacker007/Test-Code/releases/latest/download/runtime-ai-agent_amd64.deb.sig \
  -o runtime-ai-agent.deb.sig
gpg --verify runtime-ai-agent.deb.sig runtime-ai-agent.deb

# Install
sudo dpkg -i runtime-ai-agent.deb
```

### Option B: Binary Installation

```bash
# Download
curl -L https://github.com/labhacker007/Test-Code/releases/latest/download/agent-linux-amd64 \
  -o runtime-ai-agent

# Install
chmod +x runtime-ai-agent
sudo mv runtime-ai-agent /usr/local/bin/

# Create config
sudo mkdir -p /etc/runtime-ai-security
sudo curl -L https://github.com/labhacker007/Test-Code/releases/latest/download/default-policy.json \
  -o /etc/runtime-ai-security/policy.json
```

### systemd Service Setup

```bash
# Create service file
sudo tee /etc/systemd/system/runtime-ai-agent.service > /dev/null <<EOF
[Unit]
Description=Runtime AI Security Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/runtime-ai-agent \
  --cloud-endpoint=https://api.your-company.com \
  --mode=permissive \
  --policy-path=/etc/runtime-ai-security/policy.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable runtime-ai-agent
sudo systemctl start runtime-ai-agent

# Check status
sudo systemctl status runtime-ai-agent
```

### eBPF Setup (Optional - Linux only)

For deeper runtime visibility:

```bash
# Ensure kernel version
uname -r  # Must be 5.8+

# Install BPF headers
sudo apt-get install -y linux-headers-$(uname -r)

# Agent will automatically use eBPF if available
```

---

## Windows Installation

### Binary Installation

```powershell
# Download
Invoke-WebRequest -Uri "https://github.com/labhacker007/Test-Code/releases/latest/download/agent-windows-amd64.exe" `
  -OutFile "runtime-ai-agent.exe"

# Install
Move-Item runtime-ai-agent.exe C:\Program Files\RuntimeAISecurity\

# Create config
New-Item -ItemType Directory -Path "$env:APPDATA\RuntimeAISecurity"
Invoke-WebRequest -Uri "https://github.com/labhacker007/Test-Code/releases/latest/download/default-policy.json" `
  -OutFile "$env:APPDATA\RuntimeAISecurity\policy.json"
```

### Windows Service Setup

```powershell
# Create service
sc.exe create RuntimeAIAgent `
  binPath= "C:\Program Files\RuntimeAISecurity\runtime-ai-agent.exe --cloud-endpoint=https://api.your-company.com" `
  start= auto

# Start service
sc.exe start RuntimeAIAgent
```

---

## Package Manager Hook Installation (Optional)

For transparent package scanning:

### npm Hook

```bash
# Backup original npm
sudo mv /usr/local/bin/npm /usr/local/bin/npm.real

# Install wrapper
sudo cp agent/internal/hooks/shims/npm-wrapper.sh /usr/local/bin/npm
sudo chmod +x /usr/local/bin/npm

# Set environment
echo 'export RUNTIME_AI_AGENT_PATH=/usr/local/bin/runtime-ai-agent' >> ~/.zshrc
source ~/.zshrc
```

### pip Hook

```bash
# Similar for pip
sudo mv /usr/local/bin/pip /usr/local/bin/pip.real
sudo cp agent/internal/hooks/shims/pip-wrapper.sh /usr/local/bin/pip
sudo chmod +x /usr/local/bin/pip
```

---

## Cloud Deployment

### Prerequisites

- Docker and Docker Compose OR Kubernetes
- PostgreSQL 14+ (managed service recommended)
- TLS certificates

### Docker Compose (Development)

```bash
cd deployment/docker
docker-compose up -d
```

### Kubernetes (Production)

```bash
# Create namespace
kubectl create namespace runtime-ai-security

# Create secrets
kubectl create secret generic cloud-db-credentials \
  --from-literal=url='postgres://...' \
  -n runtime-ai-security

# Deploy
kubectl apply -f deployment/kubernetes/
```

### Cloud Configuration

Set required environment variables:

```bash
DATABASE_URL=postgres://...
XSIAM_WEBHOOK_URL=https://...
XSIAM_API_TOKEN=xxx
WIZ_WEBHOOK_URL=https://...
```

---

## Verification

### Test Agent Installation

```bash
# Check agent is running
ps aux | grep runtime-ai-agent

# View logs
tail -f ~/.runtime-ai-security/agent.log

# Test package scan (should show scan message)
npm install lodash
```

### Test Cloud API

```bash
# Health check
curl https://your-cloud-api.example.com/health

# Submit test event (requires auth)
curl -X POST https://your-cloud-api.example.com/v1/events \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Troubleshooting

### Agent not starting

```bash
# Check permissions
ls -la /usr/local/bin/runtime-ai-agent

# Check config
cat ~/.runtime-ai-security/config.yaml

# Run in foreground with debug logging
runtime-ai-agent --log-level=debug
```

### Events not reaching cloud

```bash
# Check network connectivity
curl -v https://your-cloud-api.example.com/health

# Check agent logs for transport errors
grep "transport" ~/.runtime-ai-security/agent.log

# Verify policy is loaded
grep "Policy engine initialized" ~/.runtime-ai-security/agent.log
```

### High false positives

Tune policy mode or adjust allowlist:

```bash
# Switch to audit-only mode temporarily
runtime-ai-agent --mode=audit_only

# Review events and add to allowlist via SOC dashboard
```

---

## Uninstallation

### macOS

```bash
# Stop agent
sudo launchctl unload /Library/LaunchDaemons/com.runtime-ai-security.agent.plist

# Remove files
sudo rm /usr/local/bin/runtime-ai-agent
sudo rm /Library/LaunchDaemons/com.runtime-ai-security.agent.plist
rm -rf ~/.runtime-ai-security

# Restore original npm/pip if wrappers were installed
sudo mv /usr/local/bin/npm.real /usr/local/bin/npm
sudo mv /usr/local/bin/pip.real /usr/local/bin/pip
```

### Linux

```bash
sudo systemctl stop runtime-ai-agent
sudo systemctl disable runtime-ai-agent
sudo rm /etc/systemd/system/runtime-ai-agent.service
sudo rm /usr/local/bin/runtime-ai-agent
sudo rm -rf /etc/runtime-ai-security
```

---

## Next Steps

1. Configure cloud endpoint in agent config
2. Set operating mode based on org risk tolerance
3. Integrate with XSIAM/Wiz via webhook configuration
4. Review SOC dashboard and tune detection rules
5. Roll out to pilot group (5-10 endpoints)
6. Monitor for 2 weeks, measure false positive rate
7. Expand deployment org-wide

See `ARCHITECTURE.md` for design details and `detection-rules/README.md` for rule reference.
