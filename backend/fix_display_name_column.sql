-- Fix display_name column if missing
DO $$
BEGIN
    -- Check if display_name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN display_name VARCHAR(100) NOT NULL DEFAULT '';
        
        -- Update existing records with display names
        UPDATE subscription_plans SET display_name = 
            CASE 
                WHEN name = 'free_trial' THEN 'Free Trial'
                WHEN name = 'starter' THEN 'Starter Plan'
                WHEN name = 'professional' THEN 'Professional Plan'
                WHEN name = 'enterprise' THEN 'Enterprise Plan'
                ELSE INITCAP(REPLACE(name, '_', ' '))
            END;
    END IF;
END $$;