#!/bin/bash

# OTP System Test Script
# Tests all OTP endpoints with various scenarios

BASE_URL="http://localhost:8080/api/auth"
MOBILE="+919876543210"  # Change this to your test mobile number

echo "================================"
echo "OTP System Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Send OTP
echo -e "${YELLOW}Test 1: Send OTP${NC}"
echo "POST $BASE_URL/send-otp"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"mobile_number\": \"$MOBILE\", \"purpose\": \"registration\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test 1 PASSED${NC}"
    OTP_ID=$(echo "$BODY" | grep -o '"otp_id":"[^"]*' | cut -d'"' -f4)
    echo "OTP ID: $OTP_ID"
else
    echo -e "${RED}✗ Test 1 FAILED${NC}"
fi
echo ""

# Wait for user to enter OTP
echo -e "${YELLOW}Please check your mobile for OTP and enter it:${NC}"
read -p "Enter OTP: " OTP_CODE
echo ""

# Test 2: Verify OTP (Correct)
echo -e "${YELLOW}Test 2: Verify OTP (Correct)${NC}"
echo "POST $BASE_URL/verify-otp"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"otp_id\": \"$OTP_ID\", \"mobile_number\": \"$MOBILE\", \"otp_code\": \"$OTP_CODE\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test 2 PASSED${NC}"
else
    echo -e "${RED}✗ Test 2 FAILED${NC}"
fi
echo ""

# Test 3: Send OTP Again
echo -e "${YELLOW}Test 3: Send OTP Again${NC}"
echo "POST $BASE_URL/send-otp"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"mobile_number\": \"$MOBILE\", \"purpose\": \"login\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test 3 PASSED${NC}"
    OTP_ID=$(echo "$BODY" | grep -o '"otp_id":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ Test 3 FAILED${NC}"
fi
echo ""

# Test 4: Resend OTP (Too Soon - Should Fail)
echo -e "${YELLOW}Test 4: Resend OTP (Too Soon - Should Fail with 429)${NC}"
echo "POST $BASE_URL/resend-otp"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/resend-otp" \
  -H "Content-Type: application/json" \
  -d "{\"otp_id\": \"$OTP_ID\", \"mobile_number\": \"$MOBILE\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 429 ]; then
    echo -e "${GREEN}✓ Test 4 PASSED (Cooldown working)${NC}"
else
    echo -e "${RED}✗ Test 4 FAILED (Expected 429)${NC}"
fi
echo ""

# Test 5: Wait and Resend
echo -e "${YELLOW}Test 5: Wait 60 seconds and Resend OTP${NC}"
echo "Waiting 60 seconds for cooldown..."
sleep 60

echo "POST $BASE_URL/resend-otp"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/resend-otp" \
  -H "Content-Type: application/json" \
  -d "{\"otp_id\": \"$OTP_ID\", \"mobile_number\": \"$MOBILE\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test 5 PASSED${NC}"
else
    echo -e "${RED}✗ Test 5 FAILED${NC}"
fi
echo ""

# Test 6: Verify with Wrong OTP (Should Fail)
echo -e "${YELLOW}Test 6: Verify with Wrong OTP (Should Fail with 401)${NC}"
echo "POST $BASE_URL/verify-otp"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"otp_id\": \"$OTP_ID\", \"mobile_number\": \"$MOBILE\", \"otp_code\": \"000000\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ Test 6 PASSED (Invalid OTP rejected)${NC}"
else
    echo -e "${RED}✗ Test 6 FAILED (Expected 401)${NC}"
fi
echo ""

echo "================================"
echo "Test Suite Complete"
echo "================================"
