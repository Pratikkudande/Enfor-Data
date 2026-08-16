# Multi-Type Client Implementation

## Overview
Implemented support for clients to have multiple types (buyer, seller, tenant, property owner) simultaneously. This allows tracking when a client transitions from one role to another (e.g., seller becomes buyer) or holds multiple roles at once.

## Database Changes

### New Table: `client_types`
Created a new table to store multiple types per client:
- `id` (UUID, primary key)
- `client_id` (UUID, foreign key to clients table)
- `type` (VARCHAR, one of: buyer, seller, tenant, list_property_for_rent)
- `created_at` (TIMESTAMP)
- Unique constraint on (client_id, type)

**Migration File**: `backend/create_client_types_table.sql`

The existing `clients.type` column is maintained for backward compatibility and represents the primary/latest type.

## Backend Changes

### 1. Models (`backend/internal/models/client.go`)
- Added `Types []string` field to `Client` struct
- Added `Types []string` field to `ClientOption` struct
- Created new `ClientType` struct to represent type assignments

### 2. DTOs (`backend/internal/dto/client_dto.go`)
- `CreateClientRequest`: Added `Types []string` field (optional, alongside single `Type`)
- `UpdateClientRequest`: Added `Types []string` field (optional)

### 3. Repository (`backend/internal/repository/client_repository.go`)
- Added `GetClientTypes(clientID)` - retrieves all types for a client
- Added `SetClientTypes(clientID, types)` - replaces all types for a client
- Updated `Create()` - now inserts types into `client_types` table within transaction
- Updated `Update()` - now updates types in `client_types` table within transaction
- Updated `GetByID()`, `GetByBrokerID()`, `GetOptionsByBrokerID()` - now fetch and populate types array

### 4. Service (`backend/internal/service/client_service.go`)
- Updated `CreateClient()`:
  - Accepts either `Type` (single) or `Types` (array)
  - Uses first type as primary type
  - Requires at least one type
- Updated `UpdateClient()`:
  - Handles both single type and multiple types updates
  - When single type is provided, adds it to existing types if not present
  - When types array is provided, replaces all types
  - Sets the most recent type as primary

### 5. Handler (`backend/internal/handler/client_handler.go`)
No changes required - automatically handles new fields through DTO binding

## Frontend Changes

### 1. Types (`frontend/src/types/index.ts`)
- Updated `Client` interface: Added `types?: string[]`
- Updated `ClientOption` interface: Added `types?: string[]`
- Updated `CreateClientRequest`: Made `type` optional, added `types?: string[]`
- Updated `UpdateClientRequest`: Added `types?: string[]`

### 2. ClientForm Component (`frontend/src/pages/Clients/ClientForm.tsx`)
- Added `selectedClientTypes?: string[]` prop
- Added `onTypesChange?: (types: string[]) => void` callback
- Added `types?: string[]` to `ClientFormData` interface
- Implemented multi-select type toggle functionality
- Updated UI to show multiple selected types with visual badges
- Budget fields now show when ANY type is buyer or tenant

### 3. ClientsView Component (`frontend/src/pages/Clients/ClientsView.tsx`)
- Added `selectedClientTypes` state (array)
- Updated `resetFormState()` to initialize with `['buyer']`
- Updated `openEditModal()` to load client types from API
- Updated `handleCancelEdit()` to restore original types
- Updated `handleFormSubmit()` to send `types` array to API
- Pass `selectedClientTypes` and `onTypesChange` to ClientForm

### 4. ClientCard Component (`frontend/src/pages/Clients/ClientCard.tsx`)
- Updated to display multiple type badges
- Falls back to single type if types array not available

## Usage Examples

### Creating a Client with Multiple Types
```json
POST /api/clients
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9876543210",
  "types": ["buyer", "seller"],
  "budget_min": 5000000,
  "budget_max": 8000000
}
```

### Updating Client Types
```json
PUT /api/clients/{id}
{
  "types": ["buyer", "seller", "tenant"]
}
```

### Response Format
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "type": "tenant",
  "types": ["buyer", "seller", "tenant"],
  ...
}
```

## Migration Instructions

1. **Database Migration**:
   ```bash
   psql -d your_database -f backend/create_client_types_table.sql
   ```

2. **Backend**: 
   - Rebuild the Go application
   - No code changes required for existing API consumers

3. **Frontend**:
   - Rebuild the React application
   - Existing clients will show single type until updated

## Backward Compatibility

- The `type` field is maintained for backward compatibility
- Clients without types array will display single type
- API accepts both `type` (single) and `types` (array)
- Existing API consumers continue to work without changes

## UI Features

1. **Multi-Select Type Buttons**: Users can select multiple types when adding/editing clients
2. **Type History**: All types a client has held are preserved in the database
3. **Visual Badges**: Multiple type badges display on client cards
4. **Smart Budget Fields**: Show budget fields if ANY selected type needs them

## Business Logic

1. **Primary Type**: The last type in the types array is considered primary
2. **Type Addition**: Adding a new type preserves existing types
3. **Type Replacement**: Sending types array replaces all types
4. **Minimum Requirement**: At least one type must be selected
