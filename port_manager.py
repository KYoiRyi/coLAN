#!/usr/bin/env python3
"""
Port management utility for coLAN
Handles port conflict detection and automatic port selection
"""

import socket
import random

class PortManager:
    def __init__(self):
        # Default port to try first
        self.default_port = 5000

        # Alternative ports to try (avoiding Clash and other common ports)
        self.alternative_ports = [5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009]

        # Ports to avoid (Clash proxy ports and other common services)
        self.blocked_ports = {
            7890,  # Clash HTTP proxy
            7891,  # Clash SOCKS proxy
            8080,  # Common HTTP proxy
            8081,  # Alternative HTTP proxy
            8082,  # Alternative HTTP proxy
            9090,  # Clash external controller
            9091,  # Clash external controller alternative
            3128,  # Squid proxy
            1080,  # SOCKS proxy
            8888,  # Common proxy port
            3000,  # Common dev server
            8000,  # Common dev server
            8443,  # HTTPS alternative
            9000,  # Common application port
        }

    def is_port_available(self, port):
        """Check if a port is available for binding"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                sock.bind(('0.0.0.0', port))
                return True
        except (socket.error, OSError):
            return False

    def get_random_high_port(self):
        """Get a random port from high port range"""
        # Use ports from 10000-65535 to avoid conflicts with system services
        for _ in range(50):  # Try up to 50 times
            port = random.randint(10000, 65535)
            if port not in self.blocked_ports and self.is_port_available(port):
                return port
        return None

    def find_available_port(self):
        """Find an available port, trying in order of preference"""

        # Try default port first
        if self.is_port_available(self.default_port):
            return self.default_port

        print(f"⚠️  Port {self.default_port} is occupied, trying alternatives...")

        # Try alternative ports
        for port in self.alternative_ports:
            if port not in self.blocked_ports and self.is_port_available(port):
                print(f"✓ Using alternative port {port}")
                return port

        print("⚠️  All alternative ports are occupied, trying random high port...")

        # Try random high port
        random_port = self.get_random_high_port()
        if random_port:
            print(f"✓ Using random port {random_port}")
            return random_port

        # Final fallback - just return default and let it fail with a clear error
        print(f"❌ Could not find any available port, falling back to {self.default_port}")
        return self.default_port