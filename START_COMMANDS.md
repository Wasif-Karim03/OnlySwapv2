# Commands to Start OnlySwap Servers

## Quick Start Commands

### Option 1: Using Scripts (Easiest)

**Terminal 1 - Start Backend:**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
chmod +x start-backend.sh
./start-backend.sh
```

**Terminal 2 - Start Expo:**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
chmod +x start-expo.sh
./start-expo.sh
```

---

### Option 2: Manual Commands

**Terminal 1 - Start Backend:**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend
npm run dev
```

**Terminal 2 - Start Expo:**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap

# Get your IP address
IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

# Start Expo with API URL
EXPO_PUBLIC_API_URL="http://$IP:3001" npx expo start --clear
```

---

### Option 3: If MongoDB is Not Running

**Terminal 1 - Start MongoDB First:**
```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
```

**Then start backend (same Terminal 1 or new Terminal):**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend
npm run dev
```

**Terminal 2 - Start Expo:**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
EXPO_PUBLIC_API_URL="http://$IP:3001" npx expo start --clear
```

---

## Step-by-Step Instructions

1. **Open Terminal 1:**
   - Copy and paste the backend command
   - Wait until you see "Server running on port 3001" or similar

2. **Open Terminal 2 (new terminal window):**
   - Copy and paste the Expo command
   - You'll see a QR code appear

3. **On Your Phone:**
   - Open Expo Go app
   - Scan the QR code
   - App will load!

---

## Stop Servers

**To stop backend (Terminal 1):**
- Press `Ctrl + C`

**To stop Expo (Terminal 2):**
- Press `Ctrl + C`

**To stop MongoDB:**
```bash
pkill mongod
```

---

## Troubleshooting

**If port 3001 is already in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**If port 8081 is already in use:**
```bash
lsof -ti:8081 | xargs kill -9
```

**Check if servers are running:**
```bash
# Check backend
lsof -ti:3001 && echo "Backend is running" || echo "Backend is not running"

# Check Expo
lsof -ti:8081 && echo "Expo is running" || echo "Expo is not running"

# Check MongoDB
pgrep mongod && echo "MongoDB is running" || echo "MongoDB is not running"
```

---

## Your Current IP Address

Based on your system, your IP is: **172.16.16.18**

You can verify it with:
```bash
ipconfig getifaddr en0
```

---

## Notes

- Keep both terminals open while testing
- Backend must start before Expo
- Make sure phone and computer are on same WiFi network
- The QR code will appear in Terminal 2 (Expo terminal)

