# SMS Notifications for Appointments - Complete Guide

## Overview

Your system now sends **automatic SMS notifications** to clients for appointments using **Twilio SMS API**.

## Features Implemented

### ✅ Immediate SMS Notifications
1. **Appointment Created** - Client receives confirmation SMS immediately
2. **Appointment Updated** - Client receives update SMS when date/time changes
3. **Appointment Cancelled** - Client receives cancellation SMS

### ✅ Automatic Reminders
- **1-Hour Before Reminder** - Automatic SMS sent 1 hour before appointment
- **Background Scheduler** - Checks every 5 minutes for upcoming appointments
- **Smart Timing** - Sends reminders in 55-65 minute window (catches appointments reliably)

## SMS Message Templates

### 1. Appointment Confirmation
```
Hi John Doe! Your appointment 'Property Viewing' has been scheduled 
for Monday, April 28, 2026 at 3:00 PM with Krushna Salbande. 
We look forward to seeing you!
```

### 2. Appointment Reminder (1 hour before)
```
Reminder: Hi John Doe! Your appointment 'Property Viewing' is 
scheduled in 1 hour at 3:00 PM with Krushna Salbande. See you soon!
```

### 3. Appointment Update
```
Hi John Doe, your appointment 'Property Viewing' has been 
rescheduled to Tuesday, April 29, 2026 at 4:00 PM. Thank you!
```

### 4. Appointment Cancellation
```
Hi John Doe, your appointment 'Property Viewing' has been cancelled. 
Please contact us if you have any questions.
```

## Setup Instructions

### Step 1: Get Twilio Credentials

1. **Sign up for Twilio**
   - Go to https://www.twilio.com/try-twilio
   - Create a free account
   - Get $15 free credit (enough for ~500 SMS)

2. **Get Your Credentials**
   - Go to Twilio Console: https://console.twilio.com/
   - Find your **Account SID** and **Auth Token**
   - Copy these values

3. **Get a Phone Number**
   - In Twilio Console, go to Phone Numbers → Buy a Number
   - Choose a number (free with trial account)
   - This will be your "From" number

### Step 2: Configure Backend

Edit `backend/config.env`:

```env
# Twilio SMS Configuration
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
```

**Important:**
- Set `TWILIO_ENABLED=true` to enable SMS
- Set `TWILIO_ENABLED=false` to disable SMS (for testing without Twilio)
- Replace with your actual Twilio credentials
- Use the phone number you purchased from Twilio

### Step 3: Restart Backend

```bash
cd backend
./api.exe
```

You should see:
```
📅 Appointment Reminder Service started
```

## How It Works

### When Appointment is Created

```
User creates appointment via API/Frontend
↓
Appointment saved to database
↓
SMS sent immediately to client (async)
↓
Client receives confirmation SMS
```

**Backend Console Output:**
```
=== TWILIO SMS ===
From: +1234567890
To: +919876543210
Message: Hi John Doe! Your appointment...
Time: 2026-04-27 14:30:00
Status: SUCCESS ✓
Message SID: SM1234567890abcdef
Twilio Status: queued
==================
```

### Reminder Scheduler

```
Background service runs every 5 minutes
↓
Checks for appointments 55-65 minutes away
↓
Sends reminder SMS to clients
↓
Logs reminder activity
```

**Console Output:**
```
🔍 Checking for appointments between 15:25 and 15:35
✅ Reminder sent for appointment: Property Viewing
📨 Sent 1 reminder(s)
```

### When Appointment is Updated

```
User updates appointment date/time
↓
Appointment updated in database
↓
SMS sent to client with new details
```

### When Appointment is Cancelled

```
User changes status to "cancelled"
↓
Appointment updated in database
↓
Cancellation SMS sent to client
```

## Testing

### Test 1: Create Appointment (Immediate SMS)

```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Property Viewing",
    "description": "2BHK apartment viewing",
    "client_id": "CLIENT_UUID",
    "date": "2026-04-28",
    "time": "15:00",
    "type": "site_visit"
  }'
```

**Expected:**
- Appointment created
- SMS sent immediately to client
- Console shows SMS delivery status

### Test 2: Update Appointment (Update SMS)

```bash
curl -X PUT http://localhost:8080/api/appointments/APPOINTMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-04-29",
    "time": "16:00"
  }'
```

**Expected:**
- Appointment updated
- SMS sent with new date/time
- Console shows SMS delivery

