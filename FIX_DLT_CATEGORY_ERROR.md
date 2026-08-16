# Fix for DLT Template Category Constraint Error

## Problem
Error: `Failed to update template: Failed to update DLT template: pq: new row for relation "sms_dlt_templates" violates check constraint "check_category"`

## Root Cause
The database has a CHECK constraint on the `category` column that only allows specific values:
- `FOR_SALE`
- `FOR_RENT`
- `FOR_BUY`
- `LIST_FOR_RENT`
- `SERVICES`

Older templates might not have a category value, causing the constraint violation when editing.

## Solution

### 1. Frontend Fix (Already Applied)
Updated `TeleMarketerManagement.tsx` to ensure a default category value:
- When editing a template, if category is missing, it defaults to `'SERVICES'`
- Added category dropdown field in the edit form

### 2. Database Fix (Run this SQL)

**Option A: Using psql command line**
```bash
cd backend
psql -h localhost -U postgres -d enfor_data_db -f fix_dlt_template_categories.sql
```

**Option B: Using pgAdmin or any PostgreSQL client**
Open the file `backend/fix_dlt_template_categories.sql` and execute it against your database.

**Option C: Manual execution**
```sql
-- Update any NULL or empty categories to SERVICES
UPDATE sms_dlt_templates 
SET category = 'SERVICES' 
WHERE category IS NULL OR category = '';

-- Add check constraint if it doesn't exist
ALTER TABLE sms_dlt_templates
ADD CONSTRAINT check_category CHECK (category IN ('FOR_SALE', 'FOR_RENT', 'FOR_BUY', 'LIST_FOR_RENT', 'SERVICES'));
```

### 3. Verify the Fix

After running the SQL script:

1. Check all templates have a category:
```sql
SELECT id, template_name, category 
FROM sms_dlt_templates 
WHERE category IS NULL OR category = '';
```
Should return 0 rows.

2. Check the constraint exists:
```sql
SELECT conname, contype, convalidated 
FROM pg_constraint 
WHERE conrelid = 'sms_dlt_templates'::regclass 
AND conname = 'check_category';
```
Should return 1 row with `check_category`.

3. Try editing a template in the UI - it should work now!

## Prevention
Going forward:
- All new templates require a category selection
- Default value is `SERVICES` if none specified
- Frontend validation ensures a category is always selected
- Database constraint prevents invalid category values

## Valid Category Values
When creating or editing templates, use only these category values:
- `FOR_SALE` - Properties for sale
- `FOR_RENT` - Properties for rent
- `FOR_BUY` - Buyer requirements
- `LIST_FOR_RENT` - Property listings for rent
- `SERVICES` - General services (default)
