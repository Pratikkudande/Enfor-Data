package handler

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type UploadHandler struct {
	authService *service.AuthService
	config      *config.Config
	clientSvc   *service.ClientService
	propertySvc *service.PropertyService
	buildingSvc *service.BuildingService
}

func NewUploadHandler(authService *service.AuthService, cfg *config.Config, clientSvc *service.ClientService, propertySvc *service.PropertyService, buildingSvc *service.BuildingService) *UploadHandler {
	return &UploadHandler{
		authService: authService,
		config:      cfg,
		clientSvc:   clientSvc,
		propertySvc: propertySvc,
		buildingSvc: buildingSvc,
	}
}

// UploadClientsExcel handles bulk client Excel uploads
func (h *UploadHandler) UploadClientsExcel(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No file provided", Message: "Please attach an Excel file"})
		return
	}
	defer file.Close()

	if header.Size > h.config.Upload.MaxFileSize {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "File too large", Message: fmt.Sprintf("File size must be less than %d MB", h.config.Upload.MaxFileSize/1024/1024)})
		return
	}

	// Read file into buffer
	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to read file", Message: err.Error()})
		return
	}

	f, err := excelize.OpenReader(bytes.NewReader(buf.Bytes()))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid Excel file", Message: err.Error()})
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Empty Excel file"})
		return
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Failed to read rows", Message: err.Error()})
		return
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No data rows found"})
		return
	}

	headerRow := rows[0]
	colIndex := map[string]int{}
	for i, hname := range headerRow {
		colIndex[strings.ToLower(strings.TrimSpace(hname))] = i
	}

	created := 0
	duplicates := 0
	errorsList := []string{}

	for r := 1; r < len(rows); r++ {
		row := rows[r]
		// Skip empty rows
		if len(row) == 0 {
			continue
		}

		get := func(key string) string {
			idx, ok := colIndex[key]
			if !ok || idx >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[idx])
		}

		firstName := get("first_name")
		lastName := get("last_name")
		email := get("email")
		phone := get("phone")
		clientType := get("type")

		// 1. Skip blank rows
		if firstName == "" && lastName == "" && email == "" && phone == "" {
			continue
		}

		// 2. Skip description rows (contain "Required:" or "Optional:")
		if strings.Contains(strings.ToLower(firstName), "required:") || strings.Contains(strings.ToLower(firstName), "optional:") ||
			strings.Contains(strings.ToLower(clientType), "required:") {
			continue
		}

		// 3. Skip example rows
		if firstName == "Ramesh" && lastName == "Kumar" {
			continue
		}

		var req dto.CreateClientRequest
		req.FirstName = firstName
		req.LastName = lastName
		req.Email = email
		req.Phone = phone
		req.Type = strings.ToLower(strings.TrimSpace(clientType))
		req.PreferredLocation = get("preferred_location")
		req.City = get("city")
		req.State = get("state")
		req.PostalCode = get("postal_code")

		if v := get("budget_min"); v != "" {
			if f64, err := strconv.ParseFloat(v, 64); err == nil {
				req.BudgetMin = &f64
			}
		}
		if v := get("budget_max"); v != "" {
			if f64, err := strconv.ParseFloat(v, 64); err == nil {
				req.BudgetMax = &f64
			}
		}

		// Attempt create
		if _, err := h.clientSvc.CreateClient(&req, userID.(string)); err != nil {
			// Separate duplicate errors from other errors for clearer reporting
			if strings.Contains(err.Error(), "already exists") {
				duplicates++
			} else {
				errorsList = append(errorsList, fmt.Sprintf("row %d: %v", r+1, err))
			}
			continue
		}
		created++
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Clients processed",
		Data: gin.H{
			"created":    created,
			"duplicates": duplicates,
			"errors":     errorsList,
		},
	})
}

