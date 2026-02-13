# 📱 Quick Start: Run OnlySwap on Your Mobile Device

## Prerequisites
- ✅ Node.js installed
- ✅ Expo Go app installed on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- ✅ Your phone and computer on the **same Wi-Fi network**

---

## Step-by-Step Instructions

### Step 1: Start MongoDB

**Option A: Using the helper script (Recommended)**
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
./start-mongodb.sh
```

**Option B: Manual start**
```bash
# Create data directory (if needed)
mkdir -p ~/data/db

# Start MongoDB
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
```

**Option C: Using brew services (if it works for you)**
```bash
brew services start mongodb-community
```

Verify MongoDB is running:
```bash
pgrep -x mongod
# Should show a process ID
```

---

### Step 2: Start Backend Server

In **Terminal 1** (same terminal or new one), run:
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend
npm run dev
```

**Wait for these success messages:**
```
✅ Connected to MongoDB
🚀 Server is running on port 3001
```

**Keep this terminal open!** It will show all API requests.

---

### Step 3: Start Expo Development Server

Open **Terminal 2** (new terminal window) and run:
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
npx expo start
```

You should see:
- A QR code in the terminal
- Options to press `i` for iOS simulator, `a` for Android emulator
- A message like: "Metro waiting on exp://192.168.x.x:8081"

---

### Step 4: Connect Your Phone

#### Option A: Scan QR Code (Recommended)
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"** 
3. Scan the QR code from Terminal 2
4. The app will load on your phone!

#### Option B: Manual Connection
1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Enter the URL shown in Terminal 2 (e.g., `exp://192.168.1.xxx:8081`)

---

## 🔧 Important: Configure API URL for Mobile

Your computer's IP address is: **206.21.136.212**

The mobile app needs to know where your backend server is. Check if `services/apiConfig.ts` is configured correctly. If the app shows "Network request failed", you may need to:

1. Set an environment variable when starting Expo:
   ```bash
   EXPO_PUBLIC_API_URL=http://206.21.136.212:3001 npx expo start
   ```

2. Or update `services/apiConfig.ts` to use your IP address directly.

---

## ✅ Success Indicators

When everything is working:
- ✅ Terminal 1 shows: "Server is running on port 3001"
- ✅ Terminal 2 shows QR code and "Metro waiting on..."
- ✅ Expo Go app loads your app without errors
- ✅ You can see API requests in Terminal 1 when using the app

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to development server"
- Make sure phone and computer are on the **same Wi-Fi**
- Try using **tunnel mode**:
  ```bash
  npx expo start --tunnel
  ```
  (This may be slower but works across different networks)

### ❌ "Network request failed" in the app
- Check that backend server is running (Terminal 1)
- Verify the API URL matches your computer's IP
- To find your computer's IP:
  ```bash
  ipconfig getifaddr en0
  ```

### ❌ Backend connection errors
- Make sure MongoDB is running:
  ```bash
  brew services start mongodb-community
  ```
- Check that port 3001 is not in use:
  ```bash
  lsof -ti:3001 | xargs kill -9
  ```

### ❌ Expo server won't start
- Clear cache and restart:
  ```bash
  npx expo start -c
  ```

### ❌ MongoDB won't start
- If `brew services` fails, use the manual method:
  ```bash
  ./start-mongodb.sh
  ```
- Or start manually:
  ```bash
  mkdir -p ~/data/db
  mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
  ```
- Check if MongoDB is running:
  ```bash
  pgrep -x mongod
  ```
- Check MongoDB logs:
  ```bash
  tail -f ~/data/db/mongod.log
  ```
- To stop MongoDB:
  ```bash
  ./stop-mongodb.sh
  # or
  pkill mongod
  ```

---

## 📋 Quick Command Reference

**Terminal 1 (Backend):**
```bash
# Start MongoDB
brew services start mongodb-community

# Start backend server
cd /Users/wasifkarim/Desktop/OnlySwap/backend && npm run dev
```

**Terminal 2 (Expo):**
```bash
# Start Expo with API URL configured
cd /Users/wasifkarim/Desktop/OnlySwap
EXPO_PUBLIC_API_URL=http://206.21.136.212:3001 npx expo start
```

**To stop servers:**
- Press `Ctrl + C` in each terminal
- Or run: `pkill -f "expo start" && pkill -f "nodemon"`

---

## 🎯 Next Steps

Once the app is running on your phone:
1. Test creating an account
2. Test logging in
3. Browse products
4. Check Terminal 1 to see API requests being made

---

**Note:** If your computer's IP address changes (e.g., you connect to a different Wi-Fi), you'll need to update the API URL accordingly.

