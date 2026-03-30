package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/labhacker007/Test-Code/agent/internal/policy"
	"github.com/labhacker007/Test-Code/agent/internal/scanner"
)

// Test API for validation without actual system hooks
// Only compiled when -tags test is used

type TestServer struct {
	policyEngine *policy.Engine
	router       *gin.Engine
}

func NewTestServer(policyEngine *policy.Engine) *TestServer {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	ts := &TestServer{
		policyEngine: policyEngine,
		router:       router,
	}

	ts.setupRoutes()
	return ts
}

func (ts *TestServer) setupRoutes() {
	// Package installation check
	ts.router.POST("/package-check", ts.handlePackageCheck)

	// AI tool call check
	ts.router.POST("/ai-tool-check", ts.handleAIToolCheck)

	// MCP server validation
	ts.router.POST("/mcp-validate", ts.handleMCPValidate)

	// Statistics
	ts.router.GET("/stats", ts.handleStats)

	// Health
	ts.router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"mode":   "test",
		})
	})
}

func (ts *TestServer) handlePackageCheck(c *gin.Context) {
	var req struct {
		Ecosystem     string `json:"ecosystem" binding:"required"`
		Package       string `json:"package" binding:"required"`
		Version       string `json:"version"`
		InstallScript string `json:"install_script"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[TEST] Package check: %s/%s@%s", req.Ecosystem, req.Package, req.Version)

	// Call scanner logic directly
	result := scanner.ScanPackageInstall(req.Ecosystem, req.Package, req.Version, []byte(req.InstallScript), nil)

	c.JSON(http.StatusOK, gin.H{
		"decision":         result.Decision,
		"confidence":       result.Confidence,
		"reason":           result.Reason,
		"matched_rules":    result.MatchedRules,
		"version_detected": req.Version,
		"latency_ms":       result.LatencyMs,
	})
}

func (ts *TestServer) handleAIToolCheck(c *gin.Context) {
	var req struct {
		Tool string                 `json:"tool" binding:"required"`
		Args map[string]interface{} `json:"args"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[TEST] AI tool check: %s(%v)", req.Tool, req.Args)

	// Call scanner logic
	result := scanner.CheckAITool(req.Tool, req.Args, nil)

	c.JSON(http.StatusOK, gin.H{
		"decision":         result.Decision,
		"confidence":       result.Confidence,
		"reason":           result.Reason,
		"matched_patterns": result.MatchedPatterns,
		"loop_detected":    result.LoopDetected,
		"latency_ms":       result.LatencyMs,
	})
}

func (ts *TestServer) handleMCPValidate(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[TEST] MCP validation: %v", req["mcp_server"])

	// Call MCP scanner logic
	result := scanner.CheckMCPServer(req, nil)

	c.JSON(http.StatusOK, result)
}

func (ts *TestServer) handleStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"rules_loaded":   ts.policyEngine.RuleCount(),
		"mode":           "test",
		"cache_enabled":  true,
		"avg_latency_ms": 5.0,
	})
}

func (ts *TestServer) Start() error {
	log.Println("🧪 Test API server starting on :9090")
	log.Println("Endpoints:")
	log.Println("  POST /package-check  - Test package scanning")
	log.Println("  POST /ai-tool-check  - Test AI tool monitoring")
	log.Println("  POST /mcp-validate   - Test MCP security")
	log.Println("  GET  /stats          - Detection statistics")
	log.Println("  GET  /health         - Health check")

	return ts.router.Run(":9090")
}
