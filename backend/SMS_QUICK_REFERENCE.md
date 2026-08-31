# SMS Provider Quick Reference

## Quick Switch Guide

### Switch to MSG91
```env
SMS_PROVIDER=msg91
MSG91_ENABLED=true
```

### Switch to Fast2SMS
```env
SMS_PROVIDER=fast2sms
FAST2SMS_ENABLED=true
```

### Disable SMS (Use Mock for Testing)
```env
MSG91_ENABLED=false
FAST2SMS_ENABLED=false
```

## Your Current Configuration

Based on your provided credentials and templates:

### MSG91 Settings
```env
SMS_PROVIDER=msg91
MSG91_ENABLED=true
MSG91_AUTH_KEY=559551A8dqEjdO26a7b0f9cP1
MSG91_SENDER_ID=202603
MSG91_ROUTE=4
MSG91_TEMPLATE_ID=1277178600920660252
```

### Fast2SMS Settings
```env
SMS_PROVIDER=fast2sms
FAST2SMS_ENABLED=true
FAST2SMS_AUTH_KEY=urLQ********************  # Replace with your full key
FAST2SMS_SENDER_ID=202603
FAST2SMS_ROUTE=dlt
FAST2SMS_TEMPLATE_ID=222856
```

## API Endpoints

### MSG91
```
POST https://api.msg91.com/api/sendhttp.php
Content-Type: application/x-www-form-urlencoded

authkey=YOUR_KEY
mobiles=PHONE_NUMBER
message=MESSAGE_TEXT
sender=SENDER_ID
route=4
DLT_TE_ID=TEMPLATE_ID
```

### Fast2SMS
```
GET https://www.fast2sms.com/dev/bulkV2
Header: authorization: YOUR_KEY

?route=dlt
&sender_id=SENDER_ID
&message=TEMPLATE_ID
&variables_values=value1|value2|value3
&numbers=PHONE_NUMBER
```

## Your Approved DLT Templates

### Template 1: Sale Property Alert
- **Template ID (MSG91)**: 1277178600920660252
- **Template ID (Fast2SMS)**: 222856
- **Sender ID**: 202603
- **Content**:
  ```
  Property for Sale: {#alp#}
  Details: ₹{#alp#}
  Contact: {#alp#}
  - ENFOR DATA
  ```

### Template 2: Rent Property Alert
- **Template ID (MSG91)**: 1277178600009441768
- **Template ID (Fast2SMS)**: Check your Fast2SMS dashboard
- **Sender ID**: 202603
- **Content**:
  ```
  Property for Rent: {#alp#}
  Details: ₹{#alp#}
  Contact: {#alp#}
  - ENFOR DATA
  ```

## Testing Commands

### Build Application
```bash
cd backend
go build -o api.exe ./cmd/api
```

### Run Application
```bash
cd backend
./api.exe
# or
go run cmd/api/main.go
```

### Watch Logs
Look for this line on startup:
```
SMS Service initialized with Fast2SMS provider
# or
SMS Service initialized with MSG91 provider
```

### Test SMS Send
When SMS is sent, you'll see console output:
```
=== Fast2SMS ===
From: 202603
To: 9876543210
Message: Test message
Route: dlt
Template ID: 222856
Status: SUCCESS ✓
================
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Provider not switching | Restart application after config change |
| Authentication error | Verify AUTH_KEY in config.env |
| SMS not delivered | Check DLT template ID and approval status |
| Phone format error | Remove + prefix for Indian numbers |
| Template mismatch | Ensure template content matches approved version |

## Common Phone Number Formats

### Accepted Formats
- `9876543210` ✅
- `919876543210` ✅
- `+919876543210` ✅ (will be cleaned automatically)

### Provider Processing
- **MSG91**: Removes `+` prefix → `919876543210`
- **Fast2SMS**: Removes `+91` prefix → `9876543210`

## Rate Limits

| Provider | Rate Limit | Built-in Delay |
|----------|------------|----------------|
| MSG91 | ~10 msg/sec | 100ms between messages |
| Fast2SMS | Varies by plan | 100ms between messages |

## Files Modified

```
backend/
├── internal/
│   ├── config/
│   │   └── config.go ✏️ (updated)
│   ├── provider/
│   │   ├── fast2sms_provider.go ✨ (new)
│   │   ├── msg91_provider.go (unchanged)
│   │   └── messaging_provider.go (unchanged)
│   └── service/
│       └── sms_service.go ✏️ (updated)
├── config.env ✏️ (updated)
├── config.env.example ✏️ (updated)
├── SMS_PROVIDER_SETUP.md ✨ (new)
├── SMS_INTEGRATION_SUMMARY.md ✨ (new)
└── SMS_QUICK_REFERENCE.md ✨ (this file)
```

## Cost Comparison Tips

1. **Track SMS Volume**: Monitor how many SMS you send per month
2. **Compare Pricing**: Check both providers' pricing for your volume
3. **Test Delivery Rates**: Compare success rates over 1 week
4. **Consider Support**: Evaluate customer support quality
5. **Check Features**: Some providers offer better analytics

## Next Steps

1. ✅ Integration complete
2. 🔜 Update Fast2SMS AUTH_KEY with complete value
3. 🔜 Test with both providers
4. 🔜 Monitor delivery rates
5. 🔜 Choose primary provider based on performance

## Quick Test Script

To quickly test which provider is active:

```bash
# 1. Check current config
grep "SMS_PROVIDER" backend/config.env

# 2. Start application
cd backend && ./api.exe

# 3. Look for initialization message in console
# Should see: "SMS Service initialized with [Provider Name]"
```

## Support Links

- **MSG91 Dashboard**: https://control.msg91.com/
- **Fast2SMS Dashboard**: https://www.fast2sms.com/dashboard
- **MSG91 API Docs**: https://docs.msg91.com/
- **Fast2SMS API Docs**: https://www.fast2sms.com/dev/bulkV2

---

**Remember**: After changing `config.env`, always restart the application for changes to take effect!
