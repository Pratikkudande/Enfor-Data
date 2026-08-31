-- Create client_requirements table
CREATE TABLE IF NOT EXISTS client_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('buy', 'rent')),
    
    -- Property specifications
    buildup_area INT,
    carpet_area INT,
    measurement_unit VARCHAR(20) CHECK (measurement_unit IN ('sq_foot', 'sq_meter', 'acre', 'guntha')),
    
    -- Budget
    min_budget DECIMAL(15, 2),
    max_budget DECIMAL(15, 2),
    deposit_budget DECIMAL(15, 2),
    
    -- Location
    preferred_location TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Enquiry type
    enquiry VARCHAR(50) CHECK (enquiry IN (
        'Single Room', 'PG', '1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', 
        '3 BHK', '3.5 BHK', '4 BHK', '5 BHK', '6 BHK', 'ROW House Bungalow', 
        'Shops', 'Office'
    )),
    
    -- Additional details
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_client_requirements_client_id ON client_requirements(client_id);
CREATE INDEX idx_client_requirements_type ON client_requirements(requirement_type);
CREATE INDEX idx_client_requirements_status ON client_requirements(status);
CREATE INDEX idx_client_requirements_created_at ON client_requirements(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_client_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_requirements_updated_at
    BEFORE UPDATE ON client_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_client_requirements_updated_at();