// UploadPropertiesExcel handles bulk property Excel uploads
func (h *UploadHandler) UploadPropertiesExcel(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No file provided", Message: "Please attach an Excel file"})
		return
	}
	defer file.Close()

	if header.Size > h.config.Upload.MaxFileSize {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "File too large", Message: fmt.Sprintf("File size must be less than %d MB", h.config.Upload.MaxFileSize/1024/1024)})
		return
	}

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to read file", Message: err.Error()})
		return
	}

	f, err := excelize.OpenReader(bytes.NewReader(buf.Bytes()))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid Excel file", Message: err.Error()})
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Empty Excel file"})
		return
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Failed to read rows", Message: err.Error()})
		return
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No data rows found"})
		return
	}

	headerRow := rows[0]
	colIndex := map[string]int{}
	for i, hname := range headerRow {
		colIndex[strings.ToLower(strings.TrimSpace(hname))] = i
	}

	created := 0
	errorsList := []string{}
	seenProperties := make(map[string]bool)

	for r := 1; r < len(rows); r++ {
		row := rows[r]
		if len(row) == 0 { continue }
		get := func(key string) string {
			idx, ok := colIndex[key]
			if !ok || idx >= len(row) { return "" }
			return strings.TrimSpace(row[idx])
		}

		title := get("title")
		propertyType := get("type")
		listingType := get("listing_type")
		location := get("location")
		address := get("address")
		city := get("city")
		state := get("state")

		// 1. Skip blank rows
		if title == "" && location == "" && address == "" {
			continue
		}

		// 2. Skip description rows
		if strings.Contains(strings.ToLower(title), "required:") || strings.Contains(strings.ToLower(propertyType), "required:") {
			continue
		}

		// 3. Skip example rows
		if title == "Nice 2BHK" {
			continue
		}

		// 4. Check duplicate in the same file
		addrKey := fmt.Sprintf("%s|%s|%s", strings.ToLower(address), strings.ToLower(city), strings.ToLower(state))
		if seenProperties[addrKey] {
			errorsList = append(errorsList, fmt.Sprintf("row %d: duplicate property entry in same file", r+1))
			continue
		}
		seenProperties[addrKey] = true

		var req dto.CreatePropertyRequest
		req.Title = title
		req.Type = strings.ToLower(strings.TrimSpace(propertyType))
		req.ListingType = strings.ToLower(strings.TrimSpace(listingType))
		if v := get("price"); v != "" {
			if f64, err := strconv.ParseFloat(v, 64); err == nil { req.Price = f64 }
		}
		if v := get("area"); v != "" {
			if f64, err := strconv.ParseFloat(v, 64); err == nil { req.Area = f64 }
		}
		if v := get("bedrooms"); v != "" {
			if iv, err := strconv.Atoi(v); err == nil { req.Bedrooms = &iv }
		}
		if v := get("bathrooms"); v != "" {
			if iv, err := strconv.Atoi(v); err == nil { req.Bathrooms = &iv }
		}
		req.Location = location
		req.Address = address
		req.City = city
		req.State = state
		req.Description = get("description")
		if v := get("amenities"); v != "" {
			// comma separated
			req.Amenities = strings.Split(v, ",")
		}
		if v := get("client_id"); v != "" {
			req.ClientID = &v
		}

		if _, err := h.propertySvc.CreateProperty(&req, userID.(string)); err != nil {
			errorsList = append(errorsList, fmt.Sprintf("row %d: %v", r+1, err))
			continue
		}
		created++
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Properties processed", Data: gin.H{"created": created, "errors": errorsList}})
}

