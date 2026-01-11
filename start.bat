@echo off
echo Starting Presets Marketplace...
echo.

echo Starting Backend Server...
start cmd /k "cd server && npm start"

timeout /t 5

echo Starting React Frontend...
start cmd /k "cd client && npm start"

echo.
echo Application will open at:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo.
pause