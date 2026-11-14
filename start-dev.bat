@echo off
echo ========================================================
echo   Starting GreenGrow AI Agriculture Application
echo ========================================================
echo.
echo 1. Starting Backend API on http://localhost:5001 ...
start "GreenGrow Backend" cmd /k "cd backend && npm.cmd run dev"

echo 2. Starting Frontend Web App on http://localhost:5173 ...
start "GreenGrow Frontend" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo Both servers are launching in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:5001/api/health
echo ========================================================
