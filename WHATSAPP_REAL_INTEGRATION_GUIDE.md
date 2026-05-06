# WhatsApp Real Integration Guide

## Current Situation

Your system is using a **Mock Provider** which **simulates** sending WhatsApp messages but doesn't actually send them. This is intentional for development and testing purposes.

### What the Mock Provider Does:
- ✅ Simulates 95% success rate
- ✅ Logs messages to the database
- ✅ Shows "Message sent successfully!" 
- ❌ **Does NOT send actual WhatsApp messages**
- ❌ Clients won't receive any messages

## Why Use a Mock Provider?

1. **No API Costs**: Real WhatsApp Business API costs money per message
2. **No Setup Required**: No need for WhatsApp Business Account approval
3. **Safe Testing**: Can test the entire flow without spamming real clients
4. **Fast Development**: No rate limits or API delays

## Options for Real WhatsApp Integration

### Option 1: WhatsApp Business API (Official) ⭐ RECOMMENDED

**Best for:** Production use, large-scale messaging, official business communication

**Requirements:**
- WhatsApp Business Account
- Facebook Business Manager Account
- Phone number verification
- Business verification (can take days/weeks)

**Providers:**
1. **Twilio** (Most Popular)
   - Website: https://www.twilio.com/whatsapp
   - Pricing: ~$0.005-0.01 per message
   - Easy integration
   - Good documentation

2. **Meta Cloud API** (Direct from Meta)
   - Website: https://developers.facebook.com/docs/whatsapp/cloud-api
   - Pricing: Free tier available (1000 messages/month)
   - More complex setup
   - Official provider

3. **MessageBird**
   - Website: https://messagebird.com/whatsapp
   - Pricing: Similar to Twilio
   - Good for international messaging

**Implementation Steps:**
1. Sign up with a provider (e.g., Twilio)
2. Get API credentials
3. Verify your phone number
4. Create a `TwilioProvider` implementing `MessagingProvider` interface
5. Replace `MockProvider` with `TwilioProvider` in the code

### Option 2: WhatsApp Web API (Unofficial) ⚠️

**Best for:** Small-scale use, testing, personal projects

**Warning:** Violates WhatsApp Terms of Service - account may be banned

**Libraries:**
- `whatsmeow` (Go library)
- `baileys` (Node.js)
- `whatsapp-web.js` (Node.js)

**Pros:**
- Free
- No business verification needed
- Quick setup

**Cons:**
- Against WhatsApp ToS
- Risk of account ban
- Less reliable
- No official support

### Option 3: Keep Mock Provider + Add Logging

**Best for:** Development, demo purposes, testing

**What to do:**
- Keep the mock provider
- Add detailed logging to show what "would" be sent
- Use for demos and testing
- Switch to real provider when ready for production

## Implementation Guide: Twilio WhatsApp Integration

### Step 1: Sign Up for Twilio

1. Go to https://www.twilio.com/try-twilio
2. Create an account
3. Get your Account SID and Auth Token
4. Set up WhatsApp Sandbox (for testing) or get approved number

### Step 2: Create Twilio Provider

Create `backend/internal/provider/twilio_provider.go`:

```go
package provider

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "strings"
)

type TwilioProvider struct {
    accountSID string
    authToken  string
    fromNumber string // Your Twilio WhatsApp number (e.g., "whatsapp:+14155238886")
}

func NewTwilioProvider(accountSID, authToken, fromNumber string) *TwilioProvider {
    return &TwilioProvider{
        accountSID: accountSID,
        authToken:  authToken,
        fromNumber: fromNumber,
    }
}

func (p *TwilioProvider) SendMessage(to string, message string) (*MessageResult, error) {
    // Ensure phone number has whatsapp: prefix
    if !strings.HasPrefix(to, "whatsapp:") {
        to = "whatsapp:" + to
    }

    // Twilio API endpoint
    apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", p.accountSID)

    // Prepare form data
    data := url.Values{}
    data.Set("From", p.fromNumber)
    data.Set("To", to)
    data.Set("Body", message)

    // Create request
    req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    req.SetBasicAuth(p.accountSID, p.authToken)
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

    // Send request
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()

    // Parse response
    var result struct {
        SID    string `json:"sid"`
        Status string `json:"status"`
        ErrorMessage string `json:"error_message"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    if resp.StatusCode != 201 {
        return &MessageResult{
            Status: "failed",
            Error:  result.ErrorMessage,
        }, nil
    }

    return &MessageResult{
        MessageID: result.SID,
        Status:    "sent",
    }, nil
}

