# SMS Provider Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  (Handlers, Controllers, Business Logic)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SendSMS(to, message)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      SMS Service                             │
│  internal/service/sms_service.go                            │
│                                                              │
│  • Reads SMS_PROVIDER config                                │
│  • Initializes appropriate provider                         │
│  • Delegates to provider.SendMessage()                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ provider.SendMessage()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              MessagingProvider Interface                     │
│  internal/provider/messaging_provider.go                    │
│                                                              │
│  interface MessagingProvider {                              │
│    SendMessage(to, message) (*MessageResult, error)         │
│    SendBulkMessages(...) ([]*MessageResult, error)          │
│    GetAccountStatus() (*AccountStatus, error)               │
│    VerifyWebhook(token) bool                                │
│    HandleWebhook(payload) error                             │
│  }                                                           │
└──────────┬─────────────────────┬──────────────┬─────────────┘
           │                     │              │
           ▼                     ▼              ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│  MSG91Provider   │  │ Fast2SMSProvider │  │ MockProvider │
│  msg91_provider  │  │ fast2sms_provider│  │ mock_provider│
│       .go        │  │       .go        │  │     .go      │
└────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘
         │                     │                    │
         │ HTTP POST           │ HTTP GET           │ No-op
         │ Form Data           │ Query Params       │ (Dev Mode)
         ▼                     ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   MSG91 API      │  │  Fast2SMS API    │  │  Console Log │
│ api.msg91.com    │  │ fast2sms.com     │  │              │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

## Configuration Flow

```
┌─────────────────────┐
│    config.env       │
│                     │
│  SMS_PROVIDER=      │
│    "msg91" or       │
│    "fast2sms"       │
│                     │
│  MSG91_ENABLED=     │
│  MSG91_AUTH_KEY=    │
│  MSG91_SENDER_ID=   │
│  ...                │
│                     │
│  FAST2SMS_ENABLED=  │
│  FAST2SMS_AUTH_KEY= │
│  FAST2SMS_SENDER_ID=│
│  ...                │
└──────────┬──────────┘
           │
           │ Load at startup
           ▼
┌─────────────────────┐
│   Config Struct     │
│  config/config.go   │
│                     │
│  type Config {      │
│    SMS SMSConfig    │
│    MSG91 ...        │
│    Fast2SMS ...     │
│  }                  │
└──────────┬──────────┘
           │
           │ Injected into service
           ▼
┌─────────────────────┐
│   SMS Service       │
│  Creates provider   │
│  based on config    │
└─────────────────────┘
```

## Provider Selection Logic

```go
func NewSMSService(cfg *config.Config) *SMSService {
    var provider MessagingProvider
    
    switch cfg.SMS.Provider {
    case "fast2sms":
        if cfg.Fast2SMS.Enabled {
            provider = NewFast2SMSProvider(...)
        }
    case "msg91":
        if cfg.MSG91.Enabled {
            provider = NewMSG91Provider(...)
        }
    default:
        // Default to MSG91
        if cfg.MSG91.Enabled {
            provider = NewMSG91Provider(...)
        }
    }
    
    if provider == nil {
        provider = &MockProvider{} // Fallback
    }
    
    return &SMSService{
        config: cfg,
        provider: provider,
    }
}
```

## Message Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Application calls SMSService.SendSMS()                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Service calls provider.SendMessage()                     │
│    (provider determined at initialization)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│ 3a. MSG91 Provider   │   OR   │ 3b. Fast2SMS Provider│
│                      │        │                      │
│ • Clean phone number │        │ • Clean phone number │
│ • Prepare POST data  │        │ • Build GET URL      │
│ • Add DLT_TE_ID      │        │ • Set auth header    │
│ • Send to MSG91 API  │        │ • Send to Fast2SMS   │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Parse API response and return MessageResult              │
│    { MessageID, Status, Error }                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Service returns success/error to application             │
└─────────────────────────────────────────────────────────────┘
```

## API Request Formats

### MSG91 Request
```http
POST https://api.msg91.com/api/sendhttp.php
Content-Type: application/x-www-form-urlencoded

authkey=559551A8dqEjdO26a7b0f9cP1
mobiles=919876543210
message=Property for Sale: 3BHK Apartment...
sender=202603
route=4
DLT_TE_ID=1277178600920660252
response=json
```

### Fast2SMS Request
```http
GET https://www.fast2sms.com/dev/bulkV2?route=dlt&sender_id=202603&message=222856&variables_values=|||&numbers=9876543210
Authorization: urLQ********************
```

## Data Flow Sequence

```
┌──────┐      ┌─────────┐      ┌──────────┐      ┌─────────┐
│ App  │      │ Service │      │ Provider │      │   API   │
└──┬───┘      └────┬────┘      └────┬─────┘      └────┬────┘
   │               │                │                 │
   │ SendSMS()     │                │                 │
   ├──────────────>│                │                 │
   │               │                │                 │
   │               │ SendMessage()  │                 │
   │               ├───────────────>│                 │
   │               │                │                 │
   │               │                │ HTTP Request    │
   │               │                ├────────────────>│
   │               │                │                 │
   │               │                │ HTTP Response   │
   │               │                │<────────────────┤
   │               │                │                 │
   │               │ MessageResult  │                 │
   │               │<───────────────┤                 │
   │               │                │                 │
   │  success/err  │                │                 │
   │<──────────────┤                │                 │
   │               │                │                 │
