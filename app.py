#!/usr/bin/env python3
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import json
import hashlib
import uuid
from datetime import datetime
import threading
import socket
import pickle

app = Flask(__name__)
app.config['SECRET_KEY'] = 'coLAN-secret-key-' + str(uuid.uuid4())
app.config['UPLOAD_FOLDER'] = 'uploads'
socketio = SocketIO(app, cors_allowed_origins="*")

rooms = {}
room_users = {}
room_messages = {}
active_users_by_room = {}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('data', exist_ok=True)

DATA_FILE = 'data/rooms_data.pkl'

def save_data():
    data = {
        'rooms': rooms,
        'room_messages': room_messages
    }
    with open(DATA_FILE, 'wb') as f:
        pickle.dump(data, f)

def load_data():
    global rooms, room_messages
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'rb') as f:
                data = pickle.load(f)
                rooms = data.get('rooms', {})
                room_messages = data.get('room_messages', {})
                for room_id in rooms.keys():
                    if room_id not in room_users:
                        room_users[room_id] = []
                    if room_id not in active_users_by_room:
                        active_users_by_room[room_id] = set()
        except:
            pass

load_data()

def get_local_ip():
    """Get the local IP address, preferring 192.168.x.x or 10.x.x.x over VPN IPs"""
    import subprocess
    import platform

    # Try using system commands first
    try:
        system = platform.system().lower()

        if system == "linux":
            # Try to get IP from ip command
            result = subprocess.run(['ip', 'route', 'get', '1.1.1.1'],
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'src' in line:
                        parts = line.split()
                        for i, part in enumerate(parts):
                            if part == 'src' and i + 1 < len(parts):
                                ip = parts[i + 1]
                                if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                                    if not ip.startswith('198.18.'):
                                        return ip

        elif system == "darwin":  # macOS
            result = subprocess.run(['route', 'get', 'default'],
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'interface:' in line:
                        interface = line.split(':')[1].strip()
                        ip_result = subprocess.run(['ifconfig', interface],
                                                 capture_output=True, text=True, timeout=5)
                        if ip_result.returncode == 0:
                            for ip_line in ip_result.stdout.split('\n'):
                                if 'inet ' in ip_line and '127.0.0.1' not in ip_line:
                                    ip = ip_line.split()[1]
                                    if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                                        if not ip.startswith('198.18.'):
                                            return ip

        elif system == "windows":
            result = subprocess.run(['ipconfig'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for i, line in enumerate(lines):
                    if 'IPv4' in line and 'Address' in line:
                        ip = line.split(':')[-1].strip()
                        if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                            if not ip.startswith('198.18.'):
                                return ip

    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass

    # Try netifaces if available
    try:
        import netifaces
        interfaces = netifaces.interfaces()
        local_ips = []

        for interface in interfaces:
            addrs = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addrs:
                for addr_info in addrs[netifaces.AF_INET]:
                    ip = addr_info['addr']
                    if (ip.startswith('192.168.') or
                        ip.startswith('10.') or
                        ip.startswith('172.')):
                        if not ip.startswith('198.18.'):
                            local_ips.append(ip)

        # Prefer 192.168.x.x addresses
        for ip in local_ips:
            if ip.startswith('192.168.'):
                return ip

        # Then try 10.x.x.x
        for ip in local_ips:
            if ip.startswith('10.'):
                return ip

        if local_ips:
            return local_ips[0]

    except ImportError:
        pass
    except Exception:
        pass

    # Fallback method using socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()

        # If it's a VPN IP, try to find a better one
        if ip.startswith('198.18.') or ip.startswith('100.'):
            # Try connecting to common router IPs
            router_ips = ['192.168.1.1', '192.168.0.1', '10.0.0.1', '172.16.0.1']
            for router_ip in router_ips:
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    s.connect((router_ip, 80))
                    local_ip = s.getsockname()[0]
                    s.close()
                    if local_ip.startswith('192.168.') or local_ip.startswith('10.') or local_ip.startswith('172.'):
                        if not local_ip.startswith('198.18.'):
                            return local_ip
                except:
                    continue

        return ip
    except:
        return "127.0.0.1"

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest() if password else None

@app.route('/')
def index():
    local_ip = get_local_ip()
    return render_template('index.html', rooms=rooms, server_ip=local_ip, server_port=5000)

@app.route('/api/rooms')
def get_rooms():
    room_list = []
    for room_id, room_data in rooms.items():
        room_list.append({
            'id': room_id,
            'name': room_data['name'],
            'has_password': bool(room_data['password']),
            'user_count': len(room_users.get(room_id, []))
        })
    return jsonify(room_list)

@app.route('/api/create_room', methods=['POST'])
def create_room():
    data = request.json
    room_name = data.get('name', '').strip()
    password = data.get('password', '').strip()

    if not room_name:
        return jsonify({'error': 'Room name is required'}), 400

    room_id = str(uuid.uuid4())[:8]
    rooms[room_id] = {
        'name': room_name,
        'password': hash_password(password) if password else None,
        'created_at': datetime.now().isoformat()
    }
    room_users[room_id] = []
    room_messages[room_id] = []
    active_users_by_room[room_id] = set()

    save_data()
    return jsonify({'room_id': room_id})

@app.route('/api/join_room', methods=['POST'])
def join_room_api():
    data = request.json
    room_id = data.get('room_id')
    password = data.get('password', '')

    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404

    room = rooms[room_id]
    if room['password'] and hash_password(password) != room['password']:
        return jsonify({'error': 'Invalid password'}), 403

    return jsonify({'success': True})

@app.route('/room/<room_id>')
def room_page(room_id):
    if room_id not in rooms:
        return redirect(url_for('index'))
    return render_template('room.html', room_id=room_id, room_name=rooms[room_id]['name'])

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    room_id = request.form.get('room_id')

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404

    filename = str(uuid.uuid4())[:8] + '_' + file.filename
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    return jsonify({
        'filename': filename,
        'original_name': file.filename,
        'url': f'/uploads/{filename}'
    })

@socketio.on('connect')
def on_connect():
    print(f'User connected: {request.sid}')

@socketio.on('disconnect')
def on_disconnect():
    print(f'User disconnected: {request.sid}')
    for room_id, users in room_users.items():
        room_users[room_id] = [u for u in users if u['sid'] != request.sid]
        if room_id in active_users_by_room:
            active_users_by_room[room_id].discard(request.sid)
        emit('user_left', {'user_count': len(room_users[room_id])}, room=room_id)

@socketio.on('join')
def on_join(data):
    room_id = data['room']
    username = data['username']

    if room_id not in rooms:
        emit('error', {'message': 'Room not found'})
        return

    if room_id not in active_users_by_room:
        active_users_by_room[room_id] = set()

    existing_usernames = [u['username'] for u in room_users.get(room_id, [])]
    if username in existing_usernames:
        emit('username_taken', {'message': f'Username "{username}" is already taken in this room'})
        return

    join_room(room_id)

    if room_id not in room_users:
        room_users[room_id] = []

    user_info = {'sid': request.sid, 'username': username}
    room_users[room_id].append(user_info)
    active_users_by_room[room_id].add(request.sid)

    emit('join_success', {'message': 'Successfully joined room'})
    emit('user_joined', {
        'username': username,
        'user_count': len(room_users[room_id])
    }, room=room_id)

    if room_id in room_messages:
        emit('message_history', room_messages[room_id])

@socketio.on('leave')
def on_leave(data):
    room_id = data['room']
    leave_room(room_id)

    if room_id in room_users:
        room_users[room_id] = [u for u in room_users[room_id] if u['sid'] != request.sid]
        if room_id in active_users_by_room:
            active_users_by_room[room_id].discard(request.sid)
        emit('user_left', {'user_count': len(room_users[room_id])}, room=room_id)

@socketio.on('message')
def handle_message(data):
    room_id = data['room']
    username = data['username']
    message = data['message']

    if room_id not in rooms:
        return

    message_data = {
        'username': username,
        'message': message,
        'timestamp': datetime.now().isoformat(),
        'type': 'text'
    }

    if room_id not in room_messages:
        room_messages[room_id] = []

    room_messages[room_id].append(message_data)
    save_data()
    emit('message', message_data, room=room_id)

@socketio.on('file_shared')
def handle_file_share(data):
    room_id = data['room']
    username = data['username']
    file_info = data['file_info']

    if room_id not in rooms:
        return

    message_data = {
        'username': username,
        'message': f'shared a file: {file_info["original_name"]}',
        'timestamp': datetime.now().isoformat(),
        'type': 'file',
        'file_info': file_info
    }

    if room_id not in room_messages:
        room_messages[room_id] = []

    room_messages[room_id].append(message_data)
    save_data()
    emit('message', message_data, room=room_id)

if __name__ == '__main__':
    local_ip = get_local_ip()
    print(f"coLAN Server starting...")
    print(f"Local access: http://127.0.0.1:5000")
    print(f"LAN access: http://{local_ip}:5000")
    print("Press Ctrl+C to stop the server")

    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)