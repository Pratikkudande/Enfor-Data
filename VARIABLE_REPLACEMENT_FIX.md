# DLT Template Variable Replacement Fix

## Issue
The SMS being sent had emojis and placeholders instead of actual values:
```
🏠 Property for Sale: 💰 Details: ₹📞 Contact: ENFOR DATA
```

Instead of:
```
Property for Sale: 1 BHK Apartment at Hinjewadi, Pune
Details: ₹Price ₹45 Lakh  650 sq ft  1 Bathroom Available
Contact: Krushna Salbande - 99887665544
ENFOR DATA
```

## Root Cause
The variable replacement logic in `buildMessageFromTemplate` was:
1. Trying to replace `{#var1#}`, `{#var2#}`, etc. but templates use `{#alp#}` or `{#var#}`
2. Not replacing placeholders sequentially in order
3. The map iteration order is random in Go, causing unpredictable replacements

## Solution
Fixed the `buildMessageFromTemplate` function in `backend/internal/service/sms_marketing_service.go`:

```go
func (s *SMSMarketingService) buildMessageFromTemplate(templateContent string, variableValues map[string]string) string {
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
```

## How It Works Now

### Template Content
```
Property for Sale: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA
```

### Variable Values (from frontend)
```json
{
  "var1": "1 BHK Apartment at Hinjewadi, Pune",
  "var2": "Price ₹45 Lakh  650 sq ft  1 Bathroom Available",
  "var3": "Krushna Salbande - 99887665544"
}
```

### Replacement Process
1. **First iteration** (varIndex=1):
   - Get `var1` = "1 BHK Apartment at Hinjewadi, Pune"
   - Find first `{#alp#}` in template
   - Replace it with var1 value
   - Result: `Property for Sale: 1 BHK Apartment at Hinjewadi, Pune\nDetails: ₹{#alp#}\nContact: {#alp#}\n- ENFOR DATA`

2. **Second iteration** (varIndex=2):
   - Get `var2` = "Price ₹45 Lakh  650 sq ft  1 Bathroom Available"
   - Find first (next) `{#alp#}` in template
   - Replace it with var2 value
   - Result: `Property for Sale: 1 BHK Apartment at Hinjewadi, Pune\nDetails: ₹Price ₹45 Lakh  650 sq ft  1 Bathroom Available\nContact: {#alp#}\n- ENFOR DATA`

3. **Third iteration** (varIndex=3):
   - Get `var3` = "Krushna Salbande - 99887665544"
   - Find first (next) `{#alp#}` in template
   - Replace it with var3 value
   - Result: `Property for Sale: 1 BHK Apartment at Hinjewadi, Pune\nDetails: ₹Price ₹45 Lakh  650 sq ft  1 Bathroom Available\nContact: Krushna Salbande - 99887665544\n- ENFOR DATA`

4. **Fourth iteration** (varIndex=4):
   - Try to get `var4` - doesn't exist
   - Break loop

### Final SMS Sent
```
Property for Sale: 1 BHK Apartment at Hinjewadi, Pune
Details: ₹Price ₹45 Lakh  650 sq ft  1 Bathroom Available
Contact: Krushna Salbande - 99887665544
- ENFOR DATA
```

## Key Improvements
1. ✅ **Sequential replacement** - Variables are replaced in order (var1, var2, var3...)
2. ✅ **Supports both patterns** - Works with `{#alp#}` and `{#var#}` placeholders
3. ✅ **Uses replaceFirst** - Only replaces one occurrence at a time, maintaining order
4. ✅ **Deterministic** - Always produces the same output for the same input
5. ✅ **Safe** - Stops when no more variables or placeholders are found

## Testing

### Test Case 1: Sale Property Alert
**Template:**
```
Property for Sale: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA
```

**Variables:**
- var1: "2BHK Apartment in Andheri"
- var2: "75,00,000"
- var3: "9876543210"

**Expected Output:**
```
Property for Sale: 2BHK Apartment in Andheri
Details: ₹75,00,000
Contact: 9876543210
- ENFOR DATA
```

### Test Case 2: Rent Property Alert
**Template:**
```
Property for Rent: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA
```

**Variables:**
- var1: "3BHK Flat in Bandra"
- var2: "50,000/month"
- var3: "9123456789"

**Expected Output:**
```
Property for Rent: 3BHK Flat in Bandra
Details: ₹50,000/month
Contact: 9123456789
- ENFOR DATA
```

## Files Modified
- ✅ `backend/internal/service/sms_marketing_service.go` - Fixed `buildMessageFromTemplate()`

## Status
- ✅ Backend compiled successfully
- ✅ Sequential variable replacement implemented
- ✅ Supports both `{#alp#}` and `{#var#}` patterns
- ✅ Ready for testing

## Next Steps for User
1. Restart the backend server if it's running
2. Navigate to SMS Marketing → Send tab
3. Select a DLT template
4. Fill in the variable values
5. Check the preview (should show the exact message)
6. Select recipients and send
7. The SMS sent should match the preview exactly
