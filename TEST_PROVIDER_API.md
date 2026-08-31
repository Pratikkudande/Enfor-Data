# Test Provider API Response

## Steps to Test

1. **Make sure backend is running with updated code:**
   ```bash
   cd backend
   ./api.exe
   ```

2. **Check the console output when starting:**
   Look for this line:
   ```
   SMS Service initialized with Fast2SMS provider
   ```
   
   If you see `MSG91 provider`, the backend hasn't picked up the config changes. Restart it.

3. **Test the API endpoint:**
   
   Open browser console on http://localhost:3000 and run:
   ```javascript
   fetch('http://localhost:8080/api/sms-marketing/account', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN_HERE'
     }
   })
   .then(r => r.json())
   .then(data => console.log('Provider Info:', data.provider))
   ```

   **Expected Response:**
   ```json
   {
     "connected": false,
     "account": null,
     "provider": {
       "provider": "Fast2SMS",
       "enabled": true
     }
   }
   ```

4. **If the response is wrong:**
   - Stop the backend (Ctrl+C)
   - Verify `config.env` has:
     ```
     SMS_PROVIDER=fast2sms
     FAST2SMS_ENABLED=true
     ```
   - Rebuild: `go build -o api.exe ./cmd/api`
   - Restart: `./api.exe`

5. **Frontend Test:**
   - Clear browser cache (Ctrl+Shift+R)
   - Navigate to http://localhost:3000/sms-marketing
   - The modal should now say "Fast2SMS SMS Service"

## Quick Switch Test

### To MSG91:
```env
SMS_PROVIDER=msg91
MSG91_ENABLED=true
FAST2SMS_ENABLED=false
```

### To Fast2SMS:
```env
SMS_PROVIDER=fast2sms
MSG91_ENABLED=false
FAST2SMS_ENABLED=true
```

**After changing config:**
1. Restart backend
2. Hard refresh frontend (Ctrl+Shift+R)
3. Check modal text matches provider

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal still shows MSG91 | Backend not restarted after config change |
| API returns MSG91 | Check config.env, rebuild backend |
| Modal shows before loading | Clear browser cache |
| Console error about provider | Check browser network tab for API response |
