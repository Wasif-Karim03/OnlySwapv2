# 📱 How to Run OnlySwap on Your Phone with Expo Go

## Prerequisites
1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Make sure your phone and computer are on the same Wi-Fi network**

## Step 1: Start MongoDB (if not already running)

Open **Terminal 1** and check if MongoDB is running:
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# If not running, start it:
brew services start mongodb-community

# Or start manually:
mongod --dbpath ~/data/db
```

## Step 2: Start Backend Server

Open **Terminal 1** and run:
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend
npm run dev
```

Wait for these success messages:
```
✅ Connected to MongoDB
🚀 Server is running on port 3001
```

**Keep this terminal open!** It will show all API requests.

## Step 3: Start Expo Development Server

Open **Terminal 2** (new terminal window) and run:
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
npx expo start
```

You should see:
- A QR code in the terminal
- Options to press `i` for iOS simulator, `a` for Android emulator, or scan QR code

## Step 4: Connect Your Phone

### Option A: Scan QR Code (Recommended)
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"** 
3. Scan the QR code from Terminal 2
4. The app will load on your phone!

### Option B: Manual Connection
1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Enter the URL shown in Terminal 2 (e.g., `exp://192.168.1.xxx:8081`)

## Troubleshooting

### ❌ "Cannot connect to development server"
- Make sure phone and computer are on the **same Wi-Fi**
- Try using **tunnel mode**:
  ```bash
  npx expo start --tunnel
  ```
  (This may be slower but works across different networks)

### ❌ "Network request failed" in the app
- Check that backend server is running (Terminal 1)
- Verify the API URL in `services/apiConfig.ts` matches your computer's IP
- To find your computer's IP:
  ```bash
  # macOS/Linux
  ipconfig getifaddr en0
  
  # Or
  ifconfig | grep "inet " | grep -v 127.0.0.1
  ```

### ❌ Backend connection errors
- Make sure MongoDB is running
- Check that port 3001 is not in use:
  ```bash
  lsof -ti:3001 | xargs kill -9
  ```

### ❌ Expo server won't start
- Clear cache and restart:
  ```bash
  npx expo start -c
  ```

## Quick Commands Summary

**Terminal 1 (Backend):**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend && npm run dev
```

**Terminal 2 (Expo):**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap && npx expo start
```

**To stop servers:**
- Press `Ctrl + C` in each terminal
- Or run: `pkill -f "expo start" && pkill -f "nodemon"`

## ✅ Success Indicators

When everything is working:
- ✅ Terminal 1 shows: "Server is running on port 3001"
- ✅ Terminal 2 shows QR code and "Metro waiting on..."
- ✅ Expo Go app loads your app without errors
- ✅ You can see API requests in Terminal 1 when using the app

---

**Note:** The app is configured to use `http://206.21.136.212:3001` for the backend API when running on Expo Go. If your computer's IP address is different, you may need to update `services/apiConfig.ts`.
