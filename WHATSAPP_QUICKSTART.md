# WhatsApp Module - Quick Start Guide

## Immediate Action Items

### 1. Run Database Migration (5 minutes)

Create file: `backend/migrations/009_whatsapp_module.sql`

```sql
-- Run this migration first
-- Copy the SQL from WHATSAPP_MODULE_IMPLEMENTATION_PLAN.md Phase 1
```

Then update `backend/internal/database/connection.go` to run this migration.

### 2. Set Up Meta WhatsApp Business (30 minutes)

1. Go to https://business.facebook.com
2. Create/Select Business Account
3. Add WhatsApp Product
4. Get these credentials:
   - Phone Number ID
   - Business Account ID
   - Access Token

5. Add to `backend/config.env`:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secure_string
ENCRYPTION_KEY=generate_32_byte_random_key
```

### 3. Create Backend Structure (1 hour)

```bash
# Create new directories
mkdir -p backend/internal/provider
mkdir -p backend/internal/models
mkdir -p backend/internal/repository
mkdir -p backend/internal/service
mkdir -p backend/internal/handler
```

Copy code templates from implementation plan.

### 4. Update Frontend (30 minutes)

Replace mock data with real API calls:

```typescript
// frontend/src/services/whatsappApi.ts
// Copy from implementation plan
```

### 5. Test Connection Flow (15 minutes)

1. Start backend: `cd backend && ./api.exe`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to WhatsApp page
4. Test connection flow

## Development Order

### Day 1: Database & Models
- [ ] Run migration
- [ ] Create models
- [ ] Test database connection

### Day 2: Provider & Repository
- [ ] Implement WhatsApp Cloud Provider
- [ ] Create repository layer
- [ ] Test API calls

### Day 3: Service & Handler
- [ ] Implement service layer
- [ ] Create API handlers
- [ ] Add routes to main.go

### Day 4: Frontend Integration
- [ ] Create API service
- [ ] Build connection flow
- [ ] Test end-to-end

### Day 5: Bulk Messaging
- [ ] Campaign creation
- [ ] Bulk send logic
- [ ] Status tracking

### Day 6: Polish & Test
- [ ] Error handling
- [ ] Loading states
- [ ] User feedback
- [ ] Testing

## Critical Files to Create

### Backend (Priority Order):
1. `backend/migrations/009_whatsapp_module.sql`
2. `backend/internal/provider/messaging_provider.go`
3. `backend/internal/provider/whatsapp_cloud_provider.go`
4. `backend/internal/models/whatsapp.go`
5. `backend/internal/repository/whatsapp_repository.go`
6. `backend/internal/service/whatsapp_service.go`
7. `backend/internal/handler/whatsapp_handler.go`
8. `backend/internal/utils/encryptor.go`

### Frontend (Priority Order):
1. `frontend/src/services/whatsappApi.ts`
2. `frontend/src/pages/WhatsApp/hooks/useWhatsAppAccount.ts`
3. `frontend/src/pages/WhatsApp/components/ConnectionFlow.tsx`
4. `frontend/src/pages/WhatsApp/components/CampaignForm.tsx`
5. `frontend/src/pages/WhatsApp/components/ClientSelector.tsx`

## Testing Checklist

- [ ] Database tables created
- [ ] Can connect WhatsApp account
- [ ] Can send individual message
- [ ] Can select multiple clients
- [ ] Can create campaign
- [ ] Can send bulk messages
- [ ] Status updates work
- [ ] Error handling works
- [ ] UI is responsive
- [ ] Loading states show

## Common Issues & Solutions

### Issue: "Access token invalid"
**Solution:** Regenerate token in Meta Business Manager

### Issue: "Phone number not verified"
**Solution:** Complete phone verification in Meta dashboard

### Issue: "Rate limit exceeded"
**Solution:** Implement delay between messages (15ms minimum)

### Issue: "Database connection failed"
**Solution:** Check DATABASE_URL in config.env

### Issue: "CORS error"
**Solution:** Verify CORS middleware is enabled

## Production Deployment

### Before Going Live:
1. [ ] All tokens encrypted
2. [ ] Rate limiting enabled
3. [ ] Error logging configured
4. [ ] Backup database
5. [ ] Test with small batch first
6. [ ] Monitor for 24 hours
7. [ ] Set up alerts

### Environment Variables (Production):
```env
# Use system user token (never expires)
WHATSAPP_ACCESS_TOKEN=system_user_token

# Strong encryption key
ENCRYPTION_KEY=use_32_byte_random_key

# Production database
DATABASE_URL=production_neon_url

# Enable production mode
GIN_MODE=release
```

## Support Resources

- Meta WhatsApp Docs: https://developers.facebook.com/docs/whatsapp
- Cloud API Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
- Business Manager: https://business.facebook.com

## Need Help?

Refer to `WHATSAPP_MODULE_IMPLEMENTATION_PLAN.md` for:
- Complete code examples
- Detailed architecture
- Security best practices
- Advanced features

---

**Remember:** Start simple, test often, deploy incrementally!
