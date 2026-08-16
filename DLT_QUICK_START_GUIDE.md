# DLT SMS Template System - Quick Start Guide

## What is DLT?
DLT (Distributed Ledger Technology) is a regulatory framework mandated by TRAI in India. It requires all commercial SMS to use pre-approved templates registered with telecom operators.

## Setup Instructions

### 1. Database Setup
The database table is automatically created when you start the backend. The migration runs on startup.

### 2. Start the Application
```bash
# Backend
cd backend
./api.exe

# Frontend (in another terminal)
cd frontend
npm run dev
```

## User Guide

### Adding a DLT Template

1. **Navigate to SMS Marketing**
   - Go to SMS Marketing section from the sidebar

2. **Open Templates Tab**
   - Click on the "Templates" tab
   - You'll see two sub-tabs: "DLT Templates" and "Basic Templates"

3. **Add New DLT Template**
   - Click "Add DLT Template" button
   - Fill in the form:
     ```
     Header: 202603
     Template ID: 1277178600920660252
     Template Name: SalePropertyAlert
     Template Type: Promotional
     Provider: JIO (or MSG91, Fast2SMS)
     Template Content: 
       Property for Sale: {#var#}
       Details: ₹{#var#}
       Contact: {#var#}
       - ENFOR DATA
     Sample Content: (optional)
       Property for Sale: 2BHK Apartment
       Details: ₹50,00,000
       Contact: 9876543210
       - ENFOR DATA
     Status: Active
     ```
   - System will auto-detect 3 variables
   - Click "Add Template"

### Sending SMS with DLT Template

1. **Go to Send Tab**
   - Click on "Send Message" tab

2. **Switch to DLT Template Mode**
   - Click the "DLT Template" button (shows count of available templates)

3. **Select Template**
   - Browse the available templates
   - Click on the template card you want to use

4. **Configure Variables**
   - A modal will open showing:
     - Template preview on the left
     - Variable input fields
     - Client selection on the right
   
5. **Fill Variable Values**
   - Variable 1 (VAR): "3BHK Apartment in Andheri"
   - Variable 2 (VAR): "75,00,000"
   - Variable 3 (VAR): "9876543210"
   - Watch the preview update in real-time!

6. **Select Recipients**
   - Search for clients by name or phone
   - Check the boxes for clients you want to send to
   - Or click "Select All" to choose everyone

7. **Send**
   - Click "Send to X recipient(s)" button
   - Wait for confirmation showing success/failed counts

## Example Templates from Your Excel File

### Template 1: Sale Property Alert
```
Header: 202603
Template ID: 1277178600920660252
Name: SalePropertyAlert
Type: Promotional
Provider: JIO
Content:
Property for Sale: {#var#}
Details: ₹{#var#}
Contact: {#var#}
- ENFOR DATA
```

### Template 2: Rent Property Alert
```
Header: 202603
Template ID: 1277178600009441768
Name: RentPropertyAlert
Type: Promotional
Provider: JIO
Content:
Property for Rent: {#var#}
Details: ₹{#var#}
Contact: {#var#}
- ENFOR DATA
```

## Variable Syntax
- Use `{#var#}` or `{#alp#}` for placeholders
- Variables are replaced in order (var1, var2, var3, etc.)
- Number of variables is auto-detected

## Tips & Best Practices

1. **Template Status**
   - Use "Active" for templates ready to send
   - Use "Approved" for templates pending activation
   - Use "Inactive" to temporarily disable a template

2. **Variable Values**
   - Keep them concise to fit in SMS length (160 chars/SMS)
   - Include currency symbols directly: ₹50,00,000
   - Include property details: "2BHK, 1000 sqft, Andheri West"

3. **Testing**
   - Test templates with a single client first
   - Verify the preview before sending
   - Check message length (preview doesn't show SMS count)

4. **Provider Selection**
   - Match the provider with your actual SMS provider
   - Template ID and Header must match your DLT registration
   - Different providers may have different approval processes

## Troubleshooting

### "Template is not active" error
- Check the template status in Templates tab
- Only "Active" or "Approved" templates can be used
- Edit the template and set status to "Active"

### Variables not replacing
- Ensure variable count matches placeholders
- Fill all variable fields (none should be empty)
- Variable format must be {#var#} or {#alp#}

### No templates showing in Send tab
- Check Templates tab → DLT Templates
- Ensure at least one template has status "Active" or "Approved"
- Refresh the page

## API Reference (for developers)

### Get DLT Templates
```
GET /api/sms-marketing/dlt-templates
Authorization: Bearer {token}
```

### Create DLT Template
```
POST /api/sms-marketing/dlt-templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "header": "202603",
  "template_id": "1277178600920660252",
  "template_name": "SalePropertyAlert",
  "template_type": "Promotional",
  "provider": "JIO",
  "template_content": "Property for Sale: {#var#}\\nDetails: ₹{#var#}\\nContact: {#var#}\\n- ENFOR DATA",
  "status": "Active",
  "variable_count": 3
}
```

### Send DLT Message
```
POST /api/sms-marketing/send-dlt
Authorization: Bearer {token}
Content-Type: application/json

{
  "template_id": "uuid-of-template",
  "variable_values": {
    "var1": "2BHK Apartment",
    "var2": "50,00,000",
    "var3": "9876543210"
  },
  "client_ids": ["client-uuid-1", "client-uuid-2"]
}
```

## Compliance Checklist
- ✅ All templates registered with telecom operator
- ✅ Header/Entity ID matches registered entity
- ✅ Template content matches approved DLT template exactly
- ✅ Only approved variables are used
- ✅ Message includes mandated sender identification
- ✅ Promotional SMS sent only to consented numbers

## Support
For issues or questions about the DLT template system, check:
1. This guide
2. SMS_DLT_TEMPLATE_IMPLEMENTATION.md (technical details)
3. Backend logs for error messages
4. Browser console for frontend errors
