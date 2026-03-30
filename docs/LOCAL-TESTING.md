# Local Testing Without Docker

Docker Desktop requires organizational authentication. Testing components directly instead.

## Alternative: Direct Binary Testing

### Option 1: Cloud API with SQLite (Lightweight)

Modify cloud to support SQLite for local testing (no PostgreSQL needed):

```bash
# Run cloud API with in-memory mode
export DATABASE_URL="sqlite::memory:"
./dist/cloud-api
```

### Option 2: Test Agent in Standalone Mode

The agent can run independently and queue events locally:

```bash
# Create policy file
mkdir -p ~/.runtime-ai-security
cp rules/default-policy.json ~/.runtime-ai-security/policy.json

# Run agent (will log errors about cloud connection, but internal logic works)
./dist/runtime-ai-agent \
  --mode=permissive \
  --cloud-endpoint=http://localhost:8080 \
  --log-level=debug
```

### Option 3: Mock Cloud Endpoint

Create a simple test server to receive events:

```bash
# Simple HTTP server that logs received events
python3 -m http.server 8080
```

---

## Testing Without Full Stack

Since Docker requires org auth, here's what we can verify:

1. **Agent functionality** (already verified):
   - ✅ Binary builds and runs
   - ✅ Shows help and accepts flags
   - ✅ Can load policy file

2. **Code quality**:
   - ✅ Compiles without errors
   - ✅ All imports used
   - ✅ Type-safe

3. **Architecture completeness**:
   - ✅ All components implemented
   - ✅ Schemas defined
   - ✅ Integration patterns documented

---

## When Docker Access Available

Once Docker Desktop authentication is resolved:

```bash
cd deployment/docker
docker-compose up -d

# Verify services
docker-compose ps
curl http://localhost:8080/health
open http://localhost:8081  # Dashboard
```

---

## Alternative: Cloud Platform Testing

Skip Docker entirely and deploy directly to AWS/GCP for testing:
- Use managed PostgreSQL (RDS, Cloud SQL)
- Deploy API to Cloud Run or Lambda
- Test with real infrastructure

Would you like me to:
1. Create a lightweight SQLite version for local testing?
2. Set up a simple mock server to test agent → cloud communication?
3. Create deployment instructions for your preferred cloud provider?
