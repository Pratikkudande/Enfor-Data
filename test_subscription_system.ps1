# Test Subscription System API Endpoints
# This PowerShell script tests the subscription system to ensure it's working correctly

$API_BASE = "http://localhost:8080/api"
$TOKEN = ""

Write-Host "🧪 Testing Subscription System API Endpoints" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Function to make API calls
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [bool]$AuthRequired
    )
    
    Write-Host "`n🔍 Testing: $Description" -ForegroundColor Yellow
    Write-Host "Endpoint: $Method $Endpoint" -ForegroundColor Gray
    
    if ($AuthRequired -and [string]::IsNullOrEmpty($TOKEN)) {
        Write-Host "❌ SKIPPED - No authentication token available" -ForegroundColor Red
        return
    }
    
    $headers = @{}
    if ($AuthRequired) {
        $headers["Authorization"] = "Bearer $TOKEN"
    }
    
    try {
        $uri = "$API_BASE$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
        } elseif ($Method -eq "POST") {
            $headers["Content-Type"] = "application/json"
            $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body "{}" -ErrorAction Stop
        }
        
        Write-Host "✅ SUCCESS - Endpoint is working" -ForegroundColor Green
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 401 -and $AuthRequired) {
            Write-Host "⚠️  AUTH REQUIRED - HTTP 401 (Expected for protected endpoints)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ FAILED - HTTP $statusCode" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Test health check first
Write-Host "`n1. Testing Health Check" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Health Check" -AuthRequired $false

# Test public subscription endpoints
Write-Host "`n2. Testing Subscription Endpoints" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/subscriptions/plans" -Description "Get All Subscription Plans" -AuthRequired $true

# Test authentication endpoints
Write-Host "`n3. Testing Authentication" -ForegroundColor Cyan
Write-Host "Note: These require valid credentials and are expected to fail in this test" -ForegroundColor Gray
Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Description "Login Endpoint" -AuthRequired $false

# Test protected subscription endpoints
Write-Host "`n4. Testing Protected Subscription Endpoints" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/subscriptions/current" -Description "Get Current Subscription" -AuthRequired $true
Test-Endpoint -Method "GET" -Endpoint "/subscriptions/status" -Description "Get Subscription Status" -AuthRequired $true
Test-Endpoint -Method "POST" -Endpoint "/subscriptions/activate-trial" -Description "Activate Trial" -AuthRequired $true

# Test payment endpoints
Write-Host "`n5. Testing Payment Endpoints" -ForegroundColor Cyan
Test-Endpoint -Method "POST" -Endpoint "/payments/create-order" -Description "Create Payment Order" -AuthRequired $true
Test-Endpoint -Method "GET" -Endpoint "/payments/history" -Description "Get Payment History" -AuthRequired $true

# Test feature access endpoints
Write-Host "`n6. Testing Feature Access Endpoints" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/subscriptions/features/properties/access" -Description "Check Properties Feature Access" -AuthRequired $true
Test-Endpoint -Method "GET" -Endpoint "/subscriptions/usage" -Description "Get Feature Usage" -AuthRequired $true

Write-Host "`n🎉 Test Complete!" -ForegroundColor Green
Write-Host "`nNotes:" -ForegroundColor Yellow
Write-Host "- ✅ SUCCESS: Endpoint is working correctly" -ForegroundColor Green
Write-Host "- ⚠️  AUTH REQUIRED: Endpoint requires authentication (expected)" -ForegroundColor Yellow
Write-Host "- ❌ FAILED: Endpoint has issues that need investigation" -ForegroundColor Red
Write-Host ""
Write-Host "To test with authentication:" -ForegroundColor Cyan
Write-Host "1. Start the backend: cd backend && go run cmd/api/main.go"
Write-Host "2. Start the frontend: cd frontend && npm run dev"
Write-Host "3. Register/login through the UI to get a token"
Write-Host "4. Set `$TOKEN variable and run this script again"
Write-Host ""
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend URL: http://localhost:8080" -ForegroundColor Green