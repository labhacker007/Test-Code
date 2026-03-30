package ingestion

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/labhacker007/Test-Code/cloud/internal/analysis"
	"github.com/labhacker007/Test-Code/cloud/internal/storage"
	"github.com/labhacker007/Test-Code/cloud/pkg/ocsf"
)

type Handler struct {
	store        *storage.EventStore
	analyzer     *analysis.Analyzer
	ocsfExporter *ocsf.Exporter
}

func NewHandler(store *storage.EventStore, analyzer *analysis.Analyzer, exporter *ocsf.Exporter) *Handler {
	return &Handler{
		store:        store,
		analyzer:     analyzer,
		ocsfExporter: exporter,
	}
}

type EventBatchRequest struct {
	AgentID string        `json:"agent_id" binding:"required"`
	Events  []interface{} `json:"events" binding:"required"`
}

func (h *Handler) HandleEvents(c *gin.Context) {
	var req EventBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Received %d events from agent %s", len(req.Events), req.AgentID)

	// Store events
	for _, event := range req.Events {
		if err := h.store.StoreEvent(req.AgentID, event); err != nil {
			log.Printf("Error storing event: %v", err)
		}

		// Analyze if verdict is uncertain
		eventMap, ok := event.(map[string]interface{})
		if ok {
			if verdict, ok := eventMap["verdict"].(map[string]interface{}); ok {
				if decision, ok := verdict["decision"].(string); ok && decision == "uncertain" {
					// Queue for async analysis
					go h.analyzeEvent(req.AgentID, eventMap)
				}
			}
		}

		// Export to OCSF for SIEM
		go h.exportToSIEM(eventMap)
	}

	c.JSON(http.StatusAccepted, gin.H{
		"status":         "accepted",
		"events_received": len(req.Events),
	})
}

func (h *Handler) HandlePolicyRequest(c *gin.Context) {
	_ = c.Param("agent_id") // agentID for future agent-specific policies

	// TODO: Fetch agent-specific policy from database
	policy := h.getDefaultPolicy()

	c.JSON(http.StatusOK, policy)
}

func (h *Handler) HandleOCSFExport(c *gin.Context) {
	_ = c.Query("since") // since for filtering (TODO)
	_ = c.DefaultQuery("limit", "1000") // limit

	// TODO: Fetch events from database based on query params
	events := []interface{}{} // Placeholder

	ocsfEvents := []interface{}{}
	for _, event := range events {
		if ocsfEvent, err := h.ocsfExporter.Transform(event); err == nil {
			ocsfEvents = append(ocsfEvents, ocsfEvent)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"events": ocsfEvents,
		"count":  len(ocsfEvents),
	})
}

func (h *Handler) HandleXSIAMWebhook(c *gin.Context) {
	// Webhook receiver for XSIAM (if bidirectional needed)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) HandleWizWebhook(c *gin.Context) {
	// Webhook receiver for Wiz (if bidirectional needed)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) analyzeEvent(agentID string, event map[string]interface{}) {
	// TODO: Implement tiered analysis
	// 1. Enhanced rule matching
	// 2. Reputation lookup
	// 3. LLM/SLM semantic analysis
	verdict := h.analyzer.Analyze(event)

	// Update verdict in database
	if err := h.store.UpdateVerdict(agentID, event, verdict); err != nil {
		log.Printf("Error updating verdict: %v", err)
	}

	// If high severity, push to SIEM immediately
	if verdict.Severity == "critical" || verdict.Severity == "high" {
		h.pushToSIEM(event, verdict)
	}
}

func (h *Handler) exportToSIEM(event map[string]interface{}) {
	// Transform to OCSF
	ocsfEvent, err := h.ocsfExporter.Transform(event)
	if err != nil {
		log.Printf("Error transforming to OCSF: %v", err)
		return
	}

	// TODO: Push to configured SIEM endpoints
	// - XSIAM webhook
	// - Wiz webhook
	// - Generic webhook
	_ = ocsfEvent
}

func (h *Handler) pushToSIEM(event map[string]interface{}, verdict *analysis.Verdict) {
	// Immediate push for high-severity events
	log.Printf("Pushing high-severity event to SIEM: %s", verdict.Severity)
	// TODO: Implement immediate webhook push
}

func (h *Handler) getDefaultPolicy() map[string]interface{} {
	return map[string]interface{}{
		"version":    "1.0",
		"policy_id":  "default-policy",
		"issued_at":  time.Now().Format(time.RFC3339),
		"expires_at": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		"mode":       "permissive",
		"rules":      []interface{}{},
		"allowlist": map[string]interface{}{
			"packages": []interface{}{},
			"hashes":   []interface{}{},
			"domains":  []interface{}{},
		},
		"denylist": map[string]interface{}{
			"packages": []interface{}{},
			"hashes":   []interface{}{},
			"domains":  []interface{}{},
		},
	}
}
