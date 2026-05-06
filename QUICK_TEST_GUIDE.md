# Quick Test Guide - WhatsApp Setup Wizard

## Start Testing in 3 Steps

### 1. Start Backend
```bash
cd backend
./api.exe
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test the Wizard
1. Open http://localhost:3000
2. Login with your account
3. Click "WhatsApp Marketing" in sidebar
4. **Setup Wizard appears automatically!**

## Complete the Setup

### Step 1: Business Setup
- Enter your WhatsApp number (e.g., +919876543210)
- Enter business name
- Select category
- Click "Continue to Verification"

### Step 2: Phone Verification
- **Look for the yellow box** - it shows your verification code!
- Example: "Your verification code is **123456**"
- Enter the 6 digits in the boxes
- Code auto-submits when complete

### Step 3: Meta API Connection
- Click "Show help" to see instructions
- Enter your Meta credentials:
  - Access Token (from Meta Developer Console)
  - Phone Number ID
  - Business Account ID
  - WABA ID
- Click "Connect WhatsApp API"

### Step 4: Complete!
- See success message
- Click "Start Sending Messages"
- **WhatsApp module is now unlocked!**

## Don't Have Meta Credentials Yet?

### Quick Test Mode
You can test Steps 1 & 2 without Meta credentials:
1. Complete Business Setup
2. Complete Phone Verification
3. Stop at Step 3 (you'll need real credentials here)

### Get Meta Credentials
1. Go to https://developers.facebook.com
2. Create app → Business type
3. Add WhatsApp product
4. Get credentials from API Setup page

See `META_WHATSAPP_SETUP_GUIDE.md` for detailed instructions.

## What You'll See

### Before Setup
```
┌─────────────────────────────────────┐
│ WhatsApp Business Setup             │
│ [Progress Bar: Step 1 of 4]         │
│                                     │
│ Business Information                │
│ [Setup Form]                        │
└─────────────────────────────────────┘
```

### After Setup
```
┌─────────────────────────────────────┐
│ WhatsApp Marketing                  │
│ ✓ WhatsApp Connected                │
│ +919876543210 • 0/1000 messages     │
│                                     │
│ [Dashboard] [Send] [Templates]      │
└─────────────────────────────────────┘
```

## Troubleshooting

### "Failed to initialize business setup"
→ Check backend is running on port 8080

### "Invalid verification code"
→ Look for the yellow box showing the code
→ Code expires in 10 minutes - request new one

### "Failed to connect Meta WhatsApp API"
→ Verify your credentials are correct
→ Check access token has `whatsapp_business_messaging` permission

### Wizard doesn't show
→ You might already be connected
→ Check if you see "WhatsApp Connected" banner

## Reset and Test Again

To test the wizard again:

### Option 1: Use Different Account
- Logout and create new account
- Each account has separate setup

### Option 2: Reset Database (Development)
```sql
-- In your database console
DELETE FROM whatsapp_accounts WHERE user_id = 'YOUR_USER_ID';
```

Then refresh the page - wizard will appear again!

## Expected Behavior

✅ Wizard shows automatically when not connected  
✅ Can't access WhatsApp module until setup complete  
✅ Progress bar shows current step  
✅ Verification code displayed in development mode  
✅ After setup, full module unlocked  
✅ Connection status shown in banner  

## Next Steps After Testing

1. Get real Meta WhatsApp credentials
2. Complete full setup with real credentials
3. Send test message to a client
4. Check backend console for message logs
5. Verify client receives WhatsApp message

---

**Ready to test? Start the backend and frontend, then click "WhatsApp Marketing"!**