```

## Component Responsibilities

### SMSService
- ✅ Provider selection
- ✅ Service initialization
- ✅ High-level SMS operations
- ✅ Error handling
- ✅ Logging provider selection

### MSG91Provider
- ✅ MSG91 API integration
- ✅ POST request formatting
- ✅ Phone number cleaning (remove +)
- ✅ DLT_TE_ID parameter
- ✅ Response parsing
- ✅ Rate limiting (100ms delay)

### Fast2SMSProvider
- ✅ Fast2SMS API integration
- ✅ GET request with query params
- ✅ Authorization header
- ✅ Phone number cleaning (remove +91)
- ✅ Template variable formatting
- ✅ Response parsing
- ✅ Rate limiting (100ms delay)

### MockProvider
- ✅ Development/testing fallback
- ✅ Console logging
- ✅ No actual API calls

## Configuration Schema

```yaml
SMS Provider Configuration:
  SMS_PROVIDER:
    type: string
    values: ["msg91", "fast2sms"]
    default: "msg91"
    
  MSG91:
    ENABLED: boolean
    AUTH_KEY: string (required if enabled)
    SENDER_ID: string (required if enabled)
    ROUTE: string (default: "4")
    TEMPLATE_ID: string (DLT template)
    
  Fast2SMS:
    ENABLED: boolean
    AUTH_KEY: string (required if enabled)
    SENDER_ID: string (required if enabled)
    ROUTE: string (default: "dlt")
    TEMPLATE_ID: string (DLT template)
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ SMS Send Request                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │ Provider       │
                │ Configured?    │
                └────┬──────┬────┘
                     │ No   │ Yes
                     │      │
             ┌───────┘      └───────┐
             ▼                      ▼
    ┌────────────────┐     ┌────────────────┐
    │ Use Mock       │     │ Send to API    │
    │ Provider       │     │                │
    └────────────────┘     └────┬──────┬────┘
                                │ Fail │ OK
                                │      │
                        ┌───────┘      └───────┐
                        ▼                      ▼
               ┌────────────────┐     ┌────────────────┐
               │ Return Error   │     │ Return Success │
               │ with Details   │     │ MessageResult  │
               └────────────────┘     └────────────────┘
```

## Key Features

### 1. Provider Abstraction
- Interface-based design
- Easy to add new providers
- Clean separation of concerns

### 2. Configuration-Driven
- No code changes to switch providers
- Environment-based configuration
- Can keep both providers ready

### 3. Fallback Mechanism
- Mock provider for development
- Graceful handling of missing config
- Console logging for debugging

### 4. DLT Compliance
- Both providers support DLT templates
- Template ID configuration
- Variable substitution support

### 5. Rate Limiting
- Built-in delays between messages
- Prevents API rate limit violations
- Configurable per provider

## File Structure

```
backend/
├── internal/
│   ├── config/
│   │   └── config.go          # Config structs & loading
│   │
│   ├── provider/
│   │   ├── messaging_provider.go    # Interface definition
│   │   ├── msg91_provider.go        # MSG91 implementation
│   │   ├── fast2sms_provider.go     # Fast2SMS implementation
│   │   └── mock_provider.go         # Mock for testing
│   │
│   └── service/
│       └── sms_service.go     # Service layer
│
├── config.env                 # Active configuration
├── config.env.example         # Configuration template
│
└── Documentation:
    ├── SMS_PROVIDER_SETUP.md       # Setup guide
    ├── SMS_INTEGRATION_SUMMARY.md  # Implementation details
    ├── SMS_QUICK_REFERENCE.md      # Quick reference
    └── SMS_ARCHITECTURE.md         # This file
```

## Testing Strategy

### Unit Testing
```go
// Test provider interface implementation
func TestMSG91Provider_SendMessage(t *testing.T) { ... }
func TestFast2SMSProvider_SendMessage(t *testing.T) { ... }
```

### Integration Testing
```go
// Test provider switching
func TestSMSService_ProviderSelection(t *testing.T) { ... }
```

### Manual Testing
1. Set `SMS_PROVIDER=msg91` → Test SMS sending
2. Set `SMS_PROVIDER=fast2sms` → Test SMS sending
3. Set both to `false` → Verify mock provider used

## Performance Considerations

### Rate Limiting
- 100ms delay between messages
- Prevents API throttling
- Adjustable per provider

### Connection Pooling
- HTTP client reused across requests
- 30-second timeout per request
- Efficient resource usage

### Error Recovery
- Failed messages logged
- Error details preserved
- Doesn't crash on API errors

## Security Considerations

### Credentials
- ✅ Stored in config.env (not committed)
- ✅ config.env in .gitignore
- ✅ Example file without real credentials
- ⚠️ Consider encryption for production

### Phone Numbers
- ✅ Format cleaning
- ✅ Validation could be enhanced
- 🔜 Add phone number validation library

### API Security
- ✅ HTTPS for all requests
- ✅ Authentication via keys/tokens
- ✅ No credentials in logs

## Monitoring & Logging

### Console Output
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

### Recommended Logging
- SMS sent count
- Delivery success rate
- API response times
- Error rates by provider

## Maintenance

### Adding New Provider
1. Create `internal/provider/newprovider_provider.go`
2. Implement `MessagingProvider` interface
3. Add config struct in `config.go`
4. Update `NewSMSService()` switch statement
5. Add to documentation

### Updating Existing Provider
1. Modify provider file
2. Ensure interface compliance
3. Test with real API
4. Update documentation

---

This architecture provides a flexible, maintainable, and extensible SMS integration system with easy provider switching and DLT compliance.
