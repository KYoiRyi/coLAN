#!/usr/bin/env python3
"""
coLAN Nuitka Build Script
Creates a standalone Windows executable for coLAN
"""

import os
import sys
import subprocess
import shutil

def check_nuitka():
    """Check if Nuitka is installed"""
    try:
        subprocess.check_call([sys.executable, "-m", "nuitka", "--version"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False

def install_nuitka():
    """Install Nuitka"""
    print("Installing Nuitka...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "nuitka", "--user"
        ])
        print("✓ Nuitka installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to install Nuitka")
        return False

def create_build_directory():
    """Create build directory structure"""
    if os.path.exists("build_windows"):
        shutil.rmtree("build_windows")

    os.makedirs("build_windows", exist_ok=True)

    # Copy necessary files
    files_to_copy = [
        "app.py",
        "start.py",
        "requirements.txt",
        "README.md"
    ]

    for file in files_to_copy:
        if os.path.exists(file):
            shutil.copy2(file, "build_windows/")

    # Copy directories
    dirs_to_copy = ["templates", "static"]
    for dir_name in dirs_to_copy:
        if os.path.exists(dir_name):
            shutil.copytree(dir_name, f"build_windows/{dir_name}")

def build_executable():
    """Build the executable using Nuitka"""
    print("Building Windows executable with Nuitka...")

    build_cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--onefile",
        "--windows-console-mode=force",
        "--include-data-dir=templates=templates",
        "--include-data-dir=static=static",
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
    ]

    try:
        subprocess.check_call(build_cmd)
        print("✓ Build completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Build failed: {e}")
        return False

def create_release_package():
    """Create release package"""
    print("Creating release package...")

    # Create release directory
    release_dir = "coLAN_Windows_Release"
    if os.path.exists(release_dir):
        shutil.rmtree(release_dir)

    os.makedirs(release_dir)

    # Copy executable
    exe_path = "build_windows/dist/coLAN.exe"
    if os.path.exists(exe_path):
        shutil.copy2(exe_path, release_dir)

    # Copy documentation
    if os.path.exists("README.md"):
        shutil.copy2("README.md", release_dir)

    # Create startup batch file
    with open(f"{release_dir}/start_coLAN.bat", "w") as f:
        f.write("""@echo off
echo.
echo ================================================
echo 🌐 coLAN - LAN Collaboration Tool
echo ================================================
echo.
echo Starting coLAN server...
echo.

coLAN.exe

pause
""")

    print(f"✓ Release package created in: {release_dir}/")
    return True

def main():
    print("=" * 60)
    print("🔨 coLAN Windows Build Script (Nuitka)")
    print("=" * 60)

    # Check if we're in the right directory
    if not os.path.exists("app.py"):
        print("✗ Error: app.py not found. Please run this script from the coLAN directory.")
        return False

    # Check Python version
    if sys.version_info < (3, 7):
        print("✗ Error: Python 3.7 or higher is required for Windows 7 compatibility")
        return False

    print(f"✓ Python version: {sys.version}")

    # Check/install Nuitka
    if not check_nuitka():
        print("Nuitka not found. Installing...")
        if not install_nuitka():
            return False
    else:
        print("✓ Nuitka is available")

    # Create build directory
    print("Creating build directory...")
    create_build_directory()
    print("✓ Build directory created")

    # Build executable
    if not build_executable():
        return False

    # Create release package
    if not create_release_package():
        return False

    print("\n" + "=" * 60)
    print("🎉 Build completed successfully!")
    print("=" * 60)
    print("Your Windows executable is ready in: coLAN_Windows_Release/")
    print("Run 'start_coLAN.bat' or 'coLAN.exe' to start the server")
    print("Compatible with Windows 7+ (Python 3.7+)")
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)