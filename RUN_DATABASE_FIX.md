# How to Run the Database Fix

## Your Database Connection
- **Host**: 54.209.204.248
- **Database**: Enfor_Data
- **Type**: Neon PostgreSQL (Cloud)

## Option 1: Using Neon Console (Easiest)

1. Go to [Neon Console](https://console.neon.tech)
2. Log in to your account
3. Select your project
4. Click on "SQL Editor" in the left sidebar
5. Copy the contents of `backend/fix_dlt_template_categories.sql`
6. Paste into the SQL Editor
7. Click "Run" or press Ctrl+Enter
8. Verify success message

## Option 2: Using pgAdmin (If Installed)

1. Open pgAdmin
2. Create a new server connection:
   - Name: Enfor Data
   - Host: 54.209.204.248
   - Port: 5432
   - Database: Enfor_Data
   - Username: neondb_owner
   - Password: (from config.env)
   - SSL Mode: Require
3. Right-click on the database → Query Tool
4. Open file: `backend/fix_dlt_template_categories.sql`
5. Click Execute (F5)

## Option 3: Using psql Command Line

```bash
# Navigate to backend directory
cd backend

# Run the SQL script
psql "postgres://neondb_owner:npg_m5EJ1AlZDkse@54.209.204.248/Enfor_Data?sslmode=require" -f fix_dlt_template_categories.sql
```

## Option 4: Quick Manual Fix (Copy & Paste)

If you have access to any PostgreSQL client connected to your database, run this:

```sql
-- Update any NULL or empty categories to SERVICES
UPDATE sms_dlt_templates 
SET category = 'SERVICES' 
WHERE category IS NULL OR category = '';
```

## After Running the Fix

1. Restart your backend server:
```bash
cd backend
go run cmd/api/main.go
```

2. Test editing a DLT template in the admin panel
3. The error should be resolved!

## Verification

Run this query to check all templates have categories:
```sql
SELECT id, template_name, category 
FROM sms_dlt_templates 
LIMIT 10;
```

All templates should show a valid category (FOR_SALE, FOR_RENT, FOR_BUY, LIST_FOR_RENT, or SERVICES).
