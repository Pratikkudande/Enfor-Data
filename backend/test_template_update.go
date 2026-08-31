package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// Quick test to verify template update API works with category
func main() {
	// Get template ID from command line
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run test_template_update.go <template_id>")
		fmt.Println("Example: go run test_template_update.go abc123")
		return
	}

	templateID := os.Args[1]
	
	// Get auth token from command line or environment
	authToken := os.Getenv("AUTH_TOKEN")
	if authToken == "" && len(os.Args) >= 3 {
		authToken = os.Args[2]
	}
	if authToken == "" {
		fmt.Println("Please provide AUTH_TOKEN environment variable or as second argument")
		fmt.Println("Get it from browser: F12 → Application → Local Storage → token")
		return
	}

	// Test payload
	payload := map[string]interface{}{
		"header":           "202603",
		"template_id":      "222916",
		"template_name":    "Test Template",
		"template_type":    "Promotional",
		"category":         "SERVICES",  // Valid category
		"provider":         "Fast2SMS",
		"template_content": "Test message {#var#}",
		"sample_content":   "Test message example",
		"status":           "Active",
		"variable_count":   1,
	}

	jsonData, _ := json.Marshal(payload)

	// Make request
	url := fmt.Sprintf("http://localhost:8080/api/admin/dlt-templates/%s", templateID)
	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("❌ Error creating request:", err)
		return
	}

	req.Header.Set("Authorization", "Bearer "+authToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("❌ Error making request:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	fmt.Println("Status:", resp.Status)
	fmt.Println("Response:", string(body))

	if resp.StatusCode == 200 {
		fmt.Println("\n✅ Template update successful!")
		fmt.Println("Category 'SERVICES' was accepted by the database.")
	} else {
		fmt.Println("\n❌ Template update failed!")
		fmt.Println("Check the error message above.")
	}
}
