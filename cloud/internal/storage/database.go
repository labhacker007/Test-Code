package storage

import (
	"database/sql"
	"encoding/json"
	"time"

	_ "github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

func NewDatabase(connectionString string) (*Database, error) {
	if connectionString == "" {
		connectionString = "postgres://localhost/runtime_ai_security?sslmode=disable"
	}

	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	// Initialize schema
	if err := initSchema(db); err != nil {
		return nil, err
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func initSchema(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS events (
		id SERIAL PRIMARY KEY,
		event_id UUID UNIQUE NOT NULL,
		agent_id VARCHAR(255) NOT NULL,
		event_type VARCHAR(50) NOT NULL,
		timestamp TIMESTAMPTZ NOT NULL,
		device_info JSONB,
		data JSONB,
		verdict JSONB,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		INDEX idx_agent_id (agent_id),
		INDEX idx_event_type (event_type),
		INDEX idx_timestamp (timestamp)
	);

	CREATE TABLE IF NOT EXISTS verdicts (
		id SERIAL PRIMARY KEY,
		event_id UUID REFERENCES events(event_id),
		decision VARCHAR(20) NOT NULL,
		confidence FLOAT NOT NULL,
		reason TEXT,
		severity VARCHAR(20),
		analyzer VARCHAR(50),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS policies (
		id SERIAL PRIMARY KEY,
		policy_id VARCHAR(255) UNIQUE NOT NULL,
		version VARCHAR(50) NOT NULL,
		content JSONB NOT NULL,
		issued_at TIMESTAMPTZ NOT NULL,
		expires_at TIMESTAMPTZ NOT NULL,
		signature TEXT,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS agents (
		id SERIAL PRIMARY KEY,
		agent_id VARCHAR(255) UNIQUE NOT NULL,
		agent_version VARCHAR(50),
		device_info JSONB,
		last_heartbeat TIMESTAMPTZ,
		policy_id VARCHAR(255),
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);
	`

	_, err := db.Exec(schema)
	return err
}

type EventStore struct {
	db *Database
}

func NewEventStore(db *Database) *EventStore {
	return &EventStore{db: db}
}

func (s *EventStore) StoreEvent(agentID string, event interface{}) error {
	eventMap, ok := event.(map[string]interface{})
	if !ok {
		return nil
	}

	eventID, _ := eventMap["event_id"].(string)
	eventType, _ := eventMap["event_type"].(string)
	timestamp, _ := eventMap["timestamp"].(string)

	deviceInfo, _ := json.Marshal(eventMap["device"])
	data, _ := json.Marshal(eventMap["data"])
	verdict, _ := json.Marshal(eventMap["verdict"])

	query := `
		INSERT INTO events (event_id, agent_id, event_type, timestamp, device_info, data, verdict)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (event_id) DO NOTHING
	`

	_, err := s.db.db.Exec(query, eventID, agentID, eventType, timestamp, deviceInfo, data, verdict)
	return err
}

func (s *EventStore) UpdateVerdict(agentID string, event map[string]interface{}, verdict interface{}) error {
	eventID, _ := event["event_id"].(string)
	verdictData, _ := json.Marshal(verdict)

	query := `
		UPDATE events 
		SET verdict = $1
		WHERE event_id = $2
	`

	_, err := s.db.db.Exec(query, verdictData, eventID)
	return err
}

func (s *EventStore) UpdateAgentHeartbeat(agentID, agentVersion string, deviceInfo map[string]interface{}) error {
	deviceJSON, _ := json.Marshal(deviceInfo)

	query := `
		INSERT INTO agents (agent_id, agent_version, device_info, last_heartbeat)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (agent_id) DO UPDATE
		SET agent_version = $2, device_info = $3, last_heartbeat = $4, updated_at = NOW()
	`

	_, err := s.db.db.Exec(query, agentID, agentVersion, deviceJSON, time.Now())
	return err
}
