package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/labhacker007/Test-Code/cloud/internal/ingestion"
	"github.com/labhacker007/Test-Code/cloud/internal/analysis"
	"github.com/labhacker007/Test-Code/cloud/internal/storage"
	"github.com/labhacker007/Test-Code/cloud/internal/websocket"
	"github.com/labhacker007/Test-Code/cloud/pkg/ocsf"
)

const version = "0.1.0"

func main() {
	log.Printf("Runtime AI Security Cloud API v%s starting", version)

	// Initialize database
	db, err := storage.NewDatabase(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize components
	eventStore := storage.NewEventStore(db)
	analyzer := analysis.NewAnalyzer()
	ocsfExporter := ocsf.NewExporter()
	
	// Initialize WebSocket hub for real-time updates
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize ingestion handler
	ingestionHandler := ingestion.NewHandler(eventStore, analyzer, ocsfExporter)
	ingestionHandler.SetWebSocketHub(hub)

	// Setup HTTP server
	router := gin.Default()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "version": version})
	})

	// Agent event ingestion
	v1 := router.Group("/v1")
	{
		v1.POST("/events", ingestionHandler.HandleEvents)
		v1.GET("/policy/:agent_id", ingestionHandler.HandlePolicyRequest)
	}

	// SIEM integration endpoints
	integration := router.Group("/integration")
	{
		integration.GET("/ocsf/events", ingestionHandler.HandleOCSFExport)
		integration.POST("/webhook/xsiam", ingestionHandler.HandleXSIAMWebhook)
		integration.POST("/webhook/wiz", ingestionHandler.HandleWizWebhook)
	}
	
	// WebSocket endpoint for real-time updates
	router.GET("/ws", websocket.HandleWebSocket(hub))

	srv := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	// Start server
	go func() {
		log.Println("Server listening on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}
