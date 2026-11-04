@echo off
cd /d "%~dp0"
echo ===== Checking Node.js =====
node -v >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install the LTS version from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
echo ===== Installing Firebase CLI =====
call npm i -g firebase-tools
echo ===== Login: a browser window will open. Choose the Google account that owns the project, then click Allow =====
call firebase login
echo ===== Selecting project =====
call firebase use new-project-33191
echo ===== Uploading website =====
call firebase deploy
echo.
echo If you see "Deploy complete!" above, your site is at the Hosting URL shown.
pause
