package main

import (
	"fmt"
	"strings"
)

// extractVariables extracts variable values from the filled template message
func extractVariables(message string) string {
	lines := strings.Split(message, "\n")
	var variables []string
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		// Skip empty lines and lines with just "ENFOR DATA" or signature
		if line == "" || line == "ENFOR DATA" || strings.HasPrefix(line, "-") {
			continue
		}
		
		// Extract value after colon
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			value := strings.TrimSpace(parts[1])
			// Remove common prefixes like ₹
			value = strings.TrimPrefix(value, "₹")
			value = strings.TrimSpace(value)
			
			// Only add non-empty values
			if value != "" {
				variables = append(variables, value)
			}
		}
	}
	
	// Join with pipe separator as required by Fast2SMS
	result := strings.Join(variables, "|")
	
	if result == "" {
		return "|||"
	}
	
	return result
}

func main() {
	// Test Case 1: Message with emojis (as shown in your log)
	message1 := `🏠 Property for Sale: 1 BHK Apartment at Hinjewadi, Pune
💰 Details: ₹Price ₹45 Lakh  650 sq ft  1 Bathroom  Available
📞 Contact: Krushna Salbande - 9359360896
ENFOR DATA`

	fmt.Println("=== Test Case 1: With Emojis ===")
	fmt.Println("Input Message:")
	fmt.Println(message1)
	fmt.Println("\nExtracted Variables (pipe-separated):")
	result1 := extractVariables(message1)
	fmt.Println(result1)
	
	expected1 := "1 BHK Apartment at Hinjewadi, Pune|Price ₹45 Lakh  650 sq ft  1 Bathroom  Available|Krushna Salbande - 9359360896"
	if result1 == expected1 {
		fmt.Println("✅ TEST PASSED")
	} else {
		fmt.Println("❌ TEST FAILED")
		fmt.Println("Expected:", expected1)
	}
	
	// Test Case 2: Message without emojis
	message2 := `Property for Sale: 2BHK Apartment in Andheri
Details: ₹75,00,000
Contact: 9876543210
- ENFOR DATA`

	fmt.Println("\n=== Test Case 2: Without Emojis ===")
	fmt.Println("Input Message:")
	fmt.Println(message2)
	fmt.Println("\nExtracted Variables (pipe-separated):")
	result2 := extractVariables(message2)
	fmt.Println(result2)
	
	expected2 := "2BHK Apartment in Andheri|75,00,000|9876543210"
	if result2 == expected2 {
		fmt.Println("✅ TEST PASSED")
	} else {
		fmt.Println("❌ TEST FAILED")
		fmt.Println("Expected:", expected2)
	}
	
	// Test Case 3: Rent property
	message3 := `🏠 Property for Rent: 3BHK Flat in Bandra
💰 Details: ₹50,000/month
📞 Contact: 9123456789
ENFOR DATA`

	fmt.Println("\n=== Test Case 3: Rent Property ===")
	fmt.Println("Input Message:")
	fmt.Println(message3)
	fmt.Println("\nExtracted Variables (pipe-separated):")
	result3 := extractVariables(message3)
	fmt.Println(result3)
	
	expected3 := "3BHK Flat in Bandra|50,000/month|9123456789"
	if result3 == expected3 {
		fmt.Println("✅ TEST PASSED")
	} else {
		fmt.Println("❌ TEST FAILED")
		fmt.Println("Expected:", expected3)
	}
}
