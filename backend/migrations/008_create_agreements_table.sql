-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    broker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Agreement period
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,

    -- Status: active | expired | terminated
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'terminated')),

    -- Denormalized for fast reads
    property_title   VARCHAR(255),
    property_address TEXT,
    broker_name      VARCHAR(200),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- end must be after start
    CONSTRAINT chk_agreement_dates CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agreements_broker_created
    ON agreements(broker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agreements_broker_status
    ON agreements(broker_id, status);

CREATE INDEX IF NOT EXISTS idx_agreements_property
    ON agreements(property_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agreements_updated_at ON agreements;
CREATE TRIGGER trg_agreements_updated_at
    BEFORE UPDATE ON agreements
    FOR EACH ROW EXECUTE FUNCTION update_agreements_updated_at();

-- Populate denormalized fields on insert
CREATE OR REPLACE FUNCTION populate_agreement_denormalized()
RETURNS TRIGGER AS $$
BEGIN
    SELECT p.title, p.address || ', ' || p.city
    INTO NEW.property_title, NEW.property_address
    FROM properties p
    WHERE p.id = NEW.property_id;

    SELECT u.first_name || ' ' || u.last_name
    INTO NEW.broker_name
    FROM users u
    WHERE u.id = NEW.broker_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agreements_populate ON agreements;
CREATE TRIGGER trg_agreements_populate
    BEFORE INSERT ON agreements
    FOR EACH ROW EXECUTE FUNCTION populate_agreement_denormalized();
