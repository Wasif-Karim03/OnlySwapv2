#!/bin/bash

# Helper script to start MongoDB manually
# Use this if brew services doesn't work

echo "🔍 Checking MongoDB status..."

# Check if MongoDB is already running
if pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB is already running"
    ps aux | grep mongod | grep -v grep
    exit 0
fi

# Create data directory if it doesn't exist
echo "📁 Creating data directory..."
mkdir -p ~/data/db

# Kill any existing MongoDB processes on port 27017
echo "🧹 Clearing port 27017..."
lsof -ti:27017 | xargs kill -9 2>/dev/null || true

# Start MongoDB
echo "🚀 Starting MongoDB..."
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log

sleep 2

# Verify it started
if pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB started successfully!"
    echo "   PID: $(pgrep -x mongod)"
    echo "   Data: ~/data/db"
    echo "   Logs: ~/data/db/mongod.log"
    echo ""
    echo "To stop MongoDB, run:"
    echo "   pkill mongod"
    echo "   or"
    echo "   ./stop-mongodb.sh"
else
    echo "❌ Failed to start MongoDB"
    echo "Check logs: ~/data/db/mongod.log"
    exit 1
fi

