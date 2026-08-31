-- Optimize dashboard performance with additional indexes

-- Add composite index for appointment stats queries (broker_id + status + date)
CREATE INDEX IF NOT EXISTS idx_appointments_broker_status_date 
    ON appointments(broker_id, status, date);

-- Add index for properties deleted_at check (if not already partial)
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at 
    ON properties(deleted_at) WHERE deleted_at IS NULL;

-- Add index for clients broker_id lookups
CREATE INDEX IF NOT EXISTS idx_clients_broker_id 
    ON clients(broker_id);

-- Comments
COMMENT ON INDEX idx_appointments_broker_status_date IS 'Optimizes appointment stats queries on dashboard';
COMMENT ON INDEX idx_properties_deleted_at IS 'Speeds up soft-delete filtering for properties';
COMMENT ON INDEX idx_clients_broker_id IS 'Optimizes client count queries by broker';
