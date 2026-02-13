#!/bin/bash

# Cleanup script - Kill all Node.js processes and development servers

echo "🧹 Cleaning up all servers and processes..."

# Kill all Node.js processes
echo "Killing Node.js processes..."
killall -9 node nodemon 2>/dev/null

# Kill processes on common development ports
echo "Clearing ports..."
for port in 3001 8081 8082 8080 3000; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null && echo "  ✅ Port $port cleared" || true
done

echo ""
echo "✅ All servers stopped and ports cleared!"
echo ""
echo "To restart:"
echo "  Backend:  cd backend && npm run dev"
echo "  Expo:     npm start"

