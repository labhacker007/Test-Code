package ocsf

import (
	"fmt"
	"time"
)

// OCSF 1.8.0 event transformer
// Reference: https://schema.ocsf.io/

type Exporter struct {
	productName    string
	productVersion string
	vendorName     string
}

func NewExporter() *Exporter {
	return &Exporter{
		productName:    "Runtime AI Security Platform",
		productVersion: "0.1.0",
		vendorName:     "labhacker007",
	}
}

type OCSFEvent struct {
	ActivityID   int                    `json:"activity_id"`
	ActivityName string                 `json:"activity_name"`
	CategoryUID  int                    `json:"category_uid"`
	CategoryName string                 `json:"category_name"`
	ClassUID     int                    `json:"class_uid"`
	ClassName    string                 `json:"class_name"`
	SeverityID   int                    `json:"severity_id"`
	Severity     string                 `json:"severity"`
	Message      string                 `json:"message"`
	Metadata     OCSFMetadata           `json:"metadata"`
	Time         int64                  `json:"time"`
	TypeUID      int                    `json:"type_uid"`
	Observables  []OCSFObservable       `json:"observables,omitempty"`
	Actor        *OCSFActor             `json:"actor,omitempty"`
	Device       *OCSFDevice            `json:"device,omitempty"`
	RawData      map[string]interface{} `json:"raw_data,omitempty"`
}

type OCSFMetadata struct {
	Product          OCSFProduct `json:"product"`
	Version          string      `json:"version"`
	OriginalTime     string      `json:"original_time,omitempty"`
	ProcessedTime    string      `json:"processed_time"`
	CorrelationUID   string      `json:"correlation_uid,omitempty"`
}

type OCSFProduct struct {
	Name      string `json:"name"`
	Version   string `json:"version"`
	VendorName string `json:"vendor_name"`
}

type OCSFObservable struct {
	Name     string `json:"name"`
	TypeID   int    `json:"type_id"`
	Value    string `json:"value"`
}

type OCSFActor struct {
	User     *OCSFUser `json:"user,omitempty"`
	Process  *OCSFProcess `json:"process,omitempty"`
}

type OCSFUser struct {
	Name   string `json:"name"`
	UID    string `json:"uid,omitempty"`
}

type OCSFProcess struct {
	Name string `json:"name"`
	PID  int    `json:"pid,omitempty"`
}

type OCSFDevice struct {
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	Type      string `json:"type"`
	UID       string `json:"uid,omitempty"`
}

func (e *Exporter) Transform(event interface{}) (*OCSFEvent, error) {
	eventMap, ok := event.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid event format")
	}

	eventType, _ := eventMap["event_type"].(string)
	timestamp, _ := eventMap["timestamp"].(string)

	// Parse timestamp
	t, _ := time.Parse(time.RFC3339, timestamp)

	ocsfEvent := &OCSFEvent{
		CategoryUID:  6,
		CategoryName: "Application Activity",
		Metadata: OCSFMetadata{
			Product: OCSFProduct{
				Name:       e.productName,
				Version:    e.productVersion,
				VendorName: e.vendorName,
			},
			Version:       "1.8.0",
			OriginalTime:  timestamp,
			ProcessedTime: time.Now().Format(time.RFC3339),
		},
		Time:    t.Unix(),
		RawData: eventMap,
	}

	// Map event types to OCSF classes
	switch eventType {
	case "package_install":
		e.transformPackageInstall(ocsfEvent, eventMap)
	case "extension_install":
		e.transformExtensionInstall(ocsfEvent, eventMap)
	case "ai_tool_call":
		e.transformAIToolCall(ocsfEvent, eventMap)
	case "file_access":
		e.transformFileAccess(ocsfEvent, eventMap)
	default:
		ocsfEvent.ClassUID = 6001
		ocsfEvent.ClassName = "Application Activity"
		ocsfEvent.Message = fmt.Sprintf("Unknown event type: %s", eventType)
	}

	// Extract device info
	if device, ok := eventMap["device"].(map[string]interface{}); ok {
		ocsfEvent.Device = &OCSFDevice{
			Hostname: extractString(device, "hostname"),
			OS:       extractString(device, "os"),
			Type:     "laptop",
		}
	}

	// Map verdict to severity
	if verdict, ok := eventMap["verdict"].(map[string]interface{}); ok {
		decision, _ := verdict["decision"].(string)
		if decision == "deny" {
			ocsfEvent.SeverityID = 4
			ocsfEvent.Severity = "High"
		} else if decision == "uncertain" {
			ocsfEvent.SeverityID = 3
			ocsfEvent.Severity = "Medium"
		} else {
			ocsfEvent.SeverityID = 1
			ocsfEvent.Severity = "Informational"
		}
	}

	return ocsfEvent, nil
}

func (e *Exporter) transformPackageInstall(ocsf *OCSFEvent, event map[string]interface{}) {
	ocsf.ClassUID = 6003
	ocsf.ClassName = "API Activity"
	ocsf.ActivityID = 1
	ocsf.ActivityName = "Create"

	data, _ := event["data"].(map[string]interface{})
	ecosystem := extractString(data, "ecosystem")
	packageName := extractString(data, "package_name")
	version := extractString(data, "version")

	ocsf.Message = fmt.Sprintf("Package install: %s/%s@%s", ecosystem, packageName, version)

	// Add observables
	if hash, ok := data["hash"].(map[string]interface{}); ok {
		ocsf.Observables = append(ocsf.Observables, OCSFObservable{
			Name:   "Package Hash",
			TypeID: 13, // Hash
			Value:  extractString(hash, "value"),
		})
	}
}

func (e *Exporter) transformExtensionInstall(ocsf *OCSFEvent, event map[string]interface{}) {
	ocsf.ClassUID = 6001
	ocsf.ClassName = "Application Activity"
	ocsf.ActivityID = 1
	ocsf.ActivityName = "Install"

	data, _ := event["data"].(map[string]interface{})
	ide := extractString(data, "ide")
	extensionID := extractString(data, "extension_id")
	version := extractString(data, "version")

	ocsf.Message = fmt.Sprintf("Extension install: %s/%s@%s", ide, extensionID, version)
}

func (e *Exporter) transformAIToolCall(ocsf *OCSFEvent, event map[string]interface{}) {
	ocsf.ClassUID = 6003
	ocsf.ClassName = "API Activity"
	ocsf.ActivityID = 2
	ocsf.ActivityName = "Execute"

	data, _ := event["data"].(map[string]interface{})
	client := extractString(data, "client")
	toolName := extractString(data, "tool_name")

	ocsf.Message = fmt.Sprintf("AI tool call: %s/%s", client, toolName)
}

func (e *Exporter) transformFileAccess(ocsf *OCSFEvent, event map[string]interface{}) {
	ocsf.ClassUID = 4001
	ocsf.ClassName = "File System Activity"

	data, _ := event["data"].(map[string]interface{})
	path := extractString(data, "path")
	operation := extractString(data, "operation")

	ocsf.Message = fmt.Sprintf("File %s: %s", operation, path)

	ocsf.Observables = append(ocsf.Observables, OCSFObservable{
		Name:   "File Path",
		TypeID: 7, // File
		Value:  path,
	})
}

func extractString(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}