func (p *TwilioProvider) SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error) {
    results := make([]*MessageResult, len(recipients))
    
    for i, recipient := range recipients {
        result, err := p.SendMessage(recipient.Phone, message)
        if err != nil {
            results[i] = &MessageResult{
                Status: "failed",
                Error:  err.Error(),
            }
        } else {
            results[i] = result
        }
    }
    
    return results, nil
}

func (p *TwilioProvider) GetAccountStatus() (*AccountStatus, error) {
    // Implement Twilio account status check
    return &AccountStatus{
        Connected:    true,
        PhoneNumber:  p.fromNumber,
        MessageLimit: 10000, // Adjust based on your Twilio plan
        MessagesUsed: 0,
        DisplayName:  "Twilio WhatsApp",
    }, nil
}

func (p *TwilioProvider) VerifyWebhook(token string) bool {
    // Implement Twilio webhook verification
    return true
}

func (p *TwilioProvider) HandleWebhook(payload []byte) error {
    // Implement Twilio webhook handling
    return nil
}
```

### Step 3: Update Configuration

Add to `backend/config.env`:

```env
# WhatsApp Provider Configuration
WHATSAPP_PROVIDER=mock  # Change to "twilio" for production

# Twilio Configuration (only needed if WHATSAPP_PROVIDER=twilio)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4: Update Service to Use Provider

Modify `backend/cmd/api/main.go` to switch providers:

```go
// In main.go, where you initialize the WhatsApp service

var messagingProvider provider.MessagingProvider

if config.WhatsAppProvider == "twilio" {
    messagingProvider = provider.NewTwilioProvider(
        config.TwilioAccountSID,
        config.TwilioAuthToken,
        config.TwilioWhatsAppNumber,
    )
} else {
    // Use mock provider for development
    messagingProvider = provider.NewMockProvider("+919876543210", "Mock Provider")
}

whatsappService := service.NewWhatsAppService(whatsappRepo, clientRepo, messagingProvider)
```

### Step 5: Update Config Struct

Add to `backend/internal/config/config.go`:

```go
type Config struct {
    // ... existing fields ...
    
    // WhatsApp Provider
    WhatsAppProvider      string `env:"WHATSAPP_PROVIDER" envDefault:"mock"`
    TwilioAccountSID      string `env:"TWILIO_ACCOUNT_SID"`
    TwilioAuthToken       string `env:"TWILIO_AUTH_TOKEN"`
    TwilioWhatsAppNumber  string `env:"TWILIO_WHATSAPP_NUMBER"`
}
```

## Testing with Twilio Sandbox

Before getting a production number, test with Twilio's sandbox:

1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Follow instructions to join the sandbox (send a code to Twilio's test number)
3. Use the sandbox number as `TWILIO_WHATSAPP_NUMBER`
4. Test sending messages to your own number

## Cost Estimation

### Twilio Pricing (Approximate):
- **India**: ₹0.40 - ₹0.80 per message (~$0.005-0.01 USD)
- **USA**: $0.005 per message
- **Free Trial**: $15 credit (enough for ~1500-3000 messages)

### Monthly Cost Examples:
- 1,000 messages/month: ₹400-800 (~$5-10)
- 10,000 messages/month: ₹4,000-8,000 (~$50-100)
- 100,000 messages/month: ₹40,000-80,000 (~$500-1000)

## Recommendation

### For Development/Testing:
✅ **Keep using Mock Provider** - It's perfect for testing the flow

### For Demo/Presentation:
✅ **Keep Mock Provider** + Add detailed logging to show what would be sent

### For Production:
✅ **Use Twilio WhatsApp Business API**
- Most reliable
- Official support
- Reasonable pricing
- Easy integration

## Current Status

Your system is **working correctly** with the Mock Provider. It's:
- ✅ Logging all messages to database
- ✅ Tracking success/failure rates
- ✅ Managing campaigns
- ✅ Ready to switch to real provider when needed

**To send real messages, you need to:**
1. Choose a provider (Twilio recommended)
2. Sign up and get credentials
3. Implement the provider (code provided above)
4. Update configuration
5. Test with sandbox first
6. Deploy to production

## Need Help?

If you want me to:
1. Implement the Twilio provider
2. Set up the configuration
3. Create a hybrid mode (mock for testing, real for production)
4. Add detailed logging to mock provider

Just let me know!
