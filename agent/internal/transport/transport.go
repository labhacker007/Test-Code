package transport

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

type Transport struct {
	endpoint     string
	agentID      string
	agentVersion string
	client       *http.Client
	queue        chan *events.Event
	batchSize    int
	batchTimeout time.Duration
	mu           sync.Mutex
	shutdown     chan struct{}
}

func NewTransport(endpoint, agentID, agentVersion string) *Transport {
	return &Transport{
		endpoint:     endpoint,
		agentID:      agentID,
		agentVersion: agentVersion,
		client: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					MinVersion: tls.VersionTLS13,
				},
			},
		},
		queue:        make(chan *events.Event, 1000),
		batchSize:    50,
		batchTimeout: 5 * time.Second,
		shutdown:     make(chan struct{}),
	}
}

func (t *Transport) Send(event *events.Event) {
	select {
	case t.queue <- event:
	default:
		log.Println("Warning: Event queue full, dropping event")
	}
}

func (t *Transport) Start(ctx context.Context) {
	ticker := time.NewTicker(t.batchTimeout)
	defer ticker.Stop()

	batch := make([]*events.Event, 0, t.batchSize)

	for {
		select {
		case <-ctx.Done():
			// Flush remaining events
			if len(batch) > 0 {
				t.sendBatch(batch)
			}
			return

		case <-t.shutdown:
			return

		case event := <-t.queue:
			batch = append(batch, event)
			if len(batch) >= t.batchSize {
				t.sendBatch(batch)
				batch = make([]*events.Event, 0, t.batchSize)
			}

		case <-ticker.C:
			if len(batch) > 0 {
				t.sendBatch(batch)
				batch = make([]*events.Event, 0, t.batchSize)
			}
		}
	}
}

func (t *Transport) sendBatch(batch []*events.Event) {
	payload := map[string]interface{}{
		"agent_id": t.agentID,
		"events":   batch,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling batch: %v", err)
		return
	}

	req, err := http.NewRequest("POST", t.endpoint+"/v1/events", bytes.NewBuffer(data))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", fmt.Sprintf("runtime-ai-security-agent/%s", t.agentVersion))
	// TODO: Add authentication header (bearer token or mTLS cert)

	resp, err := t.client.Do(req)
	if err != nil {
		log.Printf("Error sending batch: %v", err)
		// TODO: Implement retry with exponential backoff
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		log.Printf("Cloud API returned status %d", resp.StatusCode)
		return
	}

	log.Printf("Sent batch of %d events to cloud", len(batch))
}

func (t *Transport) Shutdown(ctx context.Context) error {
	close(t.shutdown)

	// Wait for context timeout
	<-ctx.Done()
	return nil
}
