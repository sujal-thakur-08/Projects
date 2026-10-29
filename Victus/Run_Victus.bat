@echo off
REM Victus Voice Assistant - Double-click launcher
REM Prefer the bundled virtual environment, then fall back to pythonw on PATH.

cd /d "%~dp0"

if not exist "run_victus.pyw" (
    echo Could not find run_victus.pyw in "%~dp0".
    pause
    exit /b 1
)

set "PYTHONW="
if exist ".venv\Scripts\pythonw.exe" (
    set "PYTHONW=%~dp0.venv\Scripts\pythonw.exe"
) else (
    where pythonw.exe >nul 2>&1
    if not errorlevel 1 set "PYTHONW=pythonw.exe"
)

if not defined PYTHONW (
    echo Victus could not find Python. Create the .venv folder or add pythonw.exe to PATH.
    pause
    exit /b 1
)

start "" "%PYTHONW%" "%~dp0run_victus.pyw"
if errorlevel 1 (
    echo Victus could not be started.
    pause
    exit /b 1
)
