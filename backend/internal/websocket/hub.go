// Package websocket implements a simple in-process pub/sub hub for real-time
// broker chat. Each connected client registers itself; messages are fanned out
// to all clients subscribed to the same conversation.
package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ── Wire types ────────────────────────────────────────────────────────────────

// InboundMsg is what the browser sends over the WebSocket.
type InboundMsg struct {
	Type           string `json:"type"` // "message" | "read" | "typing"
	ConversationID string `json:"conversation_id"`
	Body           string `json:"body,omitempty"`
}

// OutboundMsg is what the server pushes to browsers.
type OutboundMsg struct {
	Type           string      `json:"type"` // "message" | "read" | "typing" | "error"
	ConversationID string      `json:"conversation_id,omitempty"`
	Payload        interface{} `json:"payload,omitempty"`
	Error          string      `json:"error,omitempty"`
	Timestamp      time.Time   `json:"timestamp"`
}

// ── Client ────────────────────────────────────────────────────────────────────

// Client represents one WebSocket connection.
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	UserID string
	// set of conversation IDs this client is currently viewing
	rooms map[string]bool
	mu    sync.Mutex
}

func newClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
		rooms:  make(map[string]bool),
	}
}

func (c *Client) joinRoom(convID string) {
	c.mu.Lock()
	c.rooms[convID] = true
	c.mu.Unlock()
	c.hub.subscribe(convID, c)
}

func (c *Client) leaveRoom(convID string) {
	c.mu.Lock()
	delete(c.rooms, convID)
	c.mu.Unlock()
	c.hub.unsubscribe(convID, c)
}

// JoinRoom is the exported version for use by handlers.
func (c *Client) JoinRoom(convID string)  { c.joinRoom(convID) }
func (c *Client) LeaveRoom(convID string) { c.leaveRoom(convID) }
func (c *Client) SendJSON(v interface{})  { c.sendJSON(v) }

// ReadPump pumps messages from the WebSocket to the hub.
func (c *Client) ReadPump(onMessage func(c *Client, msg InboundMsg)) {
	defer func() {
		c.hub.unregister(c)
		c.conn.Close()
	}()
	c.conn.SetReadLimit(65536)
	c.conn.SetReadDeadline(time.Now().Add(90 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(90 * time.Second))
		return nil
	})

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error user=%s: %v", c.UserID, err)
			}
			break
		}
		var msg InboundMsg
		if err := json.Unmarshal(raw, &msg); err != nil {
			c.sendJSON(OutboundMsg{Type: "error", Error: "invalid json", Timestamp: time.Now()})
			continue
		}
		onMessage(c, msg)
	}
}

// WritePump pumps messages from the hub to the WebSocket.
func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) sendJSON(v interface{}) {
	b, _ := json.Marshal(v)
	select {
	case c.send <- b:
	default:
		log.Printf("ws send buffer full for user=%s, dropping", c.UserID)
	}
}

// ── Hub ───────────────────────────────────────────────────────────────────────

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool // userID → set of clients
	rooms   map[string]map[*Client]bool // convID → set of clients
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*Client]bool),
		rooms:   make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[c.UserID] == nil {
		h.clients[c.UserID] = make(map[*Client]bool)
	}
	h.clients[c.UserID][c] = true
}

func (h *Hub) unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set, ok := h.clients[c.UserID]; ok {
		delete(set, c)
		if len(set) == 0 {
			delete(h.clients, c.UserID)
		}
	}
	// remove from all rooms
	for convID, set := range h.rooms {
		delete(set, c)
		if len(set) == 0 {
			delete(h.rooms, convID)
		}
	}
	close(c.send)
}

func (h *Hub) subscribe(convID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[convID] == nil {
		h.rooms[convID] = make(map[*Client]bool)
	}
	h.rooms[convID][c] = true
}

func (h *Hub) unsubscribe(convID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set, ok := h.rooms[convID]; ok {
		delete(set, c)
	}
}

// BroadcastToConversation sends a message to all clients in a conversation room.
func (h *Hub) BroadcastToConversation(convID string, msg OutboundMsg) {
	b, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.rooms[convID] {
		select {
		case c.send <- b:
		default:
		}
	}
}

// BroadcastToConversationExcept sends to all room members except one user (e.g. exclude sender for typing events).
func (h *Hub) BroadcastToConversationExcept(convID string, msg OutboundMsg, excludeUserID string) {
	b, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.rooms[convID] {
		if c.UserID == excludeUserID {
			continue
		}
		select {
		case c.send <- b:
		default:
		}
	}
}

// SendToUser sends a message to all connections of a specific user.
func (h *Hub) SendToUser(userID string, msg OutboundMsg) {
	b, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients[userID] {
		select {
		case c.send <- b:
		default:
		}
	}
}

// IsOnline returns true if the user has at least one active WebSocket connection.
func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[userID]) > 0
}

// NewClientForHub creates and registers a new client.
func (h *Hub) NewClientForHub(conn *websocket.Conn, userID string) *Client {
	c := newClient(h, conn, userID)
	h.Register(c)
	return c
}
