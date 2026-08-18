# Client Requirements Excel Upload/Download Feature

## Summary
Added Excel upload and download functionality to the Client Requirements section, matching the pattern already implemented in the Properties section.

## Changes Made

### Backend Changes

#### 1. Updated `backend/internal/handler/upload_handler.go`
- **Added imports**: `models` and `repository` packages
- **Updated UploadHandler struct**: Added `clientRequirementRepo *repository.ClientRequirementRepository`
- **Updated NewUploadHandler constructor**: Added `clientRequirementRepo` parameter
- **Added new function**: `UploadClientRequirementsExcel(c *gin.Context)`
  - Handles bulk upload of client requirements from Excel files
  - Validates file size and format
  - Parses Excel rows and creates client requirements
  - Skips blank rows, description rows, and example rows
  - Returns summary with created count and error list
- **Added new function**: `DownloadClientRequirementsSample(c *gin.Context)`
  - Generates Excel template with proper headers
  - Includes description row with field requirements
  - Adds example data row
  - Creates INSTRUCTIONS sheet with detailed column guide
  - Adds dropdowns for requirement_type, measurement_unit, and status fields
- **Added helper function**: `createClientRequirementFromExcel(req *dto.CreateClientRequirementRequest, userID string)`
  - Converts DTO to model and saves to database

#### 2. Updated `backend/cmd/api/main.go`
- **Updated uploadHandler initialization**: Added `clientRequirementRepo` parameter
- **Added route**: `POST /api/upload/client-requirements-excel` (protected)
- **Added route**: `GET /api/download/client-requirements-sample` (public)

### Frontend Changes

#### 1. Updated `frontend/src/services/api.ts`
- **Added method**: `uploadClientRequirementsExcel(file: File): Promise<ApiResponse>`
  - Uploads Excel file for bulk client requirements import

#### 2. Updated `frontend/src/pages/ClientRequirements/ClientRequirementsView.tsx`
- **Added imports**: `apiClient` and `API_CONFIG`
- **Added state variables**:
  - `uploading`: tracks upload progress
  - `uploadError`: displays upload errors
  - `uploadSuccess`: displays success messages
- **Added function**: `handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>)`
  - Handles file selection and upload
  - Shows success/error messages
  - Reloads requirements after successful upload
- **Updated UI**:
  - Moved header content to flex layout for better button placement
  - Added "Download Sample Excel" button (right side of header)
  - Added "Upload Excel" button with file input (right side of header)
  - Added error/success message display area above filters
  - Upload button shows "Uploading..." state when processing

## Excel Template Structure

### Columns (15 total)
1. **client_id** (Required): Existing client UUID
2. **requirement_type** (Required): buy|rent
3. **buildup_area** (Optional): Integer value
4. **carpet_area** (Optional): Integer value
5. **measurement_unit** (Optional): sq_foot|sq_meter|acre|guntha
6. **min_budget** (Optional): Numeric value
7. **max_budget** (Optional): Numeric value
8. **deposit_budget** (Optional): Numeric value
9. **preferred_location** (Optional): Text
10. **city** (Optional): Text
11. **state** (Optional): Text
12. **postal_code** (Optional): Text
13. **enquiry** (Optional): Text (e.g., "2 BHK Apartment")
14. **notes** (Optional): Text
15. **status** (Optional): active|fulfilled|cancelled (default: active)

### Features
- Row 1: Headers
- Row 2: Field descriptions
- Row 3: Example data
- Dropdown validation for requirement_type, measurement_unit, and status
- Separate INSTRUCTIONS sheet with detailed column guide
- Auto-filters and formatted headers

## API Endpoints

### Upload Client Requirements Excel
```
POST /api/upload/client-requirements-excel
Headers: Authorization: Bearer <token>
Body: multipart/form-data with 'file' field
Response: {
  "message": "Client requirements processed",
  "data": {
    "created": 10,
    "errors": ["row 5: invalid client_id"]
  }
}
```

### Download Sample Excel
```
GET /api/download/client-requirements-sample
Response: Excel file download (client_requirements_sample.xlsx)
```

## Validation Rules

### Upload Processing
- Skips blank rows (all key fields empty)
- Skips description rows (contain "required:" or "optional:")
- Skips example rows (client_id = "abc123")
- Validates client_id exists and belongs to the broker
- Defaults status to "active" if not specified
- Converts requirement_type to lowercase
- Converts measurement_unit to lowercase
- Validates numeric fields (areas, budgets)

### Field Types
- **client_id**: String (UUID)
- **requirement_type**: String enum (buy, rent)
- **buildup_area, carpet_area**: Integer (nullable)
- **measurement_unit**: String enum (sq_foot, sq_meter, acre, guntha) (nullable)
- **min_budget, max_budget, deposit_budget**: Float64 (nullable)
- **preferred_location, city, state, postal_code, enquiry, notes**: String (nullable)
- **status**: String enum (active, fulfilled, cancelled) with default "active"

## Testing Checklist

### Backend
- ✅ Go build successful (no compilation errors)
- ⬜ Upload empty file (should return error)
- ⬜ Upload file with only headers (should return error)
- ⬜ Upload file with valid data (should create requirements)
- ⬜ Upload file with invalid client_id (should log errors)
- ⬜ Download sample (should return properly formatted Excel)

### Frontend
- ✅ TypeScript build successful (no compilation errors)
- ⬜ Click "Download Sample Excel" (should download file)
- ⬜ Click "Upload Excel" without file (should do nothing)
- ⬜ Upload valid Excel file (should show success message and reload list)
- ⬜ Upload invalid file (should show error message)
- ⬜ Upload button disabled during upload (should show "Uploading...")
- ⬜ Success message auto-dismisses after 3 seconds
- ⬜ Error message auto-dismisses after 5 seconds

## Files Modified

### Backend (3 files)
1. `backend/internal/handler/upload_handler.go` - Added upload/download handlers
2. `backend/cmd/api/main.go` - Added routes and updated handler initialization
3. `backend/internal/dto/client_requirement_dto.go` - Already had required DTOs (no changes needed)

### Frontend (2 files)
1. `frontend/src/services/api.ts` - Added upload method
2. `frontend/src/pages/ClientRequirements/ClientRequirementsView.tsx` - Added UI buttons and upload logic

## Dependencies
- **Backend**: Uses existing `github.com/xuri/excelize/v2` package
- **Frontend**: Uses existing `API_CONFIG` and `apiClient`

## Notes
- Feature mirrors the existing Properties Excel upload/download functionality
- Uses the same upload handler pattern and file validation
- Consistent error handling and user feedback
- Sample Excel includes comprehensive instructions sheet
- All changes are backward compatible
