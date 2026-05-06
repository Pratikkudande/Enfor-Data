#!/bin/bash

echo "🧪 Testing Razorpay Integration Fix"
echo "=================================="

API_BASE="http://localhost:8080/api"

# Check if backend is running
echo ""
echo "1. Checking if backend is running..."
if curl -s $API_BASE/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it with:"
    echo "   cd backend && go run cmd/api/main.go"
    exit 1
fi

# Check if we can get plans
echo ""
echo "2. Testing plans API..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE/subscriptions/plans")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Plans API working - HTTP $http_code"
    
    # Extract first plan ID for testing
    plan_id=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Found plan ID: $plan_id"
else
    echo "❌ Plans API failed - HTTP $http_code"
    exit 1
fi

echo ""
echo "3. Testing payment order creation (requires authentication)..."
echo "Note: This will fail with 401 unless you have a valid token"
echo "To test the complete flow:"
echo ""
echo "1. Visit: http://localhost:3000/pricing"
echo "2. Click 'Choose Plan' on Starter Plan"
echo "3. Complete registration form"
echo "4. Click 'Pay ₹999' button"
echo "5. Should now create real Razorpay order (no 400 error)"
echo ""
echo "Expected behavior after fix:"
echo "✅ Real Razorpay order created via API"
echo "✅ Valid order ID returned to frontend"
echo "✅ Razorpay checkout opens successfully"
echo "✅ No 400 Bad Request errors"