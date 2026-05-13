@echo off
echo Starting Friday...
cd /d "%~dp0friday\friday-v2\server"
start "Friday Server" cmd /k "node index.js"
timeout /t 2 >nul
cd /d "%~dp0friday\friday-v2\client"
start "Friday UI" cmd /k "npm run dev"
timeout /t 4 >nul
start http://localhost:5174
echo Friday is running at http://localhost:5174
