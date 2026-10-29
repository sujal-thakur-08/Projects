@echo off
REM Launcher for Apple Music Mini Player
SETLOCAL
SET "THIS_DIR=%~dp0"
REM Add portable node to PATH for this session
SET "PATH=%THIS_DIR%\.local\node;%PATH%"
CD /D "%THIS_DIR%"
REM Start the app hidden (use PowerShell to run npm start without showing console)
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%THIS_DIR%\.local\node\npm.cmd' -ArgumentList 'start' -WorkingDirectory '%THIS_DIR%' -WindowStyle Hidden"
ENDLOCAL
