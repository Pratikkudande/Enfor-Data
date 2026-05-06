#!/bin/bash

echo "🧪 Testing Public Subscription Plans API"
echo "========================================"

API_BASE="http://localhost:8080/api"

echo ""
echo "Testing public access to subscription plans..."
echo "URL: GET $API_BASE/subscriptions/plans"

# Test without authentication
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE/subscriptions/plans")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_code" -eq 200 ]; then
    echo "✅ SUCCESS - HTTP $http_code"
    echo "Plans loaded successfully!"
    
    # Count plans in response
    plan_count=$(echo $body | grep -o '"id"' | wc -l)
    echo "Found $plan_count subscription plans"
else
    echo "❌ FAILED - HTTP $http_code"
    echo "Response: $body"
fi

echo ""
echo "Testing specific plan by ID..."
echo "URL: GET $API_BASE/subscriptions/plans/1"

# Test getting specific plan (assuming plan with ID 1 exists)
response2=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE/subscriptions/plans/1")
http_code2=$(echo $response2 | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code2" -eq 200 ] || [ "$http_code2" -eq 404 ]; then
    echo "✅ SUCCESS - HTTP $http_code2 (200=found, 404=not found - both are valid)"
else
    echo "❌ FAILED - HTTP $http_code2"
fi

echo ""
echo "🎯 Summary:"
if [ "$http_code" -eq 200 ]; then
    echo "✅ Public plans API is working correctly"
    echo "✅ Frontend should now be able to load pricing without authentication"
else
    echo "❌ Public plans API is not working"
    echo "❌ Check backend configuration and ensure server is running"
fi

echo ""
echo "Next steps:"
echo "1. Restart backend: cd backend && go run cmd/api/main.go"
echo "2. Test frontend: http://localhost:3000/pricing"