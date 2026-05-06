-- SQL Script to Verify WhatsApp Numbers in Database
-- Run this in your Neon PostgreSQL console

-- 1. Check all users and their WhatsApp numbers
SELECT 
    id,
    first_name,
    last_name,
    email,
    whatsapp_number,
    role,
    city,
    created_at
FROM users
WHERE role IN ('broker', 'channel_partner')
ORDER BY created_at DESC;

-- 2. Check if any users have the hardcoded number
SELECT 
    COUNT(*) as count_with_hardcoded_number,
    whatsapp_number
FROM users
WHERE whatsapp_number = '+919876543210'
GROUP BY whatsapp_number;

-- 3. Check WhatsApp accounts and their associated phone numbers
SELECT 
    wa.id as account_id,
    wa.user_id,
    u.first_name,
    u.last_name,
    u.whatsapp_number as user_whatsapp,
    wa.phone_number as account_phone,
    wa.status,
    wa.created_at
FROM whatsapp_accounts wa
JOIN users u ON wa.user_id = u.id
ORDER BY wa.created_at DESC;

-- 4. Find users with duplicate WhatsApp numbers (should be none)
SELECT 
    whatsapp_number,
    COUNT(*) as user_count,
    STRING_AGG(email, ', ') as emails
FROM users
WHERE whatsapp_number IS NOT NULL
GROUP BY whatsapp_number
HAVING COUNT(*) > 1;

-- 5. Update a specific user's WhatsApp number (EXAMPLE - modify as needed)
-- Uncomment and modify the line below to update a user's number
-- UPDATE users SET whatsapp_number = '+91XXXXXXXXXX' WHERE email = 'user@example.com';
