#!/bin/bash

# Test Subscription System API Endpoints
# This script tests the subscription system to ensure it's working correctly

API_BASE="http://localhost:8080/api"
TOKEN=""

echo "🧪 Testing Subscription System API Endpoints"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local auth_required=$4
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo "Endpoint: $method $endpoint"
    
    if [ "$auth_required" = "true" ] && [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ SKIPPED${NC} - No authentication token available"
        return
    fi
    
    local headers=""
    if [ "$auth_required" = "true" ]; then
        headers="-H \"Authorization: Bearer $TOKEN\""
    fi
    
    local response
    if [ "$method" = "GET" ]; then
        response=$(eval "curl -s -w \"HTTPSTATUS:%{http_code}\" $headers \"$API_BASE$endpoint\"")
    elif [ "$method" = "POST" ]; then
        response=$(eval "curl -s -w \"HTTPSTATUS:%{http_code}\" -X POST $headers -H \"Content-Type: application/json\" \"$API_BASE$endpoint\"")
    fi
    
    local http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS${NC} - HTTP $http_code"
    elif [ "$http_code" -eq 401 ] && [ "$auth_required" = "true" ]; then
        echo -e "${YELLOW}⚠️  AUTH REQUIRED${NC} - HTTP $http_code (Expected for protected endpoints)"
    else
        echo -e "${RED}❌ FAILED${NC} - HTTP $http_code"
        echo "Response: $body"
    fi
}

# Test health check first
echo -e "\n${YELLOW}1. Testing Health Check${NC}"
test_endpoint "GET" "/health" "Health Check" "false"

# Test public subscription endpoints
echo -e "\n${YELLOW}2. Testing Public Endpoints${NC}"
test_endpoint "GET" "/subscriptions/plans" "Get All Subscription Plans" "true"

# Test authentication endpoints
echo -e "\n${YELLOW}3. Testing Authentication${NC}"
echo "Note: These require valid credentials and are expected to fail in this test"
test_endpoint "POST" "/auth/login" "Login Endpoint" "false"

# Test protected subscription endpoints
echo -e "\n${YELLOW}4. Testing Protected Subscription Endpoints${NC}"
test_endpoint "GET" "/subscriptions/current" "Get Current Subscription" "true"
test_endpoint "GET" "/subscriptions/status" "Get Subscription Status" "true"
test_endpoint "POST" "/subscriptions/activate-trial" "Activate Trial" "true"

# Test payment endpoints
echo -e "\n${YELLOW}5. Testing Payment Endpoints${NC}"
test_endpoint "POST" "/payments/create-order" "Create Payment Order" "true"
test_endpoint "GET" "/payments/history" "Get Payment History" "true"

# Test feature access endpoints
echo -e "\n${YELLOW}6. Testing Feature Access Endpoints${NC}"
test_endpoint "GET" "/subscriptions/features/properties/access" "Check Properties Feature Access" "true"
test_endpoint "GET" "/subscriptions/usage" "Get Feature Usage" "true"

echo -e "\n${GREEN}🎉 Test Complete!${NC}"
echo -e "\n${YELLOW}Notes:${NC}"
echo "- ✅ SUCCESS: Endpoint is working correctly"
echo "- ⚠️  AUTH REQUIRED: Endpoint requires authentication (expected)"
echo "- ❌ FAILED: Endpoint has issues that need investigation"
echo ""
echo "To test with authentication:"
echo "1. Start the backend: cd backend && go run cmd/api/main.go"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Register/login through the UI to get a token"
echo "4. Set TOKEN variable and run this script again"
echo ""
echo "Frontend URL: http://localhost:3000"
echo "Backend URL: http://localhost:8080"