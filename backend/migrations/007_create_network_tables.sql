-- ============================================================
-- BROKER NETWORK: Connections + Conversations + Messages
-- ============================================================

-- Connection requests between brokers
CREATE TABLE IF NOT EXISTS connection_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One pending/accepted request per pair (either direction)
    CONSTRAINT uq_connection_request UNIQUE (sender_id, receiver_id),
    -- Cannot connect with yourself
    CONSTRAINT chk_no_self_connect CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_req_receiver_status ON connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_conn_req_sender_status   ON connection_requests(sender_id, status);

DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;
CREATE TRIGGER update_connection_requests_updated_at
    BEFORE UPDATE ON connection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Accepted connections (materialised for fast lookup) ──────────────────────
CREATE TABLE IF NOT EXISTS connections (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_a   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_b   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Always store lower UUID first so (a,b) == (b,a)
    CONSTRAINT uq_connection UNIQUE (broker_a, broker_b),
    CONSTRAINT chk_connection_order CHECK (broker_a < broker_b)
);

CREATE INDEX IF NOT EXISTS idx_connections_broker_a ON connections(broker_a);
CREATE INDEX IF NOT EXISTS idx_connections_broker_b ON connections(broker_b);

-- ── One conversation per connected pair ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_a   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_b   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT uq_conversation UNIQUE (broker_a, broker_b),
    CONSTRAINT chk_conversation_order CHECK (broker_a < broker_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_broker_a      ON conversations(broker_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_b      ON conversations(broker_b, last_message_at DESC);

-- ── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pagination: latest messages first per conversation
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at DESC);
-- Unread count per conversation
CREATE INDEX IF NOT EXISTS idx_messages_conv_unread  ON messages(conversation_id, is_read) WHERE is_read = FALSE;