// UploadPropertyPhotos handles property photo uploads (up to 5 photos)
func (h *UploadHandler) UploadPropertyPhotos(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	propertyID := c.Param("id")
	if propertyID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Property ID is required"})
		return
	}

	// Verify property ownership
	property, err := h.propertySvc.GetPropertyByID(propertyID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Property not found"})
		return
	}

	// Parse multipart form
	err = c.Request.ParseMultipartForm(32 << 20) // 32MB max
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Failed to parse form"})
		return
	}

	files := c.Request.MultipartForm.File["photos"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No photos provided"})
		return
	}

	// Check photo limit (max 5 photos)
	if len(files) > 5 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Maximum 5 photos allowed"})
		return
	}

	var uploadedPhotos []string
	var errors []string

	for i, fileHeader := range files {
		// Check file size (max 5MB per photo)
		if fileHeader.Size > 5*1024*1024 {
			errors = append(errors, fmt.Sprintf("Photo %d: File too large (max 5MB)", i+1))
			continue
		}

		// Check file type
		file, err := fileHeader.Open()
		if err != nil {
			errors = append(errors, fmt.Sprintf("Photo %d: Failed to open file", i+1))
			continue
		}

		// Read first 512 bytes to detect content type
		buffer := make([]byte, 512)
		_, err = file.Read(buffer)
		if err != nil {
			file.Close()
			errors = append(errors, fmt.Sprintf("Photo %d: Failed to read file", i+1))
			continue
		}
		file.Seek(0, 0) // Reset file pointer

		contentType := http.DetectContentType(buffer)
		if !strings.HasPrefix(contentType, "image/") {
			file.Close()
			errors = append(errors, fmt.Sprintf("Photo %d: Invalid file type (images only)", i+1))
			continue
		}

		// Generate unique filename
		ext := filepath.Ext(fileHeader.Filename)
		if ext == "" {
			switch contentType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			case "image/webp":
				ext = ".webp"
			default:
				ext = ".jpg"
			}
		}

		filename := fmt.Sprintf("property_%s_%d_%d%s", propertyID, time.Now().Unix(), i, ext)
		filepath := filepath.Join(h.config.Upload.Path, filename)

		// Create upload directory if it doesn't exist
		if err := os.MkdirAll(h.config.Upload.Path, 0755); err != nil {
			file.Close()
			errors = append(errors, fmt.Sprintf("Photo %d: Failed to create upload directory", i+1))
			continue
		}

		// Save file
		dst, err := os.Create(filepath)
		if err != nil {
			file.Close()
			errors = append(errors, fmt.Sprintf("Photo %d: Failed to save file", i+1))
			continue
		}

		_, err = io.Copy(dst, file)
		file.Close()
		dst.Close()

		if err != nil {
			os.Remove(filepath) // Clean up on error
			errors = append(errors, fmt.Sprintf("Photo %d: Failed to copy file", i+1))
			continue
		}

		uploadedPhotos = append(uploadedPhotos, filename)
	}

	if len(uploadedPhotos) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "No photos uploaded successfully",
			Message: strings.Join(errors, "; "),
		})
		return
	}

	// Update property with new photos (append to existing photos)
	existingPhotos := property.Photos
	if existingPhotos == nil {
		existingPhotos = []string{}
	}

	// Check total photo limit after adding new ones
	totalPhotos := len(existingPhotos) + len(uploadedPhotos)
	if totalPhotos > 5 {
		// Remove uploaded files if total exceeds limit
		for _, filename := range uploadedPhotos {
			os.Remove(filepath.Join(h.config.Upload.Path, filename))
		}
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: fmt.Sprintf("Total photos would exceed limit of 5 (current: %d, uploading: %d)", len(existingPhotos), len(uploadedPhotos)),
		})
		return
	}

	// Update property photos
	allPhotos := append(existingPhotos, uploadedPhotos...)
	updateReq := dto.UpdatePropertyRequest{
		Photos: allPhotos,
	}

	_, err = h.propertySvc.UpdateProperty(propertyID, &updateReq, userID.(string))
	if err != nil {
		// Clean up uploaded files on database error
		for _, filename := range uploadedPhotos {
			os.Remove(filepath.Join(h.config.Upload.Path, filename))
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to update property",
			Message: err.Error(),
		})
		return
	}

	response := gin.H{
		"uploaded_photos": uploadedPhotos,
		"total_photos":    len(allPhotos),
	}

	if len(errors) > 0 {
		response["warnings"] = errors
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: fmt.Sprintf("Successfully uploaded %d photo(s)", len(uploadedPhotos)),
		Data:    response,
	})
}

