# Building Data SMS Integration

## Overview
Added "Building Data" as a separate contact category in the SMS marketing system. Building Data contacts (building owners) are now available for SMS campaigns alongside client types (Buyer, Seller, Tenant, Property Owner), but they are maintained as a separate entity and not mixed with regular clients.

## Changes Made

### Frontend Changes

#### 1. SendDLTMessageModal Component (`frontend/src/pages/SMSMarketing/Components/SendDLTMessageModal.tsx`)

**New Imports:**
- Added `buildingApi` and `BuildingContact` from `../../services/buildingApi`

**New State Variables:**
- `buildingContacts: BuildingContact[]` - Stores all building contacts
- `selectedBuildingContacts: string[]` - Tracks selected building contact IDs
- Updated `clientTypeFilter` to include `'building_data'` option

**New Functions:**
- `loadBuildingContacts()` - Fetches building contacts from API
- `handleSelectBuildingContact(contactId)` - Handles building contact selection
- `filteredBuildingContacts` - Filters building contacts based on search term

**UI Updates:**
- Added "Building Data" filter button (orange color scheme)
- Updated recipient list to show building contacts when filter is active
- Building contacts display:
  - Owner name or building name
  - Mobile number
  - Area (if available)
  - Orange "Building Data" badge
- Separate selection logic for building contacts vs clients
- Updated "Select All" to work with both contact types
- Updated recipient count in header to show combined total
- Updated send button to show combined recipient count

**Filter Behavior:**
- "All" - Shows clients only (not building data)
- "Buyer/Seller/Tenant/Property Owner" - Shows respective client types
- "Building Data" - Shows only building contacts, hides all clients

#### 2. SMS Marketing API (`frontend/src/services/smsMarketingApi.ts`)

**Interface Update:**
```typescript
export interface SendDLTMessageRequest {
  template_id: string;
  variable_values: Record<string, string>;
  client_ids: string[];
  building_contact_ids?: string[];  // NEW: Support for building contacts
}
```

### Backend Requirements

The backend needs to be updated to handle the `building_contact_ids` field in the SMS sending endpoint:

**Endpoint**: `POST /sms-marketing/send-dlt`

**Expected Request Body:**
```json
{
  "template_id": "uuid",
  "variable_values": {
    "var1": "value1",
    "var2": "value2"
  },
  "client_ids": ["client-uuid-1", "client-uuid-2"],
  "building_contact_ids": ["building-uuid-1", "building-uuid-2"]
}
```

**Backend Handler Changes Needed:**
1. Accept `building_contact_ids` array in the request
2. Fetch building contacts by IDs from `building_contacts` table
3. Extract mobile numbers from both clients and building contacts
4. Send SMS to all collected phone numbers
5. Return combined success/failure count

## User Experience

### Selecting Recipients

1. **Filter by Type**: Users can now click "Building Data" button to view building contacts
2. **Search**: Search works across owner names, building names, mobile numbers, and area
3. **Select**: Checkbox selection works independently for clients and building contacts
4. **Select All**: When on "Building Data" filter, selects all building contacts
5. **Mixed Selection**: Users can select clients AND building contacts in the same campaign by:
   - Selecting clients from various type filters
   - Switching to "Building Data" and selecting building contacts
   - Both selections are preserved

### Visual Indicators

- **Building Data Badge**: Orange color (`bg-orange-100 text-orange-700`)
- **Recipient Count**: Shows combined total of clients + building contacts
- **Send Button**: Displays total recipients from both sources

## Benefits

1. **Separation of Concerns**: Building owner contacts remain separate from client records
2. **Targeted Marketing**: Can send campaigns specifically to building owners
3. **Combined Campaigns**: Can send to mixed groups (clients + building owners)
4. **No Data Mixing**: Building data doesn't clutter client management
5. **Dedicated Management**: Building Data has its own CRUD interface

## Example Use Cases

1. **Property Owners Only**: Filter "Building Data", select all, send marketing message
2. **Buyers + Building Owners**: Select buyers, then switch to building data and select owners
3. **Specific Buildings**: Search for building name, select matching contacts
4. **Area-Based Campaigns**: Search by area in building data filter

## Testing Checklist

- [ ] Building contacts load when modal opens
- [ ] "Building Data" filter shows only building contacts
- [ ] Search works across owner name, building name, mobile, area
- [ ] Checkbox selection works for building contacts
- [ ] "Select All" works in Building Data mode
- [ ] Recipient count includes both clients and building contacts
- [ ] Send button enables only when recipients selected
- [ ] SMS sends to both client and building contact phone numbers
- [ ] Success/failure counts are accurate for combined recipients
