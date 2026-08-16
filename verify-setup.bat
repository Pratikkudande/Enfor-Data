@echo off
echo ==========================================
echo Verifying EnforData SMS Setup
echo ==========================================
echo.

echo Checking config.env settings...
cd /d "%~dp0backend"
echo.
echo SMS_PROVIDER setting:
findstr /C:"SMS_PROVIDER" config.env
echo.
echo Fast2SMS settings:
findstr /C:"FAST2SMS" config.env | findstr /V "AUTH_KEY"
echo.

echo ==========================================
echo.
echo Checking if services are running...
echo.

netstat -ano | findstr ":8080" >nul
if %ERRORLEVEL%==0 (
    echo [OK] Backend appears to be running on port 8080
) else (
    echo [ERROR] Backend is NOT running on port 8080
)

netstat -ano | findstr ":3000" >nul
if %ERRORLEVEL%==0 (
    echo [OK] Frontend appears to be running on port 3000
) else (
    netstat -ano | findstr ":5173" >nul
    if %ERRORLEVEL%==0 (
        echo [OK] Frontend appears to be running on port 5173 ^(Vite^)
    ) else (
        echo [ERROR] Frontend is NOT running on port 3000 or 5173
    )
)

echo.
echo ==========================================
echo.
echo To fix issues:
echo 1. Run restart-dev.bat to restart both services
echo 2. Check console logs in the opened windows
echo 3. Clear browser cache after restart
echo.
pause
