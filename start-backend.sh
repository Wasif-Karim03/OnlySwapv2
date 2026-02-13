#!/bin/bash

# OnlySwap Backend Startup Script
# Starts the Node.js backend server

echo "🚀 Starting OnlySwap Backend Server..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Check if port 3001 is already in use
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is already in use."
    echo "   A backend server may already be running."
    read -p "   Kill existing process and start new one? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3001 | xargs kill -9 2>/dev/null
        sleep 1
    else
        echo "❌ Exiting. Please stop the existing server first."
        exit 1
    fi
fi

# Check if MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo "⚠️  MongoDB is not running."
    echo "   Starting MongoDB..."
    mkdir -p ~/data/db
    mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log 2>&1
    sleep 2
    
    if pgrep -x mongod > /dev/null; then
        echo "✅ MongoDB started successfully"
    else
        echo "❌ Failed to start MongoDB. Check logs: ~/data/db/mongod.log"
        exit 1
    fi
else
    echo "✅ MongoDB is running"
fi
echo ""

# Start backend server
echo "📦 Starting backend server on port 3001..."
echo "   Press Ctrl+C to stop"
echo ""

npm run dev



