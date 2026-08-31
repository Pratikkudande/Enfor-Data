# SMS DLT Template System Implementation

## Overview
This document describes the complete implementation of the SMS DLT (Distributed Ledger Technology) template management system with variable substitution support.

## Features Implemented

### Task 1: Database Schema
Created a new table `sms_dlt_templates` to store regulatory-compliant SMS templates with the following columns:
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `header` - Template header/entity ID (e.g., "202603")
- `template_id` - Provider's template ID (e.g., "1277178600920660252")
- `template_name` - Friendly name for the template
- `template_type` - "Promotional" or "Service"
- `provider` - SMS provider name (MSG91, Fast2SMS, JIO, etc.)
- `template_content` - Template text with {#var#} placeholders
- `sample_content` - Optional sample content with actual values
- `status` - Approval status: "Registered", "Approved", "Active", "Inactive", "Rejected"
- `variable_count` - Number of variables in the template
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Task 2: Backend API Endpoints

#### DLT Template Management
- `POST /api/sms-marketing/dlt-templates` - Create a new DLT template
- `GET /api/sms-marketing/dlt-templates` - List all DLT templates for the user
- `GET /api/sms-marketing/dlt-templates/:id` - Get a specific DLT template
- `PUT /api/sms-marketing/dlt-templates/:id` - Update a DLT template
- `DELETE /api/sms-marketing/dlt-templates/:id` - Delete a DLT template

#### Message Sending
- `POST /api/sms-marketing/send-dlt` - Send SMS using a DLT template with variable substitution

**Request Format for Sending DLT Messages:**
```json
{
  "template_id": "uuid-of-dlt-template",
  "variable_values": {
    "var1": "2BHK Apartment",
    "var2": "₹50,00,000",
    "var3": "9876543210"
  },
  "client_ids": ["client-uuid-1", "client-uuid-2"]
}
```

### Task 3: Frontend UI Components

#### 1. Enhanced Send Message Tab
Located at: `frontend/src/pages/SMSMarketing/Tabs/SendMessageTab.tsx`

**Features:**
- **Dual Mode:** Toggle between "Manual Message" and "DLT Template" modes
- **Manual Mode:** Traditional free-text SMS composer
- **DLT Template Mode:** 
  - Displays all active/approved DLT templates as cards
  - Shows template content, type, status, and variable count
  - Click a template to open the variable configuration modal

#### 2. DLT Template Selection & Variable Configuration Modal
Located at: `frontend/src/pages/SMSMarketing/Components/SendDLTMessageModal.tsx`

**Features:**
- **Left Column:**
  - Live template preview with variable substitution
  - Variable input fields (dynamically generated based on variable_count)
  - Real-time preview updates as values are entered
  
- **Right Column:**
  - Client selection with search functionality
  - Multi-select checkboxes
  - Select All/Deselect All functionality

- **Smart Variable Replacement:**
  - Replaces {#var#} or {#alp#} placeholders with user-provided values
  - Validates that all variables are filled before sending
  - Shows preview of the final message

#### 3. DLT Template Management
Located at: `frontend/src/pages/SMSMarketing/Tabs/TemplatesTab.tsx`

**Features:**
- **Tab-based Interface:**
  - "DLT Templates" tab - Shows regulatory compliant templates
  - "Basic Templates" tab - Shows user-created simple templates
  
- **DLT Template Display:**
  - Template name and content
  - Status badges (color-coded: Active=green, Approved=blue, Registered=yellow, etc.)
  - Template type badge (Promotional/Service)
  - Header, Template ID, Variable count, Provider info
  - Delete functionality

#### 4. Add DLT Template Modal
Located at: `frontend/src/pages/SMSMarketing/Components/AddDLTTemplateModal.tsx`

**Features:**
- Form fields for all DLT template properties
- Automatic variable counting from template content
- Real-time variable detection (counts {#var#} patterns)
- Validation for required fields
- Sample content input for reference

## Workflow

### Adding a DLT Template
1. Broker navigates to SMS Marketing → Templates tab
2. Clicks "Add DLT Template" button
3. Fills in the form:
   - Header/Entity ID (from telecom provider)
   - Template ID (from DLT registration)
   - Template Name (friendly name)
   - Template Type (Promotional/Service)
   - Provider (MSG91/Fast2SMS/JIO)
   - Template Content (with {#var#} placeholders)
   - Sample Content (optional)
   - Status (typically "Active" or "Approved")
4. System auto-detects and counts variables
5. Template is saved to database

### Sending SMS Using DLT Template
1. Broker navigates to SMS Marketing → Send tab
2. Clicks "DLT Template" mode toggle
3. Browses available templates and clicks on desired template
4. Modal opens with template preview
5. Broker fills in variable values (e.g., property details, price, contact)
6. Preview updates in real-time showing final message
7. Broker selects recipients from client list
8. Clicks "Send to X recipient(s)"
9. System:
   - Validates all variables are filled
   - Replaces placeholders with actual values
   - Sends personalized SMS to each selected client
   - Returns success/failure counts

## Database Migration
Run the migration SQL file to create the table:
```bash
# The migration is automatically run when the backend starts
# Manual execution if needed:
psql -U your_user -d your_database -f backend/create_sms_dlt_templates_table.sql
```

Or the migration is included in `internal/database/connection.go` in `RunSMSMarketingMigrations()` function.

## Variable Substitution Logic
The backend service (`internal/service/sms_marketing_service.go`) implements smart variable replacement:
- Detects {#var#} and {#alp#} patterns in template content
- Replaces in order with provided variable values
- Supports named variables (var1, var2, var3, etc.)
- Validates all variables are provided before sending

## Example Usage

### Example 1: Property Sale Alert
**Template Content:**
```
Property for Sale: {#var#}
Details: ₹{#var#}
Contact: {#var#}
- ENFOR DATA
```

**Variable Values:**
- var1: "2BHK Apartment in Andheri"
- var2: "75,00,000"
- var3: "9876543210"

**Final SMS:**
```
Property for Sale: 2BHK Apartment in Andheri
Details: ₹75,00,000
Contact: 9876543210
- ENFOR DATA
```

### Example 2: Rent Property Alert
**Template Content:**
```
Property for Rent: {#var#}
Details: ₹{#var#}/month
Contact: {#var#}
- ENFOR DATA
```

**Variable Values:**
- var1: "3BHK Flat in Bandra"
- var2: "50,000"
- var3: "9123456789"

**Final SMS:**
```
Property for Rent: 3BHK Flat in Bandra
Details: ₹50,000/month
Contact: 9123456789
- ENFOR DATA
```

## Files Modified/Created

### Backend
- ✅ `backend/internal/models/sms_marketing.go` - Added SMSDLTTemplate model
- ✅ `backend/internal/dto/dlt_template_dto.go` - Created DTO types
- ✅ `backend/internal/repository/sms_marketing_repository.go` - Added DLT template repository methods
- ✅ `backend/internal/service/sms_marketing_service.go` - Added DLT template service methods
- ✅ `backend/internal/handler/sms_marketing_handler.go` - Added DLT template handler endpoints
- ✅ `backend/cmd/api/main.go` - Registered DLT template routes
- ✅ `backend/internal/database/connection.go` - Added DLT table migration
- ✅ `backend/create_sms_dlt_templates_table.sql` - Standalone migration file

### Frontend
- ✅ `frontend/src/services/smsMarketingApi.ts` - Added DLT template API functions and types
- ✅ `frontend/src/pages/SMSMarketing/Tabs/SendMessageTab.tsx` - Enhanced with DLT template mode
- ✅ `frontend/src/pages/SMSMarketing/Tabs/TemplatesTab.tsx` - Added DLT template management tab
- ✅ `frontend/src/pages/SMSMarketing/Components/AddDLTTemplateModal.tsx` - Created modal for adding DLT templates
- ✅ `frontend/src/pages/SMSMarketing/Components/SendDLTMessageModal.tsx` - Created modal for sending with variables

## Testing

### Backend Testing
```bash
cd backend
go build -o api.exe ./cmd/api
# Backend builds successfully ✓
```

### API Testing Examples

**1. Create DLT Template:**
```bash
curl -X POST http://localhost:8080/api/sms-marketing/dlt-templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "header": "202603",
    "template_id": "1277178600920660252",
    "template_name": "SalePropertyAlert",
    "template_type": "Promotional",
    "provider": "JIO",
    "template_content": "Property for Sale: {#var#}\nDetails: ₹{#var#}\nContact: {#var#}\n- ENFOR DATA",
    "status": "Active",
    "variable_count": 3
  }'
```

**2. List DLT Templates:**
```bash
curl -X GET http://localhost:8080/api/sms-marketing/dlt-templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. Send DLT Message:**
```bash
curl -X POST http://localhost:8080/api/sms-marketing/send-dlt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "TEMPLATE_UUID",
    "variable_values": {
      "var1": "2BHK Apartment",
      "var2": "50,00,000",
      "var3": "9876543210"
    },
    "client_ids": ["CLIENT_UUID_1", "CLIENT_UUID_2"]
  }'
```

## Compliance Notes
- DLT (Distributed Ledger Technology) is mandated by TRAI (Telecom Regulatory Authority of India)
- All promotional SMS must use pre-approved templates
- Templates must be registered with telecom operators
- Header/Entity ID must match the sender's registered entity
- Variable placeholders are standardized as {#var#} or {#alp#}

## Benefits
1. **Regulatory Compliance:** Ensures all SMS follow DLT guidelines
2. **Reusability:** Templates can be reused multiple times
3. **Personalization:** Variable substitution allows personalized messages
4. **Consistency:** Standardized message format across all communications
5. **Audit Trail:** All templates and sends are logged in the database
6. **Flexibility:** Support for multiple providers (MSG91, Fast2SMS, JIO)

## Future Enhancements
- Bulk import of DLT templates from Excel/CSV
- Template analytics (usage statistics, conversion rates)
- Variable validation (phone number format, price range, etc.)
- Template versioning
- Scheduled sends with DLT templates
- A/B testing for different template variations
