# Twilio SMS - Quick Setup (5 Minutes)

## Get Started with Twilio

### Step 1: Sign Up (2 minutes)
1. Go to https://www.twilio.com/try-twilio
2. Sign up with email
3. Verify your email and phone
4. **Get $15 free credit!**

### Step 2: Get Credentials (1 minute)
1. Go to https://console.twilio.com/
2. You'll see your dashboard
3. Copy these values:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click "Show" and copy

### Step 3: Get Phone Number (1 minute)
1. In Twilio Console, click "Get a Twilio phone number"
2. Click "Choose this number"
3. Copy your new number (e.g., `+12345678900`)

### Step 4: Configure Backend (1 minute)
Edit `backend/config.env`:

```env
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+12345678900
```

### Step 5: Verify Test Number (Trial Account Only)
1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new Caller ID"
3. Enter the phone number you want to test with
4. Verify via SMS code

### Step 6: Test!
```bash
cd backend
./api.exe
```

Create an appointment - client will receive SMS!

## Quick Test

### Test Without Twilio (Development)
```env
TWILIO_ENABLED=false
```
SMS will be logged to console only.

### Test With Twilio (Production)
```env
TWILIO_ENABLED=true
```
Real SMS will be sent!

## Costs

### Free Trial
- $15 credit
- ~500 SMS messages
- Must verify recipient numbers

### Production
- ₹0.40-0.80 per SMS in India
- $0.0075 per SMS in USA
- No monthly fees

## Upgrade to Production

When ready for production:
1. Add payment method in Twilio Console
2. Upgrade account
3. No need to verify recipient numbers anymore
4. Higher rate limits

---

**That's it! You're ready to send SMS notifications!** 🎉

Create an appointment and watch the SMS arrive on the client's phone.
