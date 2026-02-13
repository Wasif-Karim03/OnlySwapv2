#!/bin/bash

# OnlySwap Expo Go Startup Script
# Starts the Expo development server

echo "📱 Starting OnlySwap Expo Go..."
echo ""

# Get the computer's IP address for API connection
IP_ADDRESS=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$IP_ADDRESS" ]; then
    echo "⚠️  Could not detect IP address automatically."
    echo "   You may need to set EXPO_PUBLIC_API_URL manually."
    IP_ADDRESS="localhost"
else
    echo "📍 Detected IP Address: $IP_ADDRESS"
    echo "   Backend API: http://$IP_ADDRESS:3001"
    echo ""
fi

# Check if backend is running
if ! lsof -ti:3001 > /dev/null 2>&1; then
    echo "⚠️  Backend server doesn't appear to be running on port 3001."
    echo "   Make sure to start it first with: ./start-backend.sh"
    echo ""
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Backend server is running"
    echo ""
fi

# Navigate to project root
cd "$(dirname "$0")" || exit 1

# Start Expo with API URL
echo "🚀 Starting Expo development server..."
echo "   Scan the QR code with Expo Go app on your phone"
echo "   Press Ctrl+C to stop"
echo ""

EXPO_PUBLIC_API_URL="http://$IP_ADDRESS:3001" npx expo start --clear