// DeletePropertyPhoto handles deleting a specific property photo
func (h *UploadHandler) DeletePropertyPhoto(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	propertyID := c.Param("id")
	photoFilename := c.Param("filename")

	if propertyID == "" || photoFilename == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Property ID and photo filename are required"})
		return
	}

	// Verify property ownership
	property, err := h.propertySvc.GetPropertyByID(propertyID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Property not found"})
		return
	}

	// Check if photo exists in property
	photoIndex := -1
	for i, photo := range property.Photos {
		if photo == photoFilename {
			photoIndex = i
			break
		}
	}

	if photoIndex == -1 {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Photo not found"})
		return
	}

	// Remove photo from array
	updatedPhotos := make([]string, 0, len(property.Photos)-1)
	for i, photo := range property.Photos {
		if i != photoIndex {
			updatedPhotos = append(updatedPhotos, photo)
		}
	}

	// Update property
	updateReq := dto.UpdatePropertyRequest{
		Photos: updatedPhotos,
	}

	_, err = h.propertySvc.UpdateProperty(propertyID, &updateReq, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to update property",
			Message: err.Error(),
		})
		return
	}

	// Delete physical file
	filepath := filepath.Join(h.config.Upload.Path, photoFilename)
	if err := os.Remove(filepath); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: Failed to delete photo file %s: %v\n", filepath, err)
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Photo deleted successfully",
		Data: gin.H{
			"remaining_photos": len(updatedPhotos),
		},
	})
}

// DownloadClientsSample generates and serves an Excel template for clients
func (h *UploadHandler) DownloadClientsSample(c *gin.Context) {
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)

	headers := []string{
		"first_name", "last_name", "email", "phone", "type",
		"preferred_location", "address", "city", "state", "postal_code",
		"requirements",
		"budget_min", "budget_max", "expected_amount",
		"min_price", "max_price", "property_address",
		"buildup_area", "carpet_area", "measurement_unit",
		"deposit_budget", "notes",
	}

	// Write headers row 1
	for i, v := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, v)
	}
	lastCol, _ := excelize.CoordinatesToCellName(len(headers), 1)
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#F3F4F6"}, Pattern: 1},
	})
	_ = f.SetCellStyle(sheet, "A1", lastCol, headerStyle)

	// Description row 2
	descMap := map[string]string{
		"first_name":        "Required: First name",
		"last_name":         "Required: Last name",
		"email":             "Optional: Valid email",
		"phone":             "Required: Phone number",
		"type":              "Required: buyer|seller|tenant|owner|list_property_for_rent",
		"preferred_location": "Optional: Preferred location",
		"address":           "Optional: Client address",
		"city":              "Optional: City",
		"state":             "Optional: State",
		"postal_code":       "Optional: Postal code",
		"requirements":      "Optional: Enquiry/requirements",
		"budget_min":        "Optional: Min budget (buyer/tenant)",
		"budget_max":        "Optional: Max budget (buyer/tenant)",
		"expected_amount":   "Optional: Expected amount (list_property_for_rent)",
		"min_price":         "Optional: Min price (seller)",
		"max_price":         "Optional: Max price (seller)",
		"property_address":  "Optional: Property address (seller)",
		"buildup_area":      "Optional: Buildup area (numeric)",
		"carpet_area":       "Optional: Carpet area (numeric)",
		"measurement_unit":  "Optional: Sq Ft|Sq Meter|Acre|Guntha",
		"deposit_budget":    "Optional: Deposit budget (tenant)",
		"notes":             "Optional: Notes",
	}
	for i, v := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheet, cell, descMap[v])
	}

	// Example row 3
	example := []interface{}{
		"Ramesh", "Kumar", "ramesh@example.com", "+911234567890", "buyer",
		"Andheri", "Street 12, Building X", "Mumbai", "Maharashtra", "400053",
		"Looking for 2 BHK",
		5000000, 8000000, "", "", "", "",
		1200, 950, "Sq Ft",
		"", "Optional notes",
	}
	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 3)
		f.SetCellValue(sheet, cell, v)
	}

	// Dropdown for type column (E)
	dv := &excelize.DataValidation{
		Type:         "list",
		Formula1:     `"buyer,seller,tenant,owner,list_property_for_rent"`,
		ShowDropDown: true,
	}
	_ = f.AddDataValidation(sheet+"!E3:E1000", dv)

	// Dropdown for measurement_unit column (T = col 20)
	dvUnit := &excelize.DataValidation{
		Type:         "list",
		Formula1:     `"Sq Ft,Sq Meter,Acre,Guntha"`,
		ShowDropDown: true,
	}
	_ = f.AddDataValidation(sheet+"!T3:T1000", dvUnit)

	_ = f.SetColWidth(sheet, "A", "V", 22)

	// INSTRUCTIONS sheet
	instr := "INSTRUCTIONS"
	f.NewSheet(instr)
	ins := []string{
		"How to use this template:",
		"- Do not change header names in row 1.",
		"- Row 2 contains field descriptions.",
		"- Add one record per row starting from row 3.",
		"- Only first_name, last_name, phone and type are required.",
		"",
		"Column guide:",
	}
	for i, line := range ins {
		cell, _ := excelize.CoordinatesToCellName(1, i+1)
		f.SetCellValue(instr, cell, line)
	}
	instrDescMap := map[string]string{
		"first_name":        "Required. First name.",
		"last_name":         "Required. Last name.",
		"email":             "Optional. Valid email address.",
		"phone":             "Required. Phone number.",
		"type":              "Required. buyer|seller|tenant|owner|list_property_for_rent",
		"preferred_location": "Optional. Preferred location/area.",
		"address":           "Optional. Client residential address.",
		"city":              "Optional. City name.",
		"state":             "Optional. State name.",
		"postal_code":       "Optional. Postal/ZIP code.",
		"requirements":      "Optional. Enquiry or requirements text.",
		"budget_min":        "Optional. Minimum budget (buyer/tenant).",
		"budget_max":        "Optional. Maximum budget (buyer/tenant).",
		"expected_amount":   "Optional. Expected amount (list_property_for_rent).",
		"min_price":         "Optional. Minimum price (seller).",
		"max_price":         "Optional. Maximum price (seller).",
		"property_address":  "Optional. Address of property to sell (seller).",
		"buildup_area":      "Optional. Buildup area (numeric).",
		"carpet_area":       "Optional. Carpet area (numeric).",
		"measurement_unit":  "Optional. Sq Ft|Sq Meter|Acre|Guntha",
		"deposit_budget":    "Optional. Deposit budget (tenant).",
		"notes":             "Optional. Free text notes.",
	}
	for i, col := range headers {
		row := len(ins) + i + 2
		cellH, _ := excelize.CoordinatesToCellName(1, row)
		cellD, _ := excelize.CoordinatesToCellName(2, row)
		f.SetCellValue(instr, cellH, col)
		f.SetCellValue(instr, cellD, instrDescMap[col])
	}
	_ = f.SetColWidth(instr, "A", "B", 50)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate sample"})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=clients_sample.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// DownloadPropertiesSample generates and serves an Excel template for properties