### Test 3: Cancel Appointment (Cancellation SMS)

```bash
curl -X PUT http://localhost:8080/api/appointments/APPOINTMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled"
  }'
```

**Expected:**
- Appointment cancelled
- Cancellation SMS sent
- Console shows SMS delivery

### Test 4: Reminder (1 Hour Before)

**Setup:**
1. Create appointment for 1 hour from now
2. Wait for reminder scheduler (runs every 5 minutes)
3. Check console logs

**Expected:**
```
🔍 Checking for appointments between 15:55 and 16:05
✅ Reminder sent for appointment: Property Viewing
📨 Sent 1 reminder(s)
```

## Twilio Pricing

### Free Trial
- **$15 credit** (enough for ~500 SMS)
- Can send to verified numbers only
- Add numbers in Twilio Console → Verified Caller IDs

### Production Pricing (India)
- **₹0.40 - ₹0.80 per SMS** (~$0.005-0.01 USD)
- No monthly fees
- Pay as you go

### Monthly Cost Examples
- 100 appointments/month: ₹40-80 (~$0.50-1)
- 500 appointments/month: ₹200-400 (~$2.50-5)
- 1000 appointments/month: ₹400-800 (~$5-10)

## Disable SMS (Testing Mode)

To test without sending actual SMS:

```env
TWILIO_ENABLED=false
```

**What happens:**
- SMS messages are logged to console
- No actual SMS sent
- No Twilio API calls
- No charges

**Console Output:**
```
=== SMS (DISABLED) ===
To: +919876543210
Message: Hi John Doe! Your appointment...
Note: Twilio is disabled. Enable it in config.env
=====================
```

## Production Checklist

- [ ] Get Twilio account
- [ ] Purchase phone number
- [ ] Add credentials to config.env
- [ ] Set TWILIO_ENABLED=true
- [ ] Test with verified numbers first
- [ ] Verify SMS delivery
- [ ] Monitor Twilio console for delivery status
- [ ] Set up billing alerts in Twilio
- [ ] Add error handling for failed SMS
- [ ] Consider SMS templates for compliance

## Troubleshooting

### "Twilio configuration incomplete"
→ Check all three values are set in config.env:
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_FROM_NUMBER

### "Failed to send SMS"
→ Check Twilio console for error details
→ Verify phone number format (+country_code)
→ Ensure recipient number is verified (trial account)

### "SMS not received"
→ Check Twilio console → Logs → SMS Logs
→ Verify delivery status
→ Check recipient phone number is correct
→ Ensure phone has signal

### Reminders not sending
→ Check appointment is scheduled (not completed/cancelled)
→ Verify appointment time is in future
→ Check console logs for scheduler activity
→ Ensure appointment date/time format is correct

### "The number +XX is unverified" (Trial Account)
→ Go to Twilio Console → Verified Caller IDs
→ Add and verify the recipient's phone number
→ Or upgrade to paid account (no verification needed)

## Advanced Features (Future)

### Recommended Enhancements:
1. **Database Tracking**
   - Add `reminder_sent` flag to appointments
   - Track SMS delivery status
   - Store SMS SID for reference

2. **Retry Logic**
   - Retry failed SMS
   - Exponential backoff
   - Max retry attempts

3. **SMS Templates**
   - Customizable message templates
   - Multi-language support
   - Personalization variables

4. **Delivery Reports**
   - Track delivery status via webhooks
   - Update database with delivery status
   - Alert on failed deliveries

5. **User Preferences**
   - Allow clients to opt-out
   - Preferred notification time
   - SMS vs WhatsApp preference

## Summary

✅ **Immediate SMS** - Sent when appointment created  
✅ **Update SMS** - Sent when date/time changes  
✅ **Cancellation SMS** - Sent when appointment cancelled  
✅ **1-Hour Reminder** - Automatic background scheduler  
✅ **Twilio Integration** - Production-ready SMS delivery  
✅ **Testing Mode** - Can disable for development  
✅ **Error Handling** - Graceful failures, logged to console  
✅ **Async Processing** - Non-blocking SMS sending  

**Your appointment system now has complete SMS notification support!**

Clients will receive:
- Confirmation when appointment is booked
- Reminder 1 hour before appointment
- Updates when appointment is rescheduled
- Notification when appointment is cancelled

All powered by Twilio's reliable SMS infrastructure.
