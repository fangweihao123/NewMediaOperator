@echo off
echo Starting backend service...

cd backend

:: 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    pause
    exit /b 1
)

:: 检查依赖是否安装
echo Checking dependencies...
pip install -r requirements.txt

:: 启动 Flask 应用
echo Starting Flask application...
python app.py

if %errorlevel% neq 0 (
    echo Failed to start Flask application
    pause
    exit /b 1
)

pause 