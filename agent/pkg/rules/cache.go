package rules

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sync"
	"time"

	"github.com/labhacker007/Test-Code/agent/pkg/events"
)

type Cache struct {
	mu      sync.RWMutex
	entries map[string]*CacheEntry
	maxSize int
	ttl     time.Duration
}

type CacheEntry struct {
	Verdict   *events.Verdict
	ExpiresAt time.Time
}

func NewCache() *Cache {
	return &Cache{
		entries: make(map[string]*CacheEntry),
		maxSize: 10000,
		ttl:     1 * time.Hour,
	}
}

func (c *Cache) Get(event *events.Event) *events.Verdict {
	key := c.cacheKey(event)
	
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.entries[key]
	if !exists {
		return nil
	}

	if time.Now().After(entry.ExpiresAt) {
		return nil
	}

	return entry.Verdict
}

func (c *Cache) Set(event *events.Event, verdict *events.Verdict) {
	key := c.cacheKey(event)

	c.mu.Lock()
	defer c.mu.Unlock()

	// Simple eviction if over max size
	if len(c.entries) >= c.maxSize {
		c.evictOldest()
	}

	c.entries[key] = &CacheEntry{
		Verdict:   verdict,
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

func (c *Cache) cacheKey(event *events.Event) string {
	// Create deterministic key based on event type and relevant data
	data, _ := json.Marshal(event.Data)
	hash := sha256.Sum256(data)
	return event.EventType + ":" + hex.EncodeToString(hash[:])
}

func (c *Cache) evictOldest() {
	var oldestKey string
	var oldestTime time.Time

	for key, entry := range c.entries {
		if oldestKey == "" || entry.ExpiresAt.Before(oldestTime) {
			oldestKey = key
			oldestTime = entry.ExpiresAt
		}
	}

	if oldestKey != "" {
		delete(c.entries, oldestKey)
	}
}

func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries = make(map[string]*CacheEntry)
}

func (c *Cache) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return len(c.entries)
}
