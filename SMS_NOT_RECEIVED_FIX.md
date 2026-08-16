# SMS Not Being Received - Troubleshooting Guide

## Current Situation

✅ **Backend**: Fast2SMS provider initialized correctly  
✅ **API**: Returns "Status: SUCCESS ✓"  
✅ **Fast2SMS Response**: "SMS sent successfully"  
❌ **Phone**: SMS not received on mobile

## Root Cause

You're using `FAST2SMS_ROUTE=dlt` which requires:
1. A registered DLT template with TRAI (Telecom Regulatory Authority of India)
2. The message content must match the template exactly
3. Template variables must be properly formatted

The SMS shows as "SUCCESS" from Fast2SMS API, but telecom operators block delivery if:
- Template doesn't match
- Sender ID not approved
- Template not registered with operator

## Solutions

### Solution 1: Use Non-DLT Route for Testing (Quick Fix) ⚡

**Best for immediate testing and development**

Edit `backend/config.env`:

```env
# Change this line:
FAST2SMS_ROUTE=dlt

# To this:
FAST2SMS_ROUTE=q
```

**Note**: Route "q" (Quality) works for testing but has limitations:
- Limited daily quota (usually 100 SMS/day on free plan)
- Not suitable for production
- No DLT compliance

**Steps:**
1. Edit `backend/config.env`
2. Change `FAST2SMS_ROUTE=dlt` to `FAST2SMS_ROUTE=q`
3. Restart backend: `go run cmd/api/main.go`
4. Try sending SMS again

### Solution 2: Fix DLT Template Configuration (Production Ready) 🏭

**Required for production use in India**

#### Step 1: Get Your Approved DLT Template

Login to Fast2SMS dashboard:
1. Go to https://www.fast2sms.com/dashboard
2. Navigate to **DLT** section
3. Check if template ID `222856` exists and is approved
4. Note the **exact template format** with placeholders

Example DLT template format:
```
Your property inquiry: {#var#} at {#var#}. Price: {#var#}. Contact: {#var#} - {#var#}
```

#### Step 2: Update Backend to Use Template Variables

The issue is in `backend/internal/provider/fast2sms_provider.go` - the `extractVariables` function needs to be implemented.

**Current (Broken):**
```go
func (p *Fast2SMSProvider) extractVariables(message string) string {
    return "|||" // Default empty variables - THIS IS THE PROBLEM!
}
```

**What Needs to Be Done:**
You need to parse your message and extract variables according to your DLT template format.

For example, if your template is:
```
Property for Sale: {#var#} at {#var#}. Price: {#var#}. Contact: {#var#} - {#var#}
```

The message:
```
Property for Sale: 1 BHK Apartment at Hinjewadi, Pune. Price: ₹45 Lakh. Contact: Ganesh Hajare - 9881153008
```

Should extract variables as:
```
1 BHK Apartment|Hinjewadi, Pune|₹45 Lakh|Ganesh Hajare|9881153008
```

#### Step 3: Verify Sender ID is Approved

1. Check Fast2SMS dashboard
2. Verify Sender ID `202603` is approved for DLT messaging
3. Check if it's linked to your template ID `222856`

### Solution 3: Switch to MSG91 (Alternative) 🔄

MSG91 might have better DLT template support or easier configuration.

Edit `backend/config.env`:

```env
# Change provider
SMS_PROVIDER=msg91

# Enable MSG91
MSG91_ENABLED=true
MSG91_AUTH_KEY=559551A8dqEjdO26a7b0f9cP1
MSG91_SENDER_ID=202603
MSG91_ROUTE=4
MSG91_TEMPLATE_ID=1277178600920660252

# Disable Fast2SMS
FAST2SMS_ENABLED=false
```

Then restart backend.

## Recommended Approach

### For Testing/Development: ✅
Use **Solution 1** (Non-DLT route):
```env
FAST2SMS_ROUTE=q  # or "p" for promotional
```

### For Production: ✅
Use **Solution 2** (Proper DLT configuration):
1. Get exact DLT template from Fast2SMS dashboard
2. Implement proper variable extraction
3. Test thoroughly

## Database Fix (Bonus)

The migration has been updated to add the missing `message_type` column. Restart the backend to apply:

```bash
cd backend
go run cmd/api/main.go
```

The migrations will run automatically on startup and fix the table schema.

## Verification Steps

After applying a solution:

1. **Send a test SMS**
2. **Check backend logs** - Should show:
   ```
   === Fast2SMS ===
   Status: SUCCESS ✓
   ```

3. **Wait 1-2 minutes** for SMS delivery

4. **If still not received:**
   - Check Fast2SMS dashboard for delivery report
   - Check SMS quota/balance
   - Verify phone number is correct (no typos)
   - Try sending to a different number

5. **Check Fast2SMS dashboard:**
   - Login to https://www.fast2sms.com
   - Go to "Reports" or "Logs"
   - Check delivery status for the sent message
   - Look for error messages from telecom operator

## Common Issues

### Issue: "SMS sent successfully" but not received
**Cause**: DLT template mismatch or sender ID not approved  
**Fix**: Use non-DLT route for testing, or fix DLT template

### Issue: Invalid sender ID
**Cause**: Sender ID needs TRAI approval  
**Fix**: Request sender ID approval from Fast2SMS, or use default sender ID

### Issue: Template not found
**Cause**: Template ID doesn't exist or not approved  
**Fix**: Register template in Fast2SMS dashboard first

### Issue: Daily limit exceeded
**Cause**: Free plan limits  
**Fix**: Upgrade plan or use different day

## Quick Test

```bash
# 1. Edit config
nano backend/config.env
# Change: FAST2SMS_ROUTE=q

# 2. Restart backend
cd backend
go run cmd/api/main.go

# 3. Send test SMS from UI
# Go to SMS Marketing → Send Message

# 4. Check if received within 1-2 minutes
```

## Support Resources

- **Fast2SMS Docs**: https://docs.fast2sms.com/
- **DLT Guidelines**: https://www.trai.gov.in/
- **Fast2SMS Support**: support@fast2sms.com

## Summary

The SMS is being sent successfully by your backend, but India's DLT regulations require:
1. Registered template
2. Approved sender ID
3. Matching message format

**Quickest fix**: Change route from `dlt` to `q` in config.env for testing.
**Production fix**: Get proper DLT template approval and implement variable extraction.
