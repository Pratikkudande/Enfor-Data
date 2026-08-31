-- Create client_types table to support multiple types per client
CREATE TABLE IF NOT EXISTS client_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('buyer', 'seller', 'tenant', 'list_property_for_rent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, type)
);

-- Create index for faster lookups
CREATE INDEX idx_client_types_client_id ON client_types(client_id);
CREATE INDEX idx_client_types_type ON client_types(type);

-- Migrate existing data from clients.type to client_types
INSERT INTO client_types (client_id, type)
SELECT id, type FROM clients WHERE type IS NOT NULL AND type != '';

-- Note: Keep the 'type' column in clients table for backward compatibility
-- It will now represent the primary/latest type
-- The client_types table will hold the complete type history
