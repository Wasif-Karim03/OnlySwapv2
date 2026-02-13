#!/bin/bash

# Helper script to stop MongoDB

echo "🛑 Stopping MongoDB..."

if ! pgrep -x mongod > /dev/null; then
    echo "ℹ️  MongoDB is not running"
    exit 0
fi

# Get the PID
PID=$(pgrep -x mongod)
echo "   Found MongoDB process: $PID"

# Stop MongoDB gracefully
pkill mongod

# Wait a moment
sleep 1

# Force kill if still running
if pgrep -x mongod > /dev/null; then
    echo "   Force stopping..."
    pkill -9 mongod
    sleep 1
fi

if ! pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB stopped successfully"
else
    echo "❌ Failed to stop MongoDB. Try: sudo pkill mongod"
    exit 1
fi