func (h *UploadHandler) DownloadPropertiesSample(c *gin.Context) {
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	headers := []string{"title","type","listing_type","price","area","bedrooms","bathrooms","location","address","city","state","description","amenities","client_id"}
	// Write headers
	for i, v := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, v)
	}
	// Style headers
	headerStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}, Fill: excelize.Fill{Type: "pattern", Color: []string{"#F3F4F6"}, Pattern: 1}})
	_ = f.SetCellStyle(sheet, "A1", "N1", headerStyle)

	// Visible description row (row 2)
	descs := []string{}
	for _, v := range headers {
		switch v {
		case "title":
			descs = append(descs, "Required: Title (min 5 chars)")
		case "type":
			descs = append(descs, "Required: apartment|house|commercial|plot")
		case "listing_type":
			descs = append(descs, "Required: sale|rent")
		case "price":
			descs = append(descs, "Required: Numeric price")
		case "area":
			descs = append(descs, "Required: Numeric area")
		case "bedrooms":
			descs = append(descs, "Optional: Integer")
		case "bathrooms":
			descs = append(descs, "Optional: Integer")
		case "location":
			descs = append(descs, "Required: Locality")
		case "address":
			descs = append(descs, "Required: Full address")
		case "city":
			descs = append(descs, "Required: City")
		case "state":
			descs = append(descs, "Required: State")
		case "description":
			descs = append(descs, "Required: Brief description")
		case "amenities":
			descs = append(descs, "Optional: Comma-separated")
		case "client_id":
			descs = append(descs, "Optional: existing client ID")
		default:
			descs = append(descs, "")
		}
	}
	for i, d := range descs {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheet, cell, d)
	}

	// Example row (row 3)
	example := []interface{}{"Nice 2BHK", "apartment", "sale", 7500000, 950, 2, 2, "Andheri West", "Street 12, Building X", "Mumbai", "Maharashtra", "Well maintained 2BHK near metro", "Lift,Parking", ""}
	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 3)
		f.SetCellValue(sheet, cell, v)
	}

	// Add dropdowns for `type` (B) and `listing_type` (C) starting at row 3
	dvType := &excelize.DataValidation{
		Type:         "list",
		Formula1:     `"apartment,house,commercial,plot"`,
		ShowDropDown: true,
	}
	dvListing := &excelize.DataValidation{
		Type:         "list",
		Formula1:     `"sale,rent"`,
		ShowDropDown: true,
	}
	_ = f.AddDataValidation(sheet+"!B3:B1000", dvType)
	_ = f.AddDataValidation(sheet+"!C3:C1000", dvListing)

	_ = f.SetColWidth(sheet, "A", "N", 22)

	// Create INSTRUCTIONS sheet with per-column guide
	instr := "INSTRUCTIONS"
	f.NewSheet(instr)
	ins := []string{"How to use this template:", "- Do not modify header names.", "- Add one record per row starting at row 3.", "- Row 2 contains short descriptions.", "", "Column guide:"}
	for i, line := range ins {
		cell, _ := excelize.CoordinatesToCellName(1, i+1)
		f.SetCellValue(instr, cell, line)
	}
	for i, h := range headers {
		row := len(ins) + i + 2
		cellH, _ := excelize.CoordinatesToCellName(1, row)
		cellD, _ := excelize.CoordinatesToCellName(2, row)
		f.SetCellValue(instr, cellH, h)
		// detailed desc
		desc := ""
		switch h {
		case "title":
			desc = "Required. Title (min 5 chars)."
		case "type":
			desc = "Required. apartment|house|commercial|plot"
		case "listing_type":
			desc = "Required. sale|rent"
		case "price":
			desc = "Required. Numeric price value."
		case "area":
			desc = "Required. Numeric area value."
		case "bedrooms":
			desc = "Optional. Integer."
		case "bathrooms":
			desc = "Optional. Integer."
		case "location":
			desc = "Required. Locality or neighbourhood."
		case "address":
			desc = "Required. Full postal address."
		case "city":
			desc = "Required. City name."
		case "state":
			desc = "Required. State name."
		case "description":
			desc = "Required. Brief description (min 20 chars)."
		case "amenities":
			desc = "Optional. Comma-separated amenities (e.g., Lift,Parking)."
		case "client_id":
			desc = "Optional. Provide existing client ID to link."
		}
		f.SetCellValue(instr, cellD, desc)
	}
	_ = f.SetColWidth(instr, "A", "B", 50)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate sample"})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=properties_sample.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// UploadProfilePhoto handles profile photo upload
func (h *UploadHandler) UploadProfilePhoto(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "Unauthorized",
		})
		return
	}

	// Parse multipart form
	file, header, err := c.Request.FormFile("profile_photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "No file provided",
			Message: "Please provide a profile photo",
		})
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > h.config.Upload.MaxFileSize {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "File too large",
			Message: fmt.Sprintf("File size must be less than %d MB", h.config.Upload.MaxFileSize/1024/1024),
		})
		return
	}

	// Validate file type
	if !isValidImageType(header.Filename) {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid file type",
			Message: "Only JPEG, PNG, GIF, and WebP images are allowed",
		})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := h.config.Upload.Path
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to create upload directory",
			Message: err.Error(),
		})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to create file",
			Message: err.Error(),
		})
		return
	}
	defer dst.Close()

	// Copy uploaded file to destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to save file",
			Message: err.Error(),
		})
		return
	}

	// Generate file URL (you might want to use your domain here)
	fileURL := fmt.Sprintf("/uploads/%s", fileName)

	// Update user's profile image in database
	err = h.authService.UpdateProfileImage(userID.(string), fileURL)
	if err != nil {
		// Clean up uploaded file if database update fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to update profile",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Profile photo uploaded successfully",
		Data: gin.H{
			"profile_image": fileURL,
		},
	})
}

// ServeUploadedFile serves uploaded files
func (h *UploadHandler) ServeUploadedFile(c *gin.Context) {
	filename := c.Param("filename")

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Invalid filename",
		})
		return
	}

	filePath := filepath.Join(h.config.Upload.Path, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "File not found",
		})
		return
	}

	c.File(filePath)
}

// isValidImageType checks if the file extension is a valid image type
func isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}

	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}
	return false
}

// UploadBuildingContactsExcel handles bulk building contact Excel uploads
func (h *UploadHandler) UploadBuildingContactsExcel(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No file provided", Message: "Please attach an Excel file"})
		return
	}
	defer file.Close()

	if header.Size > h.config.Upload.MaxFileSize {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "File too large", Message: fmt.Sprintf("File size must be less than %d MB", h.config.Upload.MaxFileSize/1024/1024)})
		return
	}

	// Read file into buffer
	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to read file", Message: err.Error()})
		return
	}

	f, err := excelize.OpenReader(bytes.NewReader(buf.Bytes()))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid Excel file", Message: err.Error()})
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Empty Excel file"})
		return
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Failed to read rows", Message: err.Error()})
		return
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No data rows found"})
		return
	}

	headerRow := rows[0]
	colIndex := map[string]int{}
	for i, hname := range headerRow {
		colIndex[strings.ToLower(strings.TrimSpace(hname))] = i
	}

	created := 0
	duplicates := 0
	errorsList := []string{}

	for r := 1; r < len(rows); r++ {
		row := rows[r]
		// Skip empty rows
		if len(row) == 0 {
			continue
		}

		get := func(key string) string {
			idx, ok := colIndex[key]
			if !ok || idx >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[idx])
		}

		ownerName := get("owner_name")
		mobileNumber := get("mobile_number")
		buildingName := get("building_name")
		area := get("area")
		notes := get("notes")

		// 1. Skip blank rows
		if ownerName == "" && mobileNumber == "" && buildingName == "" && area == "" {
			continue
		}

		// 2. Skip description rows (contain "Required:" or "Optional:")
		if strings.Contains(strings.ToLower(ownerName), "required:") || strings.Contains(strings.ToLower(ownerName), "optional:") ||
			strings.Contains(strings.ToLower(mobileNumber), "required:") {
			continue
		}

		// 3. Skip example rows
		if ownerName == "Ramesh" && mobileNumber == "+911234567890" {
			continue
		}

		// Mobile number is required
		if mobileNumber == "" {
			errorsList = append(errorsList, fmt.Sprintf("row %d: mobile number is required", r+1))
			continue
		}

		var req dto.CreateBuildingContactRequest
		req.MobileNumber = mobileNumber
		if ownerName != "" {
			req.OwnerName = &ownerName
		}
		if buildingName != "" {
			req.BuildingName = &buildingName
		}
		if area != "" {
			req.Area = &area
		}
		if notes != "" {
			req.Notes = &notes
		}

		// Attempt create
		if _, err := h.buildingSvc.CreateBuildingContact(&req, userID.(string)); err != nil {
			// Separate duplicate errors from other errors for clearer reporting
			if strings.Contains(err.Error(), "already exists") {
				duplicates++
			} else {
				errorsList = append(errorsList, fmt.Sprintf("row %d: %v", r+1, err))
			}
			continue
		}
		created++
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Building contacts processed",
		Data: gin.H{
			"created":    created,
			"duplicates": duplicates,
			"errors":     errorsList,
		},
	})
}

