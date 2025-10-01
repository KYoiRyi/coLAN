#!/usr/bin/env python3
"""
coLAN - Portable LAN Collaboration Tool
Run this script to start the server
"""

import os
import sys
import subprocess
import platform

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 6):
        print("Error: Python 3.6 or higher is required")
        return False
    return True

def check_and_install_pip():
    """Check if pip is available and install if needed"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "--version"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        print("pip not found. Attempting to install...")
        try:
            # Try to install pip using ensurepip
            subprocess.check_call([sys.executable, "-m", "ensurepip", "--upgrade"],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("✓ pip installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("✗ Failed to install pip")
            print("Please install pip manually")
            return False

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        # Try user install first
        subprocess.check_call([
            sys.executable, "-m", "pip", "install",
            "-r", "requirements.txt", "--user", "--quiet"
        ])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        try:
            # Try without --user if first attempt fails
            print("Retrying without --user flag...")
            subprocess.check_call([
                sys.executable, "-m", "pip", "install",
                "-r", "requirements.txt", "--quiet"
            ])
            print("✓ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            # Try installing individual packages
            print("Trying individual package installation...")
            packages = ["flask", "flask-socketio", "Werkzeug==2.3.7"]
            for package in packages:
                try:
                    subprocess.check_call([
                        sys.executable, "-m", "pip", "install",
                        package, "--user", "--quiet"
                    ])
                    print(f"✓ Installed {package}")
                except subprocess.CalledProcessError:
                    try:
                        subprocess.check_call([
                            sys.executable, "-m", "pip", "install",
                            package, "--quiet"
                        ])
                        print(f"✓ Installed {package}")
                    except subprocess.CalledProcessError:
                        print(f"✗ Failed to install {package}")
                        continue
            return True
    except Exception as e:
        print(f"✗ Installation failed: {e}")
        print("Please install manually: pip install flask flask-socketio")
        return False

def main():
    print("=" * 50)
    print("🌐 coLAN - LAN Collaboration Tool")
    print("=" * 50)

    if not check_python_version():
        input("Press Enter to exit...")
        return

    if not check_and_install_pip():
        input("Press Enter to exit...")
        return

    # Try to import required modules
    modules_missing = False
    try:
        import flask
        import flask_socketio
        print("✓ All dependencies are available")
    except ImportError as e:
        print(f"Required packages not found: {e}")
        print("Installing dependencies...")
        modules_missing = True

    if modules_missing:
        if not install_requirements():
            print("\n⚠️  Could not install all dependencies automatically")
            print("Please install manually and try again:")
            print("  pip install flask flask-socketio")
            input("Press Enter to exit...")
            return

        # Try importing again after installation
        try:
            import flask
            import flask_socketio
            print("✓ Dependencies successfully installed and verified")
        except ImportError as e:
            print(f"\n❌ Dependencies still missing after installation: {e}")
            print("Please install manually:")
            print("  pip install flask flask-socketio")
            input("Press Enter to exit...")
            return

    # Start the Flask app
    try:
        print("\nStarting coLAN server...")
        print("Close this window or press Ctrl+C to stop the server")
        print("-" * 50)

        # Import and run the app
        from app import socketio, app, get_local_ip
        from port_manager import PortManager

        # Find available port
        port_manager = PortManager()
        port = port_manager.find_available_port()

        # Store port in app for route access
        app.server_port = port

        local_ip = get_local_ip()

        print(f"🌐 coLAN Server is running!")
        print(f"📱 Local access: http://127.0.0.1:{port}")
        print(f"🌐 LAN access: http://{local_ip}:{port}")
        print(f"📁 Files saved in: {os.path.abspath('uploads')}")
        print(f"💾 Data saved in: {os.path.abspath('data')}")
        print("-" * 50)
        print("Share the LAN URL with others on your network!")
        print("Press Ctrl+C to stop the server")
        print("=" * 50)

        socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)

    except ImportError as e:
        print(f"Error importing app: {e}")
        print("Make sure app.py is in the same directory")
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")

    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()