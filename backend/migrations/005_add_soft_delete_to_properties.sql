ALTER TABLE properties
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

DROP INDEX IF EXISTS idx_properties_broker_created;
CREATE INDEX IF NOT EXISTS idx_properties_broker_created
    ON properties(broker_id, created_at DESC)
    WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_properties_broker_status;
CREATE INDEX IF NOT EXISTS idx_properties_broker_status
    ON properties(broker_id, status)
    WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_properties_broker_type;
CREATE INDEX IF NOT EXISTS idx_properties_broker_type
    ON properties(broker_id, type)
    WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_properties_status_created;
CREATE INDEX IF NOT EXISTS idx_properties_status_created
    ON properties(status, created_at DESC)
    WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_properties_city_state;
CREATE INDEX IF NOT EXISTS idx_properties_city_state
    ON properties(city, state)
    WHERE deleted_at IS NULL;
