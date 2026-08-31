-- Add new columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS buildup_area DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS carpet_area DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS measurement_unit VARCHAR(20) DEFAULT 'sq_ft' CHECK (measurement_unit IN ('sq_ft', 'sq_meter', 'acre', 'guntha')),
ADD COLUMN IF NOT EXISTS deposit DECIMAL(15,2);

-- Add comments for documentation
COMMENT ON COLUMN properties.buildup_area IS 'Built-up area of the property';
COMMENT ON COLUMN properties.carpet_area IS 'Carpet area of the property';
COMMENT ON COLUMN properties.measurement_unit IS 'Unit of measurement: sq_ft, sq_meter, acre, guntha';
COMMENT ON COLUMN properties.deposit IS 'Deposit amount (only for rent listing type)';