// DownloadBuildingContactsSample generates and serves an Excel template for building contacts
func (h *UploadHandler) DownloadBuildingContactsSample(c *gin.Context) {
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)

	headers := []string{
		"owner_name", "mobile_number", "building_name", "area", "notes",
	}

	// Write headers row 1
	for i, v := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, v)
	}
	lastCol, _ := excelize.CoordinatesToCellName(len(headers), 1)
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#F3F4F6"}, Pattern: 1},
	})
	_ = f.SetCellStyle(sheet, "A1", lastCol, headerStyle)

	// Description row 2
	descMap := map[string]string{
		"owner_name":    "Optional: Building owner name",
		"mobile_number": "Required: Mobile number",
		"building_name": "Optional: Building name",
		"area":          "Optional: Area/Location",
		"notes":         "Optional: Additional notes",
	}
	for i, v := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheet, cell, descMap[v])
	}

	// Example row 3
	example := []interface{}{
		"Ramesh Kumar", "+911234567890", "Sunrise Apartments", "Andheri West", "Contact for property inquiries",
	}
	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 3)
		f.SetCellValue(sheet, cell, v)
	}

	_ = f.SetColWidth(sheet, "A", "E", 25)

	// INSTRUCTIONS sheet
	instr := "INSTRUCTIONS"
	f.NewSheet(instr)
	ins := []string{
		"How to use this template:",
		"- Do not change header names in row 1.",
		"- Row 2 contains field descriptions.",
		"- Add one record per row starting from row 3.",
		"- Only mobile_number is required.",
		"",
		"Column guide:",
	}
	for i, line := range ins {
		cell, _ := excelize.CoordinatesToCellName(1, i+1)
		f.SetCellValue(instr, cell, line)
	}
	instrDescMap := map[string]string{
		"owner_name":    "Optional. Name of the building owner.",
		"mobile_number": "Required. Mobile number of the contact.",
		"building_name": "Optional. Name of the building.",
		"area":          "Optional. Area or location of the building.",
		"notes":         "Optional. Additional notes or comments.",
	}
	for i, col := range headers {
		row := len(ins) + i + 2
		cellH, _ := excelize.CoordinatesToCellName(1, row)
		cellD, _ := excelize.CoordinatesToCellName(2, row)
		f.SetCellValue(instr, cellH, col)
		f.SetCellValue(instr, cellD, instrDescMap[col])
	}
	_ = f.SetColWidth(instr, "A", "B", 50)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate sample"})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=building_contacts_sample.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}