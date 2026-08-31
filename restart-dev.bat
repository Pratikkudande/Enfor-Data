@echo off
echo ==========================================
echo Restarting EnforData Development Environment
echo ==========================================
echo.

echo Step 1: Checking if processes are running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Found Node.js processes running
    echo Killing Node.js processes...
    taskkill /F /IM node.exe /T >NUL 2>&1
    timeout /t 2 /nobreak >NUL
    echo Node.js processes stopped
) else (
    echo No Node.js processes found
)

echo.
echo Step 2: Starting Backend...
cd /d "%~dp0backend"
start "EnforData Backend" cmd /k "go run cmd/api/main.go"
echo Backend started in new window

echo.
echo Step 3: Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak >NUL

echo.
echo Step 4: Starting Frontend...
cd /d "%~dp0frontend"
start "EnforData Frontend" cmd /k "npm run dev"
echo Frontend started in new window

echo.
echo ==========================================
echo Development Environment Started!
echo ==========================================
echo.
echo Backend: Check the "EnforData Backend" window
echo   - Look for: "✅ SMS Service initialized with Fast2SMS provider on startup"
echo.
echo Frontend: Check the "EnforData Frontend" window
echo   - Wait for: "Local: http://localhost:3000" or similar
echo.
echo After both are running:
echo 1. Open browser to http://localhost:3000
echo 2. Clear browser cache (Ctrl+Shift+Delete)
echo 3. Navigate to SMS Marketing
echo 4. Check browser console (F12) for logs
echo.
pause
