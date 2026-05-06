# OTP System Test Script for Windows PowerShell
# Tests all OTP endpoints with various scenarios

$BaseUrl = "http://localhost:8080/api/auth"
$Mobile = "+919876543210"  # Change this to your test mobile number

Write-Host "================================" -ForegroundColor Cyan
Write-Host "OTP System Test Suite" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Send OTP
Write-Host "Test 1: Send OTP" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/send-otp"

$body = @{
    mobile_number = $Mobile
    purpose = "registration"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/send-otp" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host "✓ Test 1 PASSED" -ForegroundColor Green
    $OtpId = $response.data.otp_id
    Write-Host "OTP ID: $OtpId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Test 1 FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Wait for user to enter OTP
Write-Host "Please check your mobile for OTP" -ForegroundColor Yellow
$OtpCode = Read-Host "Enter OTP"
Write-Host ""

# Test 2: Verify OTP (Correct)
Write-Host "Test 2: Verify OTP (Correct)" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/verify-otp"

$body = @{
    otp_id = $OtpId
    mobile_number = $Mobile
    otp_code = $OtpCode
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/verify-otp" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host "✓ Test 2 PASSED" -ForegroundColor Green
} catch {
    Write-Host "✗ Test 2 FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 3: Send OTP Again
Write-Host "Test 3: Send OTP Again" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/send-otp"

$body = @{
    mobile_number = $Mobile
    purpose = "login"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/send-otp" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host "✓ Test 3 PASSED" -ForegroundColor Green
    $OtpId = $response.data.otp_id
} catch {
    Write-Host "✗ Test 3 FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 4: Resend OTP (Too Soon - Should Fail)
Write-Host "Test 4: Resend OTP (Too Soon - Should Fail with 429)" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/resend-otp"

$body = @{
    otp_id = $OtpId
    mobile_number = $Mobile
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/resend-otp" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✗ Test 4 FAILED (Expected 429 error)" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 10
} catch {
    if ($_.Exception.Response.StatusCode -eq 429) {
        Write-Host "✓ Test 4 PASSED (Cooldown working)" -ForegroundColor Green
        Write-Host $_.Exception.Message -ForegroundColor Cyan
    } else {
        Write-Host "✗ Test 4 FAILED (Expected 429)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Wait and Resend
Write-Host "Test 5: Wait 60 seconds and Resend OTP" -ForegroundColor Yellow
Write-Host "Waiting 60 seconds for cooldown..." -ForegroundColor Cyan
Start-Sleep -Seconds 60

Write-Host "POST $BaseUrl/resend-otp"

$body = @{
    otp_id = $OtpId
    mobile_number = $Mobile
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/resend-otp" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host "✓ Test 5 PASSED" -ForegroundColor Green
} catch {
    Write-Host "✗ Test 5 FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 6: Verify with Wrong OTP (Should Fail)
Write-Host "Test 6: Verify with Wrong OTP (Should Fail with 401)" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/verify-otp"

$body = @{
    otp_id = $OtpId
    mobile_number = $Mobile
    otp_code = "000000"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/verify-otp" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✗ Test 6 FAILED (Expected 401 error)" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 10
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Test 6 PASSED (Invalid OTP rejected)" -ForegroundColor Green
        Write-Host $_.Exception.Message -ForegroundColor Cyan
    } else {
        Write-Host "✗ Test 6 FAILED (Expected 401)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
