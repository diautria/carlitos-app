@echo off
REM BebecioApp Load Testing Script
REM Usage: run-load-test.bat [vus] [duration]

setlocal enabledelayedexpansion

REM Default values
set VUS=10
set DURATION=60
set URL=http://localhost:8100

REM Parse arguments
if not "%~1"=="" set VUS=%~1
if not "%~2"=="" set DURATION=%~2

echo.
echo ====================================
echo BebecioApp - Load Testing
echo ====================================
echo.
echo Configuration:
echo   Virtual Users: %VUS%
echo   Duration: %DURATION% seconds
echo   Target URL: %URL%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

REM Run the load test
echo Starting test...
echo.

node tests/simple-load-test.js --vus=%VUS% --duration=%DURATION% --url=%URL%

echo.
echo Test completed.
pause
