package handler

import (
	"net/http"
	"strconv"
	"time"

	"enfor-data-backend/internal/service"
	ws "enfor-data-backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // CORS handled by middleware
}

// NetworkHandler handles connection, messaging, and WebSocket endpoints.
type NetworkHandler struct {
	svc *service.NetworkService
	hub *ws.Hub
}

func NewNetworkHandler(svc *service.NetworkService, hub *ws.Hub) *NetworkHandler {
	return &NetworkHandler{svc: svc, hub: hub}
}

// ── Connection endpoints ──────────────────────────────────────────────────────

// POST /api/network/connect/send
func (h *NetworkHandler) SendRequest(c *gin.Context) {
	senderID := c.GetString("user_id")
	var body struct {
		ReceiverID string `json:"receiver_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "receiver_id required"})
		return
	}
	req, err := h.svc.SendConnectionRequest(senderID, body.ReceiverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	// Notify receiver in real-time if online
	h.hub.SendToUser(body.ReceiverID, ws.OutboundMsg{
		Type:      "connection_request",
		Payload:   req,
		Timestamp: time.Now(),
	})
	c.JSON(http.StatusCreated, SuccessResponse{Message: "Request sent", Data: req})
}

// POST /api/network/connect/respond
func (h *NetworkHandler) RespondRequest(c *gin.Context) {
	responderID := c.GetString("user_id")
	var body struct {
		RequestID string `json:"request_id" binding:"required"`
		Action    string `json:"action" binding:"required"` // accept | reject
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "request_id and action required"})
		return
	}
	if err := h.svc.RespondToRequest(body.RequestID, responderID, body.Action); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Request " + body.Action + "ed"})
}

// GET /api/network/connections
func (h *NetworkHandler) GetConnections(c *gin.Context) {
	userID := c.GetString("user_id")
	list, err := h.svc.GetConnections(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to get connections"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: list})
}

// GET /api/network/requests  (incoming pending)
func (h *NetworkHandler) GetPendingRequests(c *gin.Context) {
	userID := c.GetString("user_id")
	list, err := h.svc.GetPendingRequests(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to get requests"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: list})
}

// GET /api/network/requests/sent
func (h *NetworkHandler) GetSentRequests(c *gin.Context) {
	userID := c.GetString("user_id")
	list, err := h.svc.GetSentRequests(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to get sent requests"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: list})
}

// GET /api/network/brokers  (discover all brokers with connection status)
func (h *NetworkHandler) GetAllBrokers(c *gin.Context) {
	userID := c.GetString("user_id")
	list, err := h.svc.GetAllBrokers(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to get brokers"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: list})
}

// ── Messaging endpoints ───────────────────────────────────────────────────────

// GET /api/network/conversations
func (h *NetworkHandler) GetConversations(c *gin.Context) {
	userID := c.GetString("user_id")
	list, err := h.svc.GetConversations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to get conversations"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: list})
}

// GET /api/network/conversations/:id/messages?limit=50&offset=0
func (h *NetworkHandler) GetMessages(c *gin.Context) {
	userID := c.GetString("user_id")
	convID := c.Param("id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	msgs, err := h.svc.GetMessages(convID, userID, limit, offset)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "access denied" || err.Error() == "conversation not found" {
			status = http.StatusForbidden
		}
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}

	// Mark as read
	_ = h.svc.MarkRead(convID, userID)

	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: msgs})
}

// POST /api/network/conversations/:id/messages
func (h *NetworkHandler) SendMessage(c *gin.Context) {
	senderID := c.GetString("user_id")
	convID := c.Param("id")
	var body struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "body required"})
		return
	}
	msg, err := h.svc.SendMessage(convID, senderID, body.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	// Broadcast to all clients in this conversation room
	h.hub.BroadcastToConversation(convID, ws.OutboundMsg{
		Type:           "message",
		ConversationID: convID,
		Payload:        msg,
		Timestamp:      time.Now(),
	})
	c.JSON(http.StatusCreated, SuccessResponse{Message: "sent", Data: msg})
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

// GET /api/network/ws  (upgrade to WebSocket)
func (h *NetworkHandler) WebSocketHandler(c *gin.Context) {
	userID := c.GetString("user_id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := h.hub.NewClientForHub(conn, userID)

	go client.WritePump()
	client.ReadPump(func(_ *ws.Client, msg ws.InboundMsg) {
		switch msg.Type {
		case "join":
			// Client opens a conversation — subscribe to its room
			client.JoinRoom(msg.ConversationID)
			_ = h.svc.MarkRead(msg.ConversationID, userID)

		case "leave":
			client.LeaveRoom(msg.ConversationID)

		case "message":
			saved, err := h.svc.SendMessage(msg.ConversationID, userID, msg.Body)
			if err != nil {
				client.SendJSON(ws.OutboundMsg{Type: "error", Error: err.Error(), Timestamp: time.Now()})
				return
			}
			h.hub.BroadcastToConversation(msg.ConversationID, ws.OutboundMsg{
				Type:           "message",
				ConversationID: msg.ConversationID,
				Payload:        saved,
				Timestamp:      time.Now(),
			})

		case "typing":
			// Broadcast typing indicator to the other participant
			h.hub.BroadcastToConversation(msg.ConversationID, ws.OutboundMsg{
				Type:           "typing",
				ConversationID: msg.ConversationID,
				Payload:        map[string]string{"user_id": userID},
				Timestamp:      time.Now(),
			})

		case "read":
			_ = h.svc.MarkRead(msg.ConversationID, userID)
			h.hub.BroadcastToConversation(msg.ConversationID, ws.OutboundMsg{
				Type:           "read",
				ConversationID: msg.ConversationID,
				Payload:        map[string]string{"reader_id": userID},
				Timestamp:      time.Now(),
			})
		}
	})
}
