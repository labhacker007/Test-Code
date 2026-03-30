package rules

import (
	"regexp"
	"strings"

	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

type Rule struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Severity    string      `json:"severity"`
	Enabled     bool        `json:"enabled"`
	Conditions  []Condition `json:"conditions"`
	Action      string      `json:"action"`
	Metadata    Metadata    `json:"metadata,omitempty"`
}

type Condition struct {
	Field           string      `json:"field"`
	Operator        string      `json:"operator"`
	Value           interface{} `json:"value"`
	CaseInsensitive bool        `json:"case_insensitive,omitempty"`
}

type Metadata struct {
	MitreAttack []string `json:"mitre_attack,omitempty"`
	References  []string `json:"references,omitempty"`
}

type Engine struct {
	rules   []Rule
	mode    string
	cache   *Cache
}

func NewEngine() *Engine {
	return &Engine{
		rules: []Rule{},
		cache: NewCache(),
	}
}

func (e *Engine) LoadRules(rules []Rule) {
	e.rules = rules
}

func (e *Engine) SetMode(mode string) {
	e.mode = mode
}

func (e *Engine) Evaluate(event *events.Event) *events.Verdict {
	// Check cache first
	if verdict := e.cache.Get(event); verdict != nil {
		return verdict
	}

	// Evaluate rules
	for _, rule := range e.rules {
		if !rule.Enabled {
			continue
		}

		if e.matchesRule(event, rule) {
			verdict := &events.Verdict{
				Decision:   rule.Action,
				Confidence: 0.95,
				Reason:     rule.Description,
				RuleID:     rule.ID,
			}
			e.cache.Set(event, verdict)
			return verdict
		}
	}

	// No rule matched
	return &events.Verdict{
		Decision:   "uncertain",
		Confidence: 0.0,
		Reason:     "No matching rule",
		RuleID:     "DEFAULT",
	}
}

func (e *Engine) matchesRule(event *events.Event, rule Rule) bool {
	for _, condition := range rule.Conditions {
		if !e.matchesCondition(event, condition) {
			return false
		}
	}
	return len(rule.Conditions) > 0
}

func (e *Engine) matchesCondition(event *events.Event, cond Condition) bool {
	value := extractField(event, cond.Field)
	if value == nil {
		return false
	}

	switch cond.Operator {
	case "equals":
		return compareEquals(value, cond.Value, cond.CaseInsensitive)
	case "contains":
		return compareContains(value, cond.Value, cond.CaseInsensitive)
	case "matches":
		return compareMatches(value, cond.Value)
	case "in":
		return compareIn(value, cond.Value)
	default:
		return false
	}
}

func extractField(event *events.Event, field string) interface{} {
	parts := strings.Split(field, ".")
	
	if len(parts) == 0 {
		return nil
	}

	// Simple field extraction for common cases
	switch parts[0] {
	case "event_type":
		return event.EventType
	case "data":
		if len(parts) < 2 {
			return event.Data
		}
		return extractDataField(event.Data, parts[1:])
	}

	return nil
}

func extractDataField(data interface{}, path []string) interface{} {
	if len(path) == 0 {
		return data
	}

	dataMap, ok := data.(map[string]interface{})
	if !ok {
		return nil
	}

	if len(path) == 1 {
		return dataMap[path[0]]
	}

	return extractDataField(dataMap[path[0]], path[1:])
}

func compareEquals(a, b interface{}, caseInsensitive bool) bool {
	aStr, aOk := a.(string)
	bStr, bOk := b.(string)

	if aOk && bOk {
		if caseInsensitive {
			return strings.EqualFold(aStr, bStr)
		}
		return aStr == bStr
	}

	return a == b
}

func compareContains(a, b interface{}, caseInsensitive bool) bool {
	aStr, aOk := a.(string)
	bStr, bOk := b.(string)

	if !aOk || !bOk {
		return false
	}

	if caseInsensitive {
		return strings.Contains(strings.ToLower(aStr), strings.ToLower(bStr))
	}
	return strings.Contains(aStr, bStr)
}

func compareMatches(a, b interface{}) bool {
	aStr, aOk := a.(string)
	pattern, bOk := b.(string)

	if !aOk || !bOk {
		return false
	}

	re, err := regexp.Compile(pattern)
	if err != nil {
		return false
	}

	return re.MatchString(aStr)
}

func compareIn(a, b interface{}) bool {
	aStr, aOk := a.(string)
	bSlice, bOk := b.([]interface{})

	if !aOk || !bOk {
		return false
	}

	for _, item := range bSlice {
		if itemStr, ok := item.(string); ok && itemStr == aStr {
			return true
		}
	}
	return false
}
