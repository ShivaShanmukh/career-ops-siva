@echo off
echo Starting Friday...
echo.

cd /d "%~dp0server"
start "Friday Server" cmd /k "npm install --silent 2>nul && node index.js"

timeout /t 2 >nul

cd /d "%~dp0client"
start "Friday UI" cmd /k "npm install --silent 2>nul && npm run dev"

timeout /t 3 >nul

start http://localhost:5174
echo Friday is running at http://localhost:5174
