package main

import (
	"fmt"
)

// Helper function to find index of substring
func indexOf(str, substr string) int {
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// Helper function to replace first occurrence
func replaceFirst(str, old, new string) string {
	index := indexOf(str, old)
	if index == -1 {
		return str
	}
	return str[:index] + new + str[index+len(old):]
}

// buildMessageFromTemplate replaces {#var#} or {#alp#} placeholders with actual values
func buildMessageFromTemplate(templateContent string, variableValues map[string]string) string {
	message := templateContent
	
	// Replace variables sequentially (var1, var2, var3, etc.)
	// This works for both {#var#} and {#alp#} patterns
	varIndex := 1
	for {
		varKey := fmt.Sprintf("var%d", varIndex)
		value, exists := variableValues[varKey]
		if !exists {
			break
		}
		
		// Try to replace {#alp#} first (most common in DLT templates)
		if indexOf(message, "{#alp#}") != -1 {
			message = replaceFirst(message, "{#alp#}", value)
		} else if indexOf(message, "{#var#}") != -1 {
			// Fallback to {#var#}
			message = replaceFirst(message, "{#var#}", value)
		} else {
			// No more placeholders found
			break
		}
		
		varIndex++
	}
	
	return message
}

func main() {
	// Test Case 1: Sale Property Alert
	template := `Property for Sale: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA`

	variables := map[string]string{
		"var1": "2BHK Apartment in Andheri",
		"var2": "75,00,000",
		"var3": "9876543210",
	}

	result := buildMessageFromTemplate(template, variables)
	
	fmt.Println("=== Test Case 1: Sale Property Alert ===")
	fmt.Println("Template:")
	fmt.Println(template)
	fmt.Println("\nVariables:")
	for k, v := range variables {
		fmt.Printf("%s: %s\n", k, v)
	}
	fmt.Println("\nResult:")
	fmt.Println(result)
	
	expectedResult := `Property for Sale: 2BHK Apartment in Andheri
Details: ₹75,00,000
Contact: 9876543210
- ENFOR DATA`
	
	if result == expectedResult {
		fmt.Println("\n✅ TEST PASSED!")
	} else {
		fmt.Println("\n❌ TEST FAILED!")
		fmt.Println("Expected:")
		fmt.Println(expectedResult)
	}
	
	// Test Case 2: With {#var#} pattern
	fmt.Println("\n=== Test Case 2: Using {#var#} pattern ===")
	template2 := `Property for Rent: {#var#}
Monthly: ₹{#var#}
Call: {#var#}`

	variables2 := map[string]string{
		"var1": "3BHK Flat",
		"var2": "50,000",
		"var3": "9123456789",
	}

	result2 := buildMessageFromTemplate(template2, variables2)
	fmt.Println("Result:")
	fmt.Println(result2)
	
	expectedResult2 := `Property for Rent: 3BHK Flat
Monthly: ₹50,000
Call: 9123456789`
	
	if result2 == expectedResult2 {
		fmt.Println("\n✅ TEST PASSED!")
	} else {
		fmt.Println("\n❌ TEST FAILED!")
		fmt.Println("Expected:")
		fmt.Println(expectedResult2)
	}
}
