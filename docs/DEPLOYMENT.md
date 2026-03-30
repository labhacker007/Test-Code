# Deployment Guide

## Cloud Control Plane Deployment

This guide covers production deployment of the Runtime AI Security cloud control plane.

---

## Architecture Components

```
┌─────────────────────────────────────────────┐
│  Load Balancer (HTTPS/TLS termination)     │
│  ├─ /v1/events → Ingestion API             │
│  ├─ /v1/policy → Policy API                │
│  └─ /integration → SIEM endpoints          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  API Servers (horizontal scaling)           │
│  - Gin HTTP framework                       │
│  - Event validation and enrichment          │
│  - Policy distribution                      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Message Queue (SQS, Kafka, Pub/Sub)       │
│  - Decouples ingestion from analysis       │
│  - Handles burst traffic                   │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Analysis Workers (async)                   │
│  - Rule evaluation                          │
│  - Reputation lookup                        │
│  - LLM/SLM (Phase 2)                       │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Storage Layer                              │
│  ├─ PostgreSQL (events, verdicts, policy)  │
│  ├─ TimescaleDB (time-series telemetry)   │
│  └─ S3 (artifacts, logs)                   │
└─────────────────────────────────────────────┘
```

---

## AWS Deployment (Recommended for Phase 1)

### Infrastructure Setup

**Required AWS Services:**
- **Application Load Balancer** (ALB) with ACM certificate
- **ECS Fargate** or **EKS** for API servers
- **SQS** for event queue
- **RDS PostgreSQL** (Multi-AZ)
- **S3** for artifacts and logs
- **CloudWatch** for monitoring
- **Secrets Manager** for credentials

### Terraform Example (Simplified)

```hcl
# VPC and networking (use existing or create)
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier           = "runtime-ai-security"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true
  multi_az           = true
  
  db_name  = "runtime_ai_security"
  username = "dbadmin"
  password = var.db_password  # From Secrets Manager
  
  backup_retention_period = 7
  skip_final_snapshot    = false
}

# SQS Queue
resource "aws_sqs_queue" "events" {
  name                      = "runtime-ai-security-events"
  visibility_timeout_seconds = 300
  message_retention_seconds = 1209600  # 14 days
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "runtime-ai-security"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "runtime-ai-api"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "512"
  memory                  = "1024"

  container_definitions = jsonencode([{
    name  = "api"
    image = "your-ecr-repo/cloud-api:latest"
    
    environment = [
      {name = "DATABASE_URL", value = "postgres://..."},
      {name = "SQS_QUEUE_URL", value = aws_sqs_queue.events.url}
    ]
    
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/runtime-ai-api"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "api"
      }
    }
  }])
}

# ALB
resource "aws_lb" "main" {
  name               = "runtime-ai-security-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
}
```

### Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgres://user:pass@rds-endpoint:5432/runtime_ai_security?sslmode=require

# Queue
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/runtime-ai-security-events

# SIEM Integration
XSIAM_WEBHOOK_URL=https://tenant.xdr.us.paloaltonetworks.com/logs/v1/event
XSIAM_API_TOKEN_SECRET_ARN=arn:aws:secretsmanager:...

WIZ_WEBHOOK_URL=https://webhook.wiz.io/...
WIZ_API_TOKEN_SECRET_ARN=arn:aws:secretsmanager:...

# Application
LISTEN_ADDR=:8080
LOG_LEVEL=info
CORS_ALLOWED_ORIGINS=https://dashboard.your-company.com
```

---

## GCP Deployment

### Infrastructure Setup

**Required GCP Services:**
- **Cloud Load Balancing** with managed SSL
- **Cloud Run** or **GKE** for API
- **Cloud Pub/Sub** for event queue
- **Cloud SQL (PostgreSQL)**
- **Cloud Storage** for artifacts
- **Secret Manager** for credentials

### Cloud Run Deployment

```bash
# Build and push container
docker build -t gcr.io/your-project/cloud-api:latest ./cloud
docker push gcr.io/your-project/cloud-api:latest

# Deploy to Cloud Run
gcloud run deploy runtime-ai-api \
  --image gcr.io/your-project/cloud-api:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=postgres://... \
  --set-env-vars PUBSUB_TOPIC=projects/your-project/topics/ai-security-events \
  --allow-unauthenticated=false \
  --min-instances=2 \
  --max-instances=100 \
  --memory=1Gi \
  --cpu=1
```

---

## Azure Deployment

### Infrastructure Setup

**Required Azure Services:**
- **Application Gateway** with SSL
- **Azure Container Apps** or **AKS**
- **Azure Service Bus** for queue
- **Azure Database for PostgreSQL**
- **Azure Blob Storage**
- **Key Vault** for secrets

---

## Database Schema Initialization

### PostgreSQL Setup

```bash
# Connect to database
psql $DATABASE_URL

# Schema is auto-created by application on first run
# Or manually initialize:
```

```sql
CREATE DATABASE runtime_ai_security;

\c runtime_ai_security

-- Tables are created automatically by cloud/internal/storage/database.go
-- But can be pre-created for review:

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    device_info JSONB,
    data JSONB,
    verdict JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_id ON events(agent_id);
CREATE INDEX idx_event_type ON events(event_type);
CREATE INDEX idx_timestamp ON events(timestamp);

