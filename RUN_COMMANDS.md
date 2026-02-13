# 🚀 Quick Start Commands - OnlySwap

Copy and paste these commands into your terminal to start the app for testing.

---

## 📋 Prerequisites Check

Before starting, make sure you have:

1. **Node.js** installed (check: `node --version`)
2. **MongoDB** installed (check: `mongod --version`)
3. **npm dependencies** installed in both directories

If dependencies aren't installed:
```bash
# Install backend dependencies
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
npm install

# Install frontend dependencies
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap
npm install
```

---

## ⚙️ Step 1: Setup Backend Environment (First Time Only)

If you haven't created a `.env` file in the backend directory:

```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
cp env.example .env
```

Then edit `.env` and set at minimum:
```env
MONGO_URI=mongodb://localhost:27017/onlyswap
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3001
NODE_ENV=development
```

**Note**: Email settings are optional for testing (verification codes will print to console in dev mode).

---

## 🖥️ Step 2: Start Backend Server

**Open Terminal 1** and run:

### Option A: Using the Script (Easiest)
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap
chmod +x start-backend.sh
./start-backend.sh
```

### Option B: Manual Command
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
npm run dev
```

**Expected Output:**
```
✅ Connected to MongoDB
🚀 Server is running on port 3001
📡 API URL: http://localhost:3001
```

**Keep this terminal open!** The backend must stay running.

---

## 📱 Step 3: Start Expo Go (Frontend)

**Open Terminal 2** (new terminal window) and run:

### Option A: Using the Script (Easiest)
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap
chmod +x start-expo.sh
./start-expo.sh
```

### Option B: Manual Command
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap

# Get your computer's IP address
IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

# Start Expo with your IP
EXPO_PUBLIC_API_URL="http://$IP:3001" npx expo start --clear
```

**Expected Output:**
```
📱 Starting OnlySwap Expo Go...
📍 Detected IP Address: 172.16.16.18
✅ Backend server is running

🚀 Starting Expo development server...
```

A **QR code** will appear in the terminal.

---

## 📲 Step 4: Connect Your Phone

1. **Install Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Make sure your phone and computer are on the same WiFi network**

3. **Scan the QR code**:
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and tap "Scan QR Code"

4. The app will load on your phone! 🎉

---

## 🛑 Stop Servers

**To stop backend (Terminal 1):**
- Press `Ctrl + C`

**To stop Expo (Terminal 2):**
- Press `Ctrl + C`

**To stop MongoDB (if started separately):**
```bash
pkill mongod
```

---

## 🔧 Troubleshooting

### Port Already in Use

**Backend port (3001) in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Expo port (8081) in use:**
```bash
lsof -ti:8081 | xargs kill -9
```

### MongoDB Not Running

If MongoDB isn't running, the backend script will try to start it automatically. If it fails:

```bash
# Start MongoDB manually
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log

# Or check if MongoDB is installed
mongod --version
```

### Can't Connect from Phone

1. **Check WiFi**: Phone and computer must be on same network
2. **Check Firewall**: Make sure port 3001 isn't blocked
3. **Verify IP Address**: 
   ```bash
   ipconfig getifaddr en0
   ```
4. **Try using tunnel mode** (slower but works through firewalls):
   ```bash
   npx expo start --tunnel
   ```

### Backend Not Found

If your phone can't connect to the backend:

1. Check your computer's IP address:
   ```bash
   ipconfig getifaddr en0  # Mac
   # or
   ifconfig | grep "inet " | grep -v 127.0.0.1  # Mac/Linux
   ```

2. Make sure `EXPO_PUBLIC_API_URL` is set correctly in Terminal 2

3. Test backend is accessible:
   ```bash
   curl http://localhost:3001/health
   ```

### Dependencies Issues

**Reinstall dependencies:**
```bash
# Backend
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
rm -rf node_modules
npm install

# Frontend
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap
rm -rf node_modules
npm install
```

---

## ✅ Verify Everything is Working

**Check Backend:**
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "database": { "status": "connected" }
}
```

**Check Expo:**
- Look for QR code in Terminal 2
- Try scanning with Expo Go app

---

## 📝 Quick Reference

### All-in-One Commands (Copy-Paste Ready)

**Terminal 1 (Backend):**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend && npm run dev
```

**Terminal 2 (Expo):**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap && IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}') && EXPO_PUBLIC_API_URL="http://$IP:3001" npx expo start --clear
```

---

## 🎯 Testing Checklist

Once both servers are running:

- [ ] Backend shows "Server is running on port 3001"
- [ ] MongoDB connection is successful
- [ ] Expo shows QR code in terminal
- [ ] Can scan QR code with Expo Go app
- [ ] App loads on phone
- [ ] Can see login/signup screen
- [ ] Can create an account (verification code appears in backend terminal)

---

## 💡 Tips

- **Keep both terminals open** while testing
- **Backend must start before Expo** (or Expo will warn you)
- **Verification codes** print to backend terminal console in dev mode
- **Hot reload** works automatically - save files and see changes instantly
- **Check backend logs** if something isn't working

---

## 📞 Need Help?

Common issues and solutions:
- **"Cannot connect to server"**: Check backend is running, firewall settings, WiFi network
- **"MongoDB connection error"**: Start MongoDB first
- **"Port already in use"**: Kill the process using the port (commands above)
- **"Module not found"**: Run `npm install` in the appropriate directory

Happy testing! 🚀



