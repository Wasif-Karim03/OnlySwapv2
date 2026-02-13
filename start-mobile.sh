#!/bin/bash

# OnlySwap Mobile Startup Script
# This script helps you start the backend and Expo server for mobile development

echo "🚀 Starting OnlySwap for Mobile Development..."
echo ""

# Get the computer's IP address
IP_ADDRESS=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$IP_ADDRESS" ]; then
    echo "❌ Could not detect IP address. Please set it manually."
    exit 1
fi

echo "📍 Detected IP Address: $IP_ADDRESS"
echo ""

# Check if MongoDB is running
echo "🔍 Checking MongoDB..."
if pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB is already running"
else
    echo "⚠️  MongoDB is not running. Starting it now..."
    # Create data directory if it doesn't exist
    mkdir -p ~/data/db
    
    # Start MongoDB manually (more reliable than brew services)
    mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log 2>&1
    sleep 2
    
    # Verify MongoDB started
    if pgrep -x mongod > /dev/null; then
        echo "✅ MongoDB started successfully"
    else
        echo "❌ Failed to start MongoDB. Check logs: ~/data/db/mongod.log"
        exit 1
    fi
fi
echo ""

# Check if backend is already running
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is already in use. Backend may already be running."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Starting Backend Server..."
echo "   (This will run in the background)"
cd "$(dirname "$0")/backend"
npm run dev > /tmp/onlyswap-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Logs: tail -f /tmp/onlyswap-backend.log"
echo ""

# Wait a bit for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check logs: cat /tmp/onlyswap-backend.log"
    exit 1
fi

echo "✅ Backend server started on port 3001"
echo ""

echo "📱 Starting Expo Development Server..."
echo "   API URL will be: http://$IP_ADDRESS:3001"
echo "   (Press Ctrl+C to stop both servers)"
echo ""

cd "$(dirname "$0")"
EXPO_PUBLIC_API_URL="http://$IP_ADDRESS:3001" npx expo start

# Cleanup on exit
echo ""
echo "🛑 Stopping servers..."
kill $BACKEND_PID 2>/dev/null
echo "✅ Done"