-- Policies, verdicts, agents tables created similarly
```

### Database Sizing

| Endpoints | Events/day | Storage/month | RDS Instance |
|-----------|------------|---------------|--------------|
| 100 | 50K | ~5GB | db.t3.medium |
| 1,000 | 500K | ~50GB | db.m5.large |
| 10,000 | 5M | ~500GB | db.m5.xlarge |

Adjust based on actual event volume during pilot.

---

## SIEM Integration Setup

### XSIAM Configuration

1. **Create Data Collector in XSIAM:**
   - Navigate to Settings → Data Sources → Add Collector
   - Select "HTTP Collector"
   - Note the endpoint URL and generate API token

2. **Configure Cloud API:**

```bash
export XSIAM_WEBHOOK_URL="https://api-your-tenant.xdr.us.paloaltonetworks.com/logs/v1/event"
export XSIAM_API_TOKEN="your-token-from-step-1"
```

3. **Verify Integration:**

```bash
# Check cloud logs for successful webhook posts
kubectl logs -n runtime-ai-security deployment/cloud-api | grep XSIAM
```

### Wiz Configuration

1. **Enable Wiz Defend Webhook:**
   - Wiz Console → Settings → Integrations → Webhooks
   - Create new webhook, note URL

2. **Configure Cloud API:**

```bash
export WIZ_WEBHOOK_URL="https://webhook.wiz.io/..."
```

3. **Bidirectional (Phase 2):**
   - Query Wiz GraphQL API for vulnerability context
   - Push custom findings to Wiz

---

## Scaling Considerations

### API Scaling

- **Horizontal:** 2-10 instances for 1K-10K endpoints
- **Auto-scaling:** CPU >70% or request queue depth
- **Connection pooling:** PostgreSQL max_connections / num_instances

### Queue Sizing

- **Throughput:** 10K-100K events/sec peak
- **Retention:** 14 days (for replay/debugging)
- **DLQ:** For failed analysis attempts

### Database Optimization

- **Partitioning:** Partition `events` table by timestamp (monthly)
- **Archival:** Move events >90 days to S3 (compliance retention)
- **Indexes:** Monitor query patterns, add indexes as needed

---

## Security Hardening

### Network

- **Private subnets** for API and database
- **NAT Gateway** for outbound (SIEM webhooks)
- **Security Groups:** 
  - ALB: 443 from internet
  - API: 8080 from ALB only
  - DB: 5432 from API only

### Secrets Management

- **AWS Secrets Manager** / **GCP Secret Manager** / **Azure Key Vault**
- Rotate database credentials every 90 days
- Agent certificates from internal CA (not public)

### Monitoring

- **CloudWatch / Stackdriver / Azure Monitor**: API latency, error rates, queue depth
- **Alarms:** 
  - API error rate >1%
  - Queue age >5 minutes
  - Database connections >80%

---

## Backup and Disaster Recovery

### Database Backups

- **Automated daily snapshots** (RDS/Cloud SQL)
- **Point-in-time recovery** enabled
- **Cross-region replication** for critical deployments

### Policy Versioning

- Store policy bundles in version control (Git)
- Sign and deploy via CI/CD
- Rollback capability via policy ID

### Agent Offline Resilience

Agents continue operating with last known policy if cloud unavailable:
- Local queue buffers events
- Retries with exponential backoff
- Fail-open or fail-closed per org policy

---

## Cost Estimation (AWS Example)

For **1,000 endpoints** with **permissive mode**:

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ALB | 2 LCUs | $30 |
| ECS Fargate | 4 tasks × 0.5 vCPU | $90 |
| RDS PostgreSQL | db.m5.large Multi-AZ | $400 |
| SQS | 500K requests/day | $5 |
| S3 | 100GB storage | $3 |
| Data Transfer | 500GB outbound (to SIEM) | $45 |
| **Total** | | **~$573/month** |

Scale approximately linearly with endpoint count (primarily database).

---

## Production Checklist

- [ ] TLS certificates installed and valid
- [ ] Database encrypted at rest
- [ ] Secrets in managed secret store (not environment variables)
- [ ] Monitoring and alerting configured
- [ ] Backup and restore tested
- [ ] SIEM integration verified with test events
- [ ] Policy signing keys secured (HSM recommended)
- [ ] Log retention policy documented
- [ ] Incident response runbook created
- [ ] Agent deployment tested on each OS
- [ ] Rollback procedure documented

---

## Support and Maintenance

### Routine Maintenance

- **Weekly:** Review critical alerts, tune false positives
- **Monthly:** Update policy rules based on new threat intel
- **Quarterly:** Review and rotate credentials
- **Annually:** Disaster recovery drill

### Monitoring Dashboards

Key metrics to track:
- Agent online count (expect 95%+ for healthy fleet)
- Event ingestion rate and lag
- Policy distribution latency
- SIEM webhook success rate
- Database query performance

### Upgrade Process

1. Test new version in staging environment
2. Deploy cloud API with blue/green or canary
3. Update agent policy with new version pointer
4. Agents auto-update on next policy fetch (or manual rollout)
5. Monitor error rates during rollout
6. Rollback if error rate >5%

---

## Multi-Region Deployment (Optional)

For global deployments:

- **Regional API clusters** (reduce latency)
- **Centralized database** or **read replicas**
- **Agent routes to nearest region** via geo-DNS
- **Cross-region policy sync**

---

## Compliance and Audit

### Audit Logging

All policy changes and manual approvals logged:
- Who: Admin user/API key
- What: Policy change, allowlist/denylist update
- When: Timestamp
- Why: Reason code (incident response, false positive tuning)

### Evidence Collection

For SOC2/ISO27001 audits:
- Event retention: 90 days minimum (configurable)
- Policy version history: All versions retained
- Agent inventory: Real-time via heartbeats

---

## Next Steps After Deployment

1. Complete SIEM integration testing
2. Deploy agents to pilot group
3. Establish SOC triage workflow
4. Document runbooks for common scenarios
5. Schedule first policy tuning review (2 weeks post-pilot)

See `ARCHITECTURE.md` for design rationale and `docs/INSTALLATION.md` for agent installation steps.
