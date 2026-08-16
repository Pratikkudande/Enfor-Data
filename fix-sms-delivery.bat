@echo off
echo ==========================================
echo Fixing SMS Delivery Issue
echo ==========================================
echo.

echo Current issue: SMS shows SUCCESS but not received
echo Root cause: DLT route requires registered template
echo.
echo Solution: Switch to non-DLT route for testing
echo.

cd /d "%~dp0backend"

echo Creating backup of config.env...
copy config.env config.env.backup >nul 2>&1

echo.
echo Updating FAST2SMS_ROUTE from 'dlt' to 'q' (Quality route)...
echo.

powershell -Command "(Get-Content config.env) -replace 'FAST2SMS_ROUTE=dlt', 'FAST2SMS_ROUTE=q' | Set-Content config.env"

echo ✓ Configuration updated!
echo.
echo Changes made:
echo   FAST2SMS_ROUTE=dlt  →  FAST2SMS_ROUTE=q
echo.
echo The 'q' route is for testing and doesn't require DLT templates.
echo.
echo ==========================================
echo Next Steps:
echo ==========================================
echo.
echo 1. Restart the backend server
echo 2. Try sending an SMS again
echo 3. SMS should be received within 1-2 minutes
echo.
echo Note: Route 'q' has daily limits (usually 100 SMS/day)
echo For production, you'll need proper DLT template configuration
echo.
echo Backup saved as: config.env.backup
echo To revert: copy config.env.backup config.env
echo.
pause
