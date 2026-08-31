# Fix SMS Provider Display Issue

## Current Problem
- Backend correctly initializes Fast2SMS on startup ✅
- API returns correct data (provider: "Fast2SMS", initialized: true) ✅  
- BUT UI still shows "MSG91" and "account not connected" ❌

## Root Cause
The frontend JavaScript is cached in your browser or the Vite dev server needs to be restarted with the new code.

## Solution Steps

### Step 1: Stop All Running Processes

**Option A - Kill all Node.js processes:**
```bash
# In PowerShell or CMD, run:
taskkill /F /IM node.exe /T
```

**Option B - Close terminal windows manually:**
- Close the terminal/command window running `npm run dev`
- Close the terminal/command window running `go run cmd/api/main.go`

### Step 2: Use the Restart Script (Easiest)

Double-click `restart-dev.bat` in the project root.

This will:
1. Kill existing Node.js processes
2. Start backend in a new window
3. Wait 5 seconds
4. Start frontend in a new window

### Step 3: Verify Services Started

**Backend Window should show:**
```
✅ SMS Service initialized with Fast2SMS provider on startup
[GIN-debug] Listening and serving HTTP on :8080
```

**Frontend Window should show:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 4: Clear Browser Cache

**Critical Step!**

1. Open your browser
2. Press `F12` to open DevTools
3. Right-click the refresh button
4. Select "Empty Cache and Hard Reload"

**OR**

1. Press `Ctrl + Shift + Delete`
2. Select "All time"
3. Check only "Cached images and files"  
4. Click "Clear data"

### Step 5: Open Application

1. Navigate to `http://localhost:5173/` (or the URL shown in frontend window)
2. Login if needed
3. Go to SMS Marketing page

### Step 6: Verify the Fix

You should now see a **purple debug banner** at the very top showing:
```
🔍 DEBUG: Provider=Fast2SMS | Initialized=true | Connected=true | Version=2.0
```

If you see `Provider=MSG91` in the debug banner, the JavaScript is still cached!

**The page should show:**
- Header: "Send SMS campaigns to your clients using **Fast2SMS**"
- Provider box: "SMS Provider: **Fast2SMS**" with "Sender ID: 202603"
- Green dot saying "Connected"
- NO yellow warning banner

### Step 7: Check Browser Console

Press `F12` and go to Console tab. You should see:
```
🚀 SMS Marketing View Loaded - Version 2.0 (Fast2SMS Support)
🔍 SMS Account API Response: {connected: true, account: {...}, provider: {...}}
🔍 Provider Info: {provider: "Fast2SMS", enabled: true, initialized: true, ...}
✅ Setting provider info to: {provider: "Fast2SMS", ...}
✅ Provider Name: Fast2SMS
📊 Provider Info State Changed: {provider: "Fast2SMS", ...}
📊 Provider Name: Fast2SMS
📊 Is Connected: true
📊 Is Initialized: true
```

If you see `Provider Name: MSG91` in console, the frontend code is NOT reloaded!

## Troubleshooting

### Issue: Backend not starting
**Check:** Is port 8080 already in use?
```bash
netstat -ano | findstr :8080
```
If something is using it, kill that process or change the port in config.env

### Issue: Frontend not starting  
**Check:** Is port 5173 already in use?
```bash
netstat -ano | findstr :5173
```
If something is using it, kill that process.

### Issue: Still showing MSG91 after all steps

**Nuclear Option - Complete Clean Restart:**

1. **Kill all Node processes:**
   ```bash
   taskkill /F /IM node.exe /T
   taskkill /F /IM go.exe /T
   ```

2. **Clear node_modules and reinstall:**
   ```bash
   cd frontend
   rmdir /S /Q node_modules
   npm install
   ```

3. **Clear Vite cache:**
   ```bash
   cd frontend
   rmdir /S /Q node_modules\.vite
   ```

4. **Restart services:**
   - Backend: `cd backend && go run cmd/api/main.go`
   - Frontend: `cd frontend && npm run dev`

5. **Open in Incognito/Private browsing mode** (this bypasses ALL cache)

### Issue: Debug banner shows correct provider but UI doesn't

This means the state is updating but the UI components aren't re-rendering. Check:
- Look for any error messages in browser console (F12)
- Check Network tab - is the API call succeeding?
- Try clicking the "Reload" button in the debug banner

## After Verification

Once everything works, you can remove the debug banner by setting `NODE_ENV=production` or by removing the debug code from `SMSMarketingView.tsx`.

## Quick Verification Script

Run `verify-setup.bat` to check:
- Current SMS_PROVIDER setting in config.env
- If backend is running on port 8080
- If frontend is running on port 5173 or 3000

## Need More Help?

Check the logs:
1. **Backend logs**: Look in the terminal window running `go run cmd/api/main.go`
2. **Frontend logs**: Look in the terminal window running `npm run dev`
3. **Browser logs**: Press F12 and check Console tab
4. **Network logs**: Press F12, go to Network tab, refresh page, look for `/api/sms-marketing/account` request

The response of `/api/sms-marketing/account` should show:
```json
{
  "connected": true,
  "account": { ... },
  "provider": {
    "provider": "Fast2SMS",
    "enabled": true,
    "initialized": true,
    "sender_id": "202603",
    "auth_key_set": true
  }
}
```
