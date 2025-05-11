@echo off
echo Checking Node.js installation...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    echo After installation, please run this script again.
    pause
    exit /b 1
)

echo Node.js is installed.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b 1
)

echo Frontend dependencies installed successfully.
cd ..
echo Setup completed successfully.
pause 