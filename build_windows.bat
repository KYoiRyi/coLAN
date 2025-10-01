@echo off
REM coLAN Windows Build Script
REM Creates a standalone Windows executable using Nuitka

setlocal enabledelayedexpansion

echo ============================================================
echo 🔨 coLAN Windows Build Script (Nuitka)
echo ============================================================
echo.

REM Check if we're in the right directory
if not exist "app.py" (
    echo ✗ Error: app.py not found. Please run this script from the coLAN directory.
    pause
    exit /b 1
)

REM Check Python version
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Error: Python not found. Please install Python 3.7+ first.
    pause
    exit /b 1
)

echo ✓ Python is available

REM Check if Nuitka is installed
python -m nuitka --version >nul 2>&1
if errorlevel 1 (
    echo Nuitka not found. Installing...
    python -m pip install nuitka --user
    if errorlevel 1 (
        echo ✗ Failed to install Nuitka
        pause
        exit /b 1
    )
    echo ✓ Nuitka installed successfully
) else (
    echo ✓ Nuitka is available
)

REM Create build directory
echo Creating build directory...
if exist "build_windows" rmdir /s /q "build_windows"
mkdir "build_windows"

REM Copy necessary files
echo Copying project files...
copy "app.py" "build_windows\" >nul
copy "start.py" "build_windows\" >nul
copy "requirements.txt" "build_windows\" >nul
copy "README.md" "build_windows\" >nul

REM Copy directories
if exist "templates" (
    xcopy "templates" "build_windows\templates\" /e /i /q >nul
)

if exist "static" (
    xcopy "static" "build_windows\static\" /e /i /q >nul
)

echo ✓ Files copied successfully

REM Build executable
echo.
echo Building Windows executable with Nuitka...
echo This may take several minutes on first build...
echo.

python -m nuitka ^
    --standalone ^
    --onefile ^
    --windows-console-mode=force ^
    --include-data-dir=build_windows/templates=templates ^
    --include-data-dir=build_windows/static=static ^
    --include-package=flask ^
    --include-package=flask_socketio ^
    --include-package=werkzeug ^
    --include-package=socketio ^
    --include-package=engineio ^
    --plugin-enable=anti-bloat ^
    --assume-yes-for-downloads ^
    --output-dir=build_windows/dist ^
    --output-filename=coLAN.exe ^
    build_windows/start.py

if errorlevel 1 (
    echo ✗ Build failed
    pause
    exit /b 1
)

echo ✓ Build completed successfully

REM Create release package
echo.
echo Creating release package...

set RELEASE_DIR=coLAN_Windows_Release
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

REM Copy executable
if exist "build_windows\dist\coLAN.exe" (
    copy "build_windows\dist\coLAN.exe" "%RELEASE_DIR%\" >nul
) else (
    echo ✗ Executable not found
    pause
    exit /b 1
)

REM Copy documentation
if exist "README.md" copy "README.md" "%RELEASE_DIR%\" >nul

REM Create startup batch file
echo @echo off > "%RELEASE_DIR%\start_coLAN.bat"
echo echo. >> "%RELEASE_DIR%\start_coLAN.bat"
echo echo ================================================ >> "%RELEASE_DIR%\start_coLAN.bat"
echo echo 🌐 coLAN - LAN Collaboration Tool >> "%RELEASE_DIR%\start_coLAN.bat"
echo echo ================================================ >> "%RELEASE_DIR%\start_coLAN.bat"
echo echo. >> "%RELEASE_DIR%\start_coLAN.bat"
echo echo Starting coLAN server... >> "%RELEASE_DIR%\start_coLAN.bat"
echo echo. >> "%RELEASE_DIR%\start_coLAN.bat"
echo. >> "%RELEASE_DIR%\start_coLAN.bat"
echo coLAN.exe >> "%RELEASE_DIR%\start_coLAN.bat"
echo. >> "%RELEASE_DIR%\start_coLAN.bat"
echo pause >> "%RELEASE_DIR%\start_coLAN.bat"

echo ✓ Release package created

echo.
echo ============================================================
echo 🎉 Build completed successfully!
echo ============================================================
echo Your Windows executable is ready in: %RELEASE_DIR%\
echo Run 'start_coLAN.bat' or 'coLAN.exe' to start the server
echo Compatible with Windows 7+ (Python 3.7+)
echo.

pause