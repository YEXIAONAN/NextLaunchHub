@echo off
setlocal

set "PROJECT_DIR=%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo Missing Node.js. Install Node.js 20 or later first.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Missing npm. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

if not exist "%PROJECT_DIR%\server\.env" (
  echo Missing server\.env. Copy server\.env.example and configure the database first.
  pause
  exit /b 1
)

if not exist "%PROJECT_DIR%\server\node_modules" (
  echo Installing server dependencies...
  pushd "%PROJECT_DIR%\server"
  call npm ci
  if errorlevel 1 (
    popd
    pause
    exit /b 1
  )
  popd
)

if not exist "%PROJECT_DIR%\web\node_modules" (
  echo Installing web dependencies...
  pushd "%PROJECT_DIR%\web"
  call npm ci
  if errorlevel 1 (
    popd
    pause
    exit /b 1
  )
  popd
)

start "NextLaunch Hub API" cmd /k "cd /d ""%PROJECT_DIR%\server"" && npm run dev"
start "NextLaunch Hub Web" cmd /k "cd /d ""%PROJECT_DIR%\web"" && npm run dev"

echo NextLaunch Hub is starting.
echo Web: http://localhost:5173
echo API: http://localhost:3000
timeout /t 3 >nul

endlocal
