ALTER TABLE properties
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS client_name VARCHAR(200);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'properties_client_id_fkey'
    ) THEN
        ALTER TABLE properties
        ADD CONSTRAINT properties_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_client
    ON properties(client_id)
    WHERE client_id IS NOT NULL AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION populate_property_client_info()
RETURNS TRIGGER AS $populate_property_client$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        SELECT first_name || ' ' || last_name
        INTO NEW.client_name
        FROM clients
        WHERE id = NEW.client_id;
    ELSE
        NEW.client_name = NULL;
    END IF;

    RETURN NEW;
END;
$populate_property_client$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS populate_property_client_info_on_write ON properties;
CREATE TRIGGER populate_property_client_info_on_write
    BEFORE INSERT OR UPDATE OF client_id ON properties
    FOR EACH ROW
    EXECUTE FUNCTION populate_property_client_info();

CREATE OR REPLACE FUNCTION sync_client_info_to_properties()
RETURNS TRIGGER AS $sync_property_client$
BEGIN
    UPDATE properties
    SET
        client_name = NEW.first_name || ' ' || NEW.last_name,
        updated_at = NOW()
    WHERE client_id = NEW.id;

    RETURN NEW;
END;
$sync_property_client$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_client_info_to_properties_trigger ON clients;
CREATE TRIGGER sync_client_info_to_properties_trigger
    AFTER UPDATE OF first_name, last_name ON clients
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_info_to_properties();
