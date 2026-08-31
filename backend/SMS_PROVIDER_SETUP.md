# SMS Provider Configuration Guide

This application supports two SMS providers: **MSG91** and **Fast2SMS**. You can easily switch between them using configuration settings.

## Supported Providers

### 1. MSG91
- **Website**: https://msg91.com
- **API Documentation**: https://docs.msg91.com/
- **Features**: Reliable SMS delivery, DLT compliance, detailed analytics

### 2. Fast2SMS
- **Website**: https://www.fast2sms.com
- **API Documentation**: https://www.fast2sms.com/dev/bulkV2
- **Features**: Fast delivery, competitive pricing, simple API

## Configuration

### Environment Variables

Add these variables to your `config.env` file:

```env
# SMS Provider Selection
# Options: "msg91" or "fast2sms"
SMS_PROVIDER=msg91

# MSG91 Configuration
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=202603
MSG91_ROUTE=4
MSG91_TEMPLATE_ID=1277178600920660252

# Fast2SMS Configuration
FAST2SMS_ENABLED=false
FAST2SMS_AUTH_KEY=your_fast2sms_auth_key
FAST2SMS_SENDER_ID=202603
FAST2SMS_ROUTE=dlt
FAST2SMS_TEMPLATE_ID=222856
```

### Provider Selection

Set the `SMS_PROVIDER` variable to choose which provider to use:
- `SMS_PROVIDER=msg91` - Use MSG91
- `SMS_PROVIDER=fast2sms` - Use Fast2SMS

### Getting API Credentials

#### MSG91
1. Sign up at https://msg91.com
2. Navigate to Dashboard → Settings → API
3. Copy your Auth Key
4. Set up DLT templates for Indian regulations
5. Get Sender ID from DLT section
6. Copy Template ID from approved templates

#### Fast2SMS
1. Sign up at https://www.fast2sms.com
2. Navigate to Dashboard → API
3. Copy your API Key (authorization token)
4. Register Sender ID with TRAI
5. Create and approve DLT templates
6. Use Template ID (message parameter) from approved templates

## DLT Compliance (India)

Both providers require DLT (Distributed Ledger Technology) registration for sending SMS in India as per TRAI regulations:

1. **Register Your Business**: Register as a Principal Entity with DLT platform
2. **Register Sender ID**: Get approval for your 6-character Sender ID (e.g., 202603)
3. **Create Templates**: Create message templates and get them approved
4. **Template Variables**: Use approved variable formats:
   - MSG91: `{#var#}`
   - Fast2SMS: `{#alp#}` (alphanumeric)

### Template Examples

From your approved templates:

**Sale Property Alert** (Template ID: 1277178600920660252)
```
Property for Sale: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA
```

**Rent Property Alert** (Template ID: 1277178600009441768)
```
Property for Rent: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA
```

## Switching Between Providers

### Quick Switch
1. Open `config.env`
2. Change `SMS_PROVIDER=msg91` to `SMS_PROVIDER=fast2sms` (or vice versa)
3. Ensure the respective provider is enabled:
   - Set `FAST2SMS_ENABLED=true` when using Fast2SMS
   - Set `MSG91_ENABLED=true` when using MSG91
4. Restart the application

### Testing Both Providers
You can enable both providers and switch between them without losing configuration:

```env
SMS_PROVIDER=fast2sms

# Keep both configured
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_msg91_key
# ... other MSG91 settings

FAST2SMS_ENABLED=true
FAST2SMS_AUTH_KEY=your_fast2sms_key
# ... other Fast2SMS settings
```

## API Details

### MSG91 API
- **Endpoint**: `https://api.msg91.com/api/sendhttp.php`
- **Method**: POST (form-urlencoded)
- **Rate Limit**: ~10 messages/second
- **Required Parameters**:
  - `authkey`: Your MSG91 auth key
  - `mobiles`: Phone number(s)
  - `message`: SMS content
  - `sender`: Sender ID
  - `route`: Route type (4 = Transactional)
  - `DLT_TE_ID`: Template ID

### Fast2SMS API
- **Endpoint**: `https://www.fast2sms.com/dev/bulkV2`
- **Method**: GET or POST
- **Rate Limit**: Varies by plan
- **Required Parameters**:
  - `authorization`: Your Fast2SMS API key (header)
  - `route`: Route type (dlt = DLT compliant)
  - `sender_id`: Sender ID
  - `message`: Template ID
  - `variables_values`: Pipe-separated values (|)
  - `numbers`: Phone number(s)

## Code Structure

### Provider Interface
Both providers implement the `MessagingProvider` interface:

```go
type MessagingProvider interface {
    SendMessage(to string, message string) (*MessageResult, error)
    SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error)
    GetAccountStatus() (*AccountStatus, error)
    VerifyWebhook(token string) bool
    HandleWebhook(payload []byte) error
}
```

### Implementation Files
- `internal/provider/msg91_provider.go` - MSG91 implementation
- `internal/provider/fast2sms_provider.go` - Fast2SMS implementation
- `internal/provider/messaging_provider.go` - Interface definition
- `internal/service/sms_service.go` - Service layer (uses selected provider)

## Troubleshooting

### Common Issues

1. **SMS not delivered**
   - Verify DLT template is approved
   - Check Template ID matches the message format
   - Ensure Sender ID is registered and active
   - Verify phone number format (without + prefix for Indian numbers)

2. **Authentication failed**
   - Verify API key/auth key is correct
   - Check if account has sufficient balance
   - Ensure account is active

3. **Provider not switching**
   - Restart the application after changing `SMS_PROVIDER`
   - Verify the selected provider is enabled
   - Check logs for initialization messages

### Logs

The application logs SMS activity:

```
SMS Service initialized with Fast2SMS provider
=== Fast2SMS ===
From: 202603
To: 9876543210
Message: Test message
Route: dlt
Template ID: 222856
Time: 2026-08-13 10:30:00
Status: SUCCESS ✓
================
```

## Best Practices

1. **Template Management**: Keep template IDs updated in config
2. **Rate Limiting**: Built-in delays prevent API rate limit issues
3. **Error Handling**: Check logs for delivery failures
4. **Testing**: Use mock provider for development (set both providers to `false`)
5. **Backup Provider**: Keep both providers configured for redundancy
6. **Balance Monitoring**: Regularly check account balance
7. **Security**: Never commit `config.env` with real credentials

## Support

- MSG91 Support: https://msg91.com/help
- Fast2SMS Support: https://www.fast2sms.com/contact

## License

This SMS integration is part of the Enfor Data Backend application.
