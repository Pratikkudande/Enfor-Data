# Property Selection for SMS Marketing - Implementation Summary

## Overview
This feature allows brokers to select properties from their inventory and automatically generate SMS messages with property details (Bedrooms, Type, Location, Price, Area, Contact) using DLT templates.

## Key Features

### 1. **Property Selection Button**
- Added "Select Property" button next to "Add Another Message" in the SMS compose screen
- Opens a modal with property listing and checkboxes

### 2. **Smart Property Filtering**
- **FOR_SALE** template category → Shows only properties with `listing_type = 'sale'`
- **FOR_RENT** or **LIST_FOR_RENT** template category → Shows only properties with `listing_type = 'rent'`
- Search functionality by title, location, or property type

### 3. **Auto-Variable Mapping**
When properties are selected and submitted, SMS variables are automatically populated:
- **VAR1**: Bedrooms + Property Type + Location (e.g., "2 BHK Apartment, Hinjewadi")
- **VAR2**: Price + Area (e.g., "₹45 Lakh, 850 Sq.Ft.")
- **VAR3**: Firm Name + Contact Number (e.g., "ABC Realty - 9876543210")

### 4. **Message Templates**
- Property messages are added to the Message Templates section
- Each property gets its own message template with auto-filled variables
- Property messages are visually distinguished with an indigo theme and property title
- Can be individually removed or edited

### 5. **Recipient Selection**
- Messages are sent to the client associated with the property
- Property must have a `client_id` and valid phone number to send SMS

## Backend Changes

### Files Modified

#### 1. `backend/internal/handler/sms_marketing_handler.go`
```go
// Added property_ids support to SendDLTMessage endpoint
var req struct {
    TemplateID          string            `json:"template_id" binding:"required"`
    VariableValues      map[string]string `json:"variable_values"`
    ClientIDs           []string          `json:"client_ids"`
    BuildingContactIDs  []string          `json:"building_contact_ids"`
    PropertyIDs         []string          `json:"property_ids"` // NEW
}
```

#### 2. `backend/internal/service/sms_marketing_service.go`
- Added `propertyRepo *repository.PropertyRepository` to SMSMarketingService struct
- Updated `NewSMSMarketingService` constructor to accept propertyRepo
- Updated `SendDLTMessage` function signature to accept `propertyIDs []string`
- Added `mapPropertyToVariables` function to auto-generate SMS variables from property data
- Implemented property SMS sending logic with automatic variable mapping

#### 3. `backend/cmd/api/main.go`
```go
// Updated service initialization
smsMarketingService := service.NewSMSMarketingService(
    smsMarketingRepo, 
    clientRepo, 
    buildingRepo, 
    propertyRepo, // NEW
    smsService, 
    cfg
)
```

## Frontend Changes

### Files Modified

#### 1. `frontend/src/services/smsMarketingApi.ts`
```typescript
export interface SendDLTMessageRequest {
  template_id: string;
  variable_values: Record<string, string>;
  client_ids: string[];
  building_contact_ids?: string[];
  property_ids?: string[]; // NEW
}
```

#### 2. `frontend/src/pages/SMSMarketing/Components/SendDLTMessageModal.tsx`
Major updates:
- Added property state management
- Added `tempSelectedProperties` for modal selection
- Added `propertyId` and `propertyTitle` fields to MessageTemplate interface
- Implemented property selection modal with search and filtering
- Added auto-variable mapping logic for properties
- Updated send logic to handle property-specific messages
- Added visual distinction for property messages (indigo theme)
- Implemented property selection workflow:
  1. Click "Select Property" button
  2. Search and select properties in modal
  3. Click "Submit" to add property messages
  4. Variables auto-fill for each property
  5. Messages appear in Message Templates section

## User Workflow

### Step-by-Step Process

1. **Select Template**
   - Broker selects a DLT template (e.g., "PropertyAlert - RentProperty")

2. **Select Recipients (Optional)**
   - Can select clients, building contacts, or skip this step

3. **Add Manual Messages (Optional)**
   - Click "Add Another Message" to create manual messages with custom variables

4. **Select Properties**
   - Click "Select Property" button (indigo, dashed border)
   - Property selection modal opens
   - Properties are filtered based on template category:
     - FOR_SALE → Only sale properties shown
     - FOR_RENT → Only rent properties shown
   - Search properties by title, location, or type
   - Select multiple properties using checkboxes
   - Click "Submit" with count (e.g., "Submit (3 selected)")

5. **Review Generated Messages**
   - Each selected property appears as a separate message template
   - Variables are automatically filled:
     - VAR1: "2 BHK Apartment, Hinjewadi"
     - VAR2: "₹45.00 Lakh, 850 Sq.Ft."
     - VAR3: "ABC Realty - 9876543210"
   - Property messages have an indigo theme header
   - Shows property title in the header
   - Can remove individual property messages

6. **Send SMS**
   - Click "Send" button
   - System sends:
     - Manual messages to selected clients/building contacts
     - Property-specific messages to property clients
   - Success/failure count displayed

## Example Use Case

**Scenario**: Send rent property alerts

1. Select template: "RentProperty" (category: FOR_RENT)
2. Click "Select Property"
3. Modal shows only rental properties
4. Select 3 properties:
   - 2 BHK Apartment in Hinjewadi
   - 3 BHK House in Baner
   - 1 BHK PG in Kothrud
5. Click "Submit (3 selected)"
6. Three message templates appear with auto-filled details
7. Click "Send 3 message(s) to 3 recipient(s)"
8. SMS sent to clients associated with each property

## Benefits

1. **Time-Saving**: No manual variable entry for properties
2. **Consistency**: Standardized format for all property messages
3. **Accuracy**: Data pulled directly from property records
4. **Bulk Operations**: Select multiple properties at once
5. **Smart Filtering**: Only relevant properties shown based on template
6. **Flexible**: Mix manual and property messages in same campaign

## Technical Notes

- Property must have a `client_id` with valid phone number to send SMS
- Variables are auto-generated from property model fields
- Backend validates ownership (broker can only send SMS for their properties)
- Frontend provides real-time preview of generated messages
- Rate limiting: 1 SMS per second (handled by backend)

## Future Enhancements

Potential improvements:
- Allow sending to multiple contacts per property
- Custom variable mapping per template
- Bulk edit property messages before sending
- Save property message templates for reuse
- Analytics for property SMS campaigns
- WhatsApp integration for property messages
