@echo off
echo Starting NewMediaOperator...

echo Starting backend service...
start cmd /k "cd /d %~dp0backend && npm install && npm start"

echo Starting frontend service...
start cmd /k "cd /d %~dp0frontend && npm install && npm run serve"

echo Services started. Press any key to exit this window.
pause 