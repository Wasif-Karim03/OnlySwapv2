# 🚀 START THE BACKEND SERVER

## ❌ Problem
Your backend server is **NOT running**. All network requests are failing with `ERR_NETWORK`.

## ✅ Solution: Start the Server

### Step 1: Open a Terminal
Open a **new terminal window** (keep it open to see server logs).

### Step 2: Navigate to Backend
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend
```

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Wait for Success Messages
You should see:
```
✅ Connected to MongoDB
🚀 Server is running on port 3001
📡 API URL: http://localhost:3001
🌐 Network URL: http://206.21.136.212:3001
```

### Step 5: If MongoDB Connection Fails
If you see:
```
❌ MongoDB connection error: ...
```

**Fix MongoDB:**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod --dbpath ~/data/db
```

### Step 6: Verify Server is Running
In another terminal, test:
```bash
curl http://206.21.136.212:3001/health
```

Should return: `{"success":true,"message":"Server is healthy",...}`

## 🔍 Troubleshooting

### If "Port 3001 already in use":
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Then start again
npm run dev
```

### If "Module not found":
```bash
cd backend
npm install
npm run dev
```

### If server keeps crashing:
Check the terminal for error messages. Common issues:
- MongoDB not running
- Missing .env file
- Wrong IP address configuration

## ✅ Once Server is Running

Your app should automatically reconnect and all errors should disappear!

Keep the server terminal **open** while developing - you'll see all API requests in real-time.

