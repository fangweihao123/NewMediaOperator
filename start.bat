@echo off
echo Starting NewMediaOperator...

echo Starting backend service...
start cmd /k "cd /d %~dp0backend && python app.py"

echo Starting frontend service...
start cmd /k "cd /d %~dp0frontend && npm run serve"

echo Services started. Press any key to exit this window.
pause 