# PowerShell Build Script for coLAN
# Creates a standalone Windows executable using Nuitka

Write-Host "============================================================" -ForegroundColor Blue
Write-Host "🔨 coLAN Windows Build Script (Nuitka)" -ForegroundColor Blue
Write-Host "============================================================" -ForegroundColor Blue
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "app.py")) {
    Write-Host "✗ Error: app.py not found. Please run this script from the coLAN directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Python version
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✓ Python is available: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Python not found. Please install Python 3.7+ first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Nuitka is installed
try {
    python -m nuitka --version *>$null
    Write-Host "✓ Nuitka is available" -ForegroundColor Green
} catch {
    Write-Host "Nuitka not found. Installing..." -ForegroundColor Yellow
    try {
        python -m pip install nuitka --user
        Write-Host "✓ Nuitka installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install Nuitka" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Create build directory
Write-Host "Creating build directory..." -ForegroundColor Cyan
if (Test-Path "build_windows") {
    Remove-Item "build_windows" -Recurse -Force
}
New-Item -ItemType Directory -Name "build_windows" | Out-Null

# Copy necessary files
Write-Host "Copying project files..." -ForegroundColor Cyan
Copy-Item "app.py" "build_windows/"
Copy-Item "start.py" "build_windows/"
Copy-Item "requirements.txt" "build_windows/"
if (Test-Path "README.md") { Copy-Item "README.md" "build_windows/" }

# Copy directories
if (Test-Path "templates") {
    Copy-Item "templates" "build_windows/" -Recurse
}

if (Test-Path "static") {
    Copy-Item "static" "build_windows/" -Recurse
}

Write-Host "✓ Files copied successfully" -ForegroundColor Green

# Build executable
Write-Host ""
Write-Host "Building Windows executable with Nuitka..." -ForegroundColor Cyan
Write-Host "This may take several minutes on first build..." -ForegroundColor Yellow
Write-Host ""

$buildArgs = @(
    "-m", "nuitka",
    "--standalone",
    "--onefile",
    "--windows-console-mode=force",
    "--include-data-dir=build_windows/templates=templates",
    "--include-data-dir=build_windows/static=static",
    "--include-package=flask",
    "--include-package=flask_socketio",
    "--include-package=werkzeug",
    "--include-package=socketio",
    "--include-package=engineio",
    "--plugin-enable=anti-bloat",
    "--assume-yes-for-downloads",
    "--output-dir=build_windows/dist",
    "--output-filename=coLAN.exe",
    "build_windows/start.py"
)

try {
    & python $buildArgs
    Write-Host "✓ Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create release package
Write-Host ""
Write-Host "Creating release package..." -ForegroundColor Cyan

$releaseDir = "coLAN_Windows_Release"
if (Test-Path $releaseDir) {
    Remove-Item $releaseDir -Recurse -Force
}
New-Item -ItemType Directory -Name $releaseDir | Out-Null

# Copy executable
if (Test-Path "build_windows/dist/coLAN.exe") {
    Copy-Item "build_windows/dist/coLAN.exe" "$releaseDir/"
} else {
    Write-Host "✗ Executable not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Copy documentation
if (Test-Path "README.md") {
    Copy-Item "README.md" "$releaseDir/"
}

# Create startup batch file
$batchContent = @"
@echo off
echo.
echo ================================================
echo 🌐 coLAN - LAN Collaboration Tool
echo ================================================
echo.
echo Starting coLAN server...
echo.

coLAN.exe

pause
"@

$batchContent | Out-File -FilePath "$releaseDir/start_coLAN.bat" -Encoding ASCII

Write-Host "✓ Release package created" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Blue
Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Blue
Write-Host "Your Windows executable is ready in: $releaseDir/" -ForegroundColor Green
Write-Host "Run 'start_coLAN.bat' or 'coLAN.exe' to start the server" -ForegroundColor Green
Write-Host "Compatible with Windows 7+ (Python 3.7+)" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"