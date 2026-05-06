# Quick Start - Meta WhatsApp Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration
```bash
cd backend
./api.exe
```

The migration `010_update_whatsapp_for_meta_api.sql` will run automatically.

### Step 2: Get Meta WhatsApp Credentials

#### Option A: Use Test Credentials (Sandbox)
1. Go to https://developers.facebook.com/apps/
2. Create new app → Business type
3. Add WhatsApp product
4. Use the test phone number provided

#### Option B: Use Your Own Number (Production)
1. Complete Facebook Business verification
2. Add your phone number to WhatsApp Business
3. Get it approved by Meta

### Step 3: Test the Setup Flow

#### 3.1 Initialize Business
```bash
curl -X POST http://localhost:8080/api/whatsapp/setup/business \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210",
    "business_name": "My Real Estate Business",
    "business_description": "Leading broker in Pune",
    "business_category": "Real Estate",
    "business_website": "https://example.com"
  }'
```

#### 3.2 Request Verification Code
```bash
curl -X POST http://localhost:8080/api/whatsapp/setup/request-verification \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response will include the code** (for testing):
```json
{
  "message": "Verification code sent successfully",
  "data": {
    "code": "123456"
  }
}
```

#### 3.3 Verify Phone
```bash
curl -X POST http://localhost:8080/api/whatsapp/setup/verify-phone \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

#### 3.4 Connect Meta API
```bash
curl -X POST http://localhost:8080/api/whatsapp/setup/connect-meta-api \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_META_ACCESS_TOKEN",
    "phone_number_id": "YOUR_PHONE_NUMBER_ID",
    "business_account_id": "YOUR_BUSINESS_ACCOUNT_ID",
    "waba_id": "YOUR_WABA_ID"
  }'
```

### Step 4: Send Your First Message

```bash
curl -X POST http://localhost:8080/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_UUID",
    "message": "Hello! This is a test message from WhatsApp."
  }'
```

**Check your backend console** - you'll see:
```
=== META WHATSAPP MESSAGE ===
Phone Number ID: 123456789012345
To: +919876543210
Message: Hello! This is a test message from WhatsApp.
Time: 2026-04-27 10:30:45
Status: SUCCESS ✓
Message ID: wamid.HBgNOTE5ODc2NTQzMjEwFQIAERgSQzg5...
============================
```

**Check the client's phone** - they'll receive the WhatsApp message!

## 📱 Where to Get Meta Credentials

### Access Token
1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Go to WhatsApp → API Setup
4. Click "Generate Access Token"
5. Copy the token

### Phone Number ID
1. In WhatsApp → API Setup
2. Look for "Phone Number ID"
3. Copy the number (format: 123456789012345)

### Business Account ID & WABA ID
1. In WhatsApp settings
2. Look for "WhatsApp Business Account ID"
3. Copy the ID (usually same for both)

## 🎯 Testing Checklist

- [ ] Backend running on port 8080
- [ ] Database migration completed
- [ ] Meta app created
- [ ] WhatsApp product added
- [ ] Credentials obtained
- [ ] Business setup completed
- [ ] Phone verified
- [ ] Meta API connected
- [ ] Test message sent
- [ ] Client received message

## 🐛 Common Issues

### "Invalid Meta API credentials"
→ Double-check your access token and phone number ID

### "WhatsApp account not connected"
→ Complete all 4 setup steps in order

### "Client not found"
→ Make sure you have a client created in your database

### "Phone number not verified"
→ Complete phone verification before connecting Meta API

## 📚 Full Documentation

- **Complete Setup Guide**: `META_WHATSAPP_SETUP_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_COMPLETE.md`
- **API Reference**: See setup guide for all endpoints

## 🎉 Success!

If you see "Status: SUCCESS ✓" in your console and the client receives the message, you're all set!

Each broker can now:
1. Complete their own setup
2. Use their own WhatsApp number
3. Send real messages to clients
4. Track message delivery

**No mock implementation - 100% real WhatsApp messaging!**
