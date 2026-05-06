#!/bin/bash

echo "🔧 Testing Payments Table Fix"
echo "============================="

# Check if backend is running
echo ""
echo "1. Checking if backend is running..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it with:"
    echo "   cd backend && go run cmd/api/main.go"
    exit 1
fi

# Check if we can get plans (should work now)
echo ""
echo "2. Testing public plans API..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:8080/api/subscriptions/plans")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Plans API working - HTTP $http_code"
else
    echo "❌ Plans API failed - HTTP $http_code"
    exit 1
fi

echo ""
echo "3. Next steps to test payment flow:"
echo "   1. Visit: http://localhost:3000/pricing"
echo "   2. Click 'Choose Plan' on any paid plan"
echo "   3. Complete registration form"
echo "   4. Try payment (should not get 500 error anymore)"
echo ""
echo "If you still get errors, restart the backend to apply database fixes:"
echo "   cd backend && go run cmd/api/main.go"