-- Fix NULL max_team_members values in subscription_plans table
-- This ensures compatibility with the updated Go struct

-- Update any NULL max_team_members to a default value of 1
-- This is safe because the column has DEFAULT 1 for new records
UPDATE subscription_plans 
SET max_team_members = 1 
WHERE max_team_members IS NULL;

-- Verify the update
SELECT name, display_name, max_team_members 
FROM subscription_plans 
ORDER BY sort_order;