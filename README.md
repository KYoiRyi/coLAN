# coLAN - LAN Collaboration Tool 🌐

A portable Python-based local area network collaboration tool that allows users to create chat rooms, share files, and communicate in real-time.

## Features

- 🏠 **Create & Join Rooms**: Create password-protected or open chat rooms
- 💬 **Real-time Chat**: Instant messaging with WebSocket support
- 📁 **File Sharing**: Upload and share files within rooms
- 👥 **Multi-user Support**: Multiple users can join the same room
- 🔒 **Password Protection**: Optional room passwords for privacy
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎒 **Portable**: Can be run from a USB drive

## Quick Start

### Windows
Double-click `start.bat`

### Linux/macOS
Run `./start.sh` or `python3 start.py`

## Manual Installation

1. Ensure Python 3.6+ is installed
2. Install dependencies:
   ```bash
   pip install flask flask-socketio
   ```
3. Run the server:
   ```bash
   python app.py
   ```

## Usage

1. Start the server using one of the methods above
2. Access the web interface at:
   - Local: http://127.0.0.1:5000
   - LAN: http://[your-ip]:5000
3. Create a new room or join an existing one
4. Start chatting and sharing files!

## File Structure

```
coLAN/
├── app.py              # Main Flask application
├── start.py            # Portable launcher script
├── start.bat           # Windows launcher
├── start.sh            # Linux/macOS launcher
├── requirements.txt    # Python dependencies
├── templates/
│   ├── index.html     # Room listing page
│   └── room.html      # Chat room interface
├── uploads/           # Uploaded files storage
└── README.md          # This file
```

## Technical Details

- **Backend**: Flask + Flask-SocketIO
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Real-time Communication**: WebSocket (Socket.IO)
- **File Storage**: Local filesystem
- **Data Persistence**: In-memory (session-based)

## Security Notes

- Room passwords are hashed using SHA-256
- Files are stored locally on the server machine
- No external dependencies for core functionality
- All communication is within the local network

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

**Port already in use:**
- Change the port in `app.py` (line with `port=5000`)

**Cannot access from other devices:**
- Check firewall settings
- Ensure all devices are on the same network
- Try the IP address shown in the console

**Dependencies not installing:**
- Install manually: `pip install flask flask-socketio`
- Use `pip3` instead of `pip` on some systems

## License

This project is open source and available under the MIT License.