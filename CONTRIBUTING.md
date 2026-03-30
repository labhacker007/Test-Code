# Contributing to Runtime AI Security Platform

## Development Setup

### Prerequisites

- Go 1.23+
- PostgreSQL 14+ (for cloud development)
- Docker and Docker Compose (optional)
- Git

### Clone and Build

```bash
git clone https://github.com/labhacker007/Test-Code.git
cd Test-Code

# Install dependencies
make deps

# Build everything
make all

# Run tests
make test
```

## Project Structure

See `README.md` for detailed structure. Key directories:

- `agent/` - Endpoint agent (Go)
- `cloud/` - Cloud API and workers (Go)
- `rules/` - Detection rule definitions
- `.cursor/skills/` - Security expert skills for AI development

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow code style:
- `go fmt` before committing
- Add tests for new functionality
- Update documentation

### 3. Test Locally

```bash
# Test agent
cd agent && go test ./...

# Test cloud
cd cloud && go test ./...

# Integration test with docker-compose
make docker-up
# ... test scenarios ...
make docker-down
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Include description of changes
- Reference any related issues
- Ensure CI passes

## Code Style

### Go Guidelines

- Follow [Effective Go](https://go.dev/doc/effective_go)
- Use `gofmt` and `golint`
- Error handling: return errors, don't panic
- Logging: use structured logging where possible

### Detection Rules

- Rule IDs: `UPPER_SNAKE_CASE`
- Include MITRE ATT&CK mapping
- Add references to research/incidents
- Test against benign corpus for false positives

## Testing

### Unit Tests

```go
func TestRuleEvaluation(t *testing.T) {
    engine := rules.NewEngine()
    event := createTestEvent()
    verdict := engine.Evaluate(event)
    
    if verdict.Decision != "deny" {
        t.Errorf("Expected deny, got %s", verdict.Decision)
    }
}
```

### Integration Tests

Test end-to-end flows:
- Agent → Cloud event submission
- Policy distribution
- OCSF transformation

## Security Review

All contributions touching **detection logic**, **policy**, or **hooks** must pass security review:

1. No overly permissive defaults
2. No embedded credentials or keys
3. No `curl | sh` install patterns
4. Align with `.cursor/skills/security-baseline-skills/SKILL.md`

## Documentation

Update relevant docs when changing:
- Architecture: `ARCHITECTURE.md`
- Installation: `docs/INSTALLATION.md`
- Deployment: `docs/DEPLOYMENT.md`
- Detection rules: `detection-rules/README.md`

## Release Process

1. Update version in `Makefile` and relevant files
2. Run `make release` to build all artifacts
3. Tag release: `git tag -a v0.2.0 -m "Release v0.2.0"`
4. Create GitHub release with binaries and checksums
5. Update documentation links to new version

## Questions?

Open an issue for questions or discussion before starting large changes.
