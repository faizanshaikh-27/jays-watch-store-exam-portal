@echo off
echo.
echo  Jay's Watch Store -- Exam Portal
echo  ==================================
echo.
cd /d "%~dp0backend"

if not exist ".env" (
  echo  [SETUP] No .env file found. Copying .env.example to .env...
  copy .env.example .env
  echo.
  echo  IMPORTANT: Edit backend\.env with your MongoDB connection string.
  echo  Then run this file again.
  echo.
  pause
  exit /b
)

if not exist "node_modules" (
  echo  Installing dependencies...
  npm install
)

echo  Starting server on http://localhost:3001
echo.
npm start
pause
