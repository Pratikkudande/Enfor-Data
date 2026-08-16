# Deployment Steps for SMS Provider Changes

## Issue
The backend is correctly initializing with Fast2SMS, but the frontend is still showing MSG91. This is because the frontend code changes haven't been rebuilt/redeployed.

## Solution

### Step 1: Rebuild the Frontend

```bash
cd frontend
npm run build
# or if using development server:
npm run dev
```

### Step 2: Clear Browser Cache

After rebuilding, clear your browser cache:
- **Chrome/Edge**: Press `Ctrl + Shift + Delete` → Clear "Cached images and files"
- **Or** Do a hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 3: Restart Backend (if not already running)

```bash
cd backend
go run cmd/api/main.go
```

You should see this message on startup:
```
✅ SMS Service initialized with Fast2SMS provider on startup
```

### Step 4: Verify in Browser

1. Navigate to `localhost:3000/sms-marketing` (or your frontend URL)
2. You should now see:
   - **Header**: "Send SMS campaigns to your clients using **Fast2SMS**"
   - **Provider Box**: Shows "Fast2SMS" with Sender ID "202603"
   - **Connected Status**: Green dot with "Connected"
   - **No yellow banner** saying "account not connected"

## What Changed

### Backend Changes:
1. ✅ SMS provider initializes automatically on startup based on `SMS_PROVIDER` config
2. ✅ Backend logs clearly show which provider is initialized
3. ✅ API returns correct provider info with `initialized: true`
4. ✅ Users are auto-connected when they first access SMS Marketing page

### Frontend Changes:
1. ✅ Displays provider name (Fast2SMS/MSG91) in header
2. ✅ Shows provider info box with Sender ID and connection status
3. ✅ No automatic popup on page load
4. ✅ Setup modal only opens when clicking "Settings" button
5. ✅ All SMS features available when provider is initialized

## Troubleshooting

### If you still see MSG91:

1. **Check backend is running the latest code:**
   ```bash
   cd backend
   go run cmd/api/main.go
   ```
   Look for: `✅ SMS Service initialized with Fast2SMS provider on startup`

2. **Check frontend is rebuilt:**
   ```bash
   cd frontend
   npm run build
   # or
   npm run dev
   ```

3. **Clear browser cache completely:**
   - Close all browser windows
   - Open new browser window
   - Press `Ctrl + Shift + Delete`
   - Select "All time" and check "Cached images and files"
   - Click "Clear data"

4. **Check API response in Network tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Navigate to SMS Marketing page
   - Look for request to `/api/sms-marketing/account`
   - Verify response shows `"provider": "Fast2SMS"` and `"initialized": true`

### If API shows correct data but UI still wrong:

This means frontend code is cached. Try:
1. Open in Incognito/Private window
2. Or disable cache in DevTools (F12 → Network tab → "Disable cache" checkbox)
3. Refresh page

## Configuration

To switch SMS providers, edit `backend/config.env`:

```env
# Choose SMS provider: "msg91" or "fast2sms"
SMS_PROVIDER=fast2sms

# Fast2SMS Configuration
FAST2SMS_ENABLED=true
FAST2SMS_AUTH_KEY=your_auth_key
FAST2SMS_SENDER_ID=202603
FAST2SMS_ROUTE=dlt
FAST2SMS_TEMPLATE_ID=222856

# MSG91 SMS Configuration  
MSG91_ENABLED=false
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=202603
MSG91_ROUTE=4
MSG91_TEMPLATE_ID=your_template_id
```

Then restart the backend.
