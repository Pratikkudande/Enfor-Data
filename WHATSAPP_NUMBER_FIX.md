# WhatsApp Number Fix - Complete Solution

## Problem Identified
All brokers were seeing the same hardcoded WhatsApp number `+919876543210` instead of their actual numbers from registration.

## Root Cause
The backend DTO (`PublicUser` in `backend/internal/dto/user_dto.go`) was **NOT including the `whatsapp_number` field** when returning user data to the frontend, even though:
- ✅ The database has the `whatsapp_number` column
- ✅ The User model includes the field
- ✅ The repository reads/writes it correctly
- ✅ The registration form sends it correctly
- ✅ The frontend expects it

## Changes Made

### 1. Backend - DTO Fix (`backend/internal/dto/user_dto.go`)
**Added missing fields to PublicUser struct:**
```go
type PublicUser struct {
    // ... existing fields ...
    WhatsappNumber    string    `json:"whatsapp_number"`      // ✅ ADDED
    AlternativeNumber *string   `json:"alternative_number,omitempty"` // ✅ ADDED
    ForeignNumber     *string   `json:"foreign_number,omitempty"`     // ✅ ADDED
    // ... rest of fields ...
}
```

**Updated ToPublicUser function to include these fields:**
```go
func ToPublicUser(u *models.User) PublicUser {
    return PublicUser{
        // ... existing mappings ...
        WhatsappNumber:    u.WhatsappNumber,      // ✅ ADDED
        AlternativeNumber: u.AlternativeNumber,   // ✅ ADDED
        ForeignNumber:     u.ForeignNumber,       // ✅ ADDED
        // ... rest of mappings ...
    }
}
```

### 2. Frontend - Remove Hardcoded Fallback (`frontend/src/pages/WhatsApp/WhatsAppView.tsx`)
**Before:**
```typescript
const phoneNumber = user?.whatsapp_number || user?.phone || '+919876543210'; // ❌ BAD
```

**After:**
```typescript
const phoneNumber = user?.whatsapp_number || user?.phone;

if (!phoneNumber) {
    alert('WhatsApp number not found in your profile. Please update your profile with your WhatsApp number.');
    return;
}
```

### 3. Backend Rebuilt
✅ Backend compiled successfully with the new changes

## What You Need to Do

### Step 1: Restart the Backend Server
```bash
cd backend
./api.exe
```

### Step 2: Clear Browser Cache & Logout
1. Open your browser's Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear localStorage (or just delete `enfor_user`, `enfor_token`, `enfor_refresh_token`)
4. Logout from the application

### Step 3: Login Again
- Login with your existing account
- The frontend will now fetch fresh user data from the backend
- Your actual WhatsApp number will be loaded from the database

### Step 4: Connect WhatsApp
- Go to WhatsApp Marketing page
- Click "Connect WhatsApp"
- It should now use YOUR actual WhatsApp number from registration

## Verification

### Check if API Returns WhatsApp Number
After logging in, check the browser console Network tab:
1. Find the `/api/auth/me` request
2. Check the response - it should now include:
```json
{
    "data": {
        "id": "...",
        "first_name": "...",
        "whatsapp_number": "+919876543210",  // ✅ Should be YOUR number
        "alternative_number": "...",
        "foreign_number": "...",
        // ... other fields
    }
}
```

### Check WhatsApp Account Endpoint
After connecting WhatsApp, check `/api/whatsapp/account`:
```json
{
    "account": {
        "phone_number": "+919876543210"  // ✅ Should be YOUR number, not hardcoded
    }
}
```

## For Existing Users with Wrong Numbers

If you already created accounts and they have the wrong number in the database, you have two options:

### Option 1: Create New Accounts (Recommended)
- Register new accounts with the correct WhatsApp numbers
- The fix ensures new registrations will work correctly

### Option 2: Update Database Directly
Run this SQL query in your Neon database console:
```sql
-- Check current numbers
SELECT id, first_name, last_name, email, whatsapp_number 
FROM users 
WHERE role = 'broker';

-- Update a specific user's number
UPDATE users 
SET whatsapp_number = '+91XXXXXXXXXX'  -- Replace with actual number
WHERE email = 'user@example.com';      -- Replace with user's email
```

## Testing Checklist

- [ ] Backend server restarted
- [ ] Browser cache cleared
- [ ] Logged out and logged back in
- [ ] `/api/auth/me` returns `whatsapp_number` field
- [ ] WhatsApp page shows correct number in connection banner
- [ ] Each broker sees their own unique number
- [ ] No more hardcoded `+919876543210` appearing

## Summary

The issue was a **missing field in the backend DTO**. The database had the correct data all along, but the API wasn't returning it to the frontend. Now:

1. ✅ Backend returns `whatsapp_number` in all auth responses
2. ✅ Frontend receives and stores the correct number
3. ✅ WhatsApp connection uses the user's actual number
4. ✅ No more hardcoded fallbacks

**Each broker will now see their own WhatsApp number!**
