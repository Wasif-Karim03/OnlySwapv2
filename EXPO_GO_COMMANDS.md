# 📱 Commands to Run Servers for Expo Go Testing

Copy and paste these commands into separate terminal windows to test on Expo Go.

---

## 🚀 Quick Start (2 Terminal Windows)

### Terminal 1: Start Backend Server

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap/backend" && npm run dev
```

**Wait until you see:**
```
✅ Connected to MongoDB
🚀 Server is running on port 3001
```

**Keep this terminal open!**

---

### Terminal 2: Start Expo Development Server

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}') && EXPO_PUBLIC_API_URL="http://$IP:3001" npx expo start --clear
```

**You'll see a QR code in this terminal.**

---

## 📲 Connect Your Phone

1. **Make sure your phone and computer are on the same WiFi network**
2. **Open Expo Go app** on your phone
3. **Scan the QR code** from Terminal 2:
   - **iOS**: Use Camera app to scan
   - **Android**: Use Expo Go app's "Scan QR Code" feature
4. The app will load on your phone! 🎉

---

## 🛑 Stop Servers

**To stop backend (Terminal 1):**
- Press `Ctrl + C`

**To stop Expo (Terminal 2):**
- Press `Ctrl + C`

---

## 🔧 Alternative: Using Scripts

If you prefer using the provided scripts:

**Terminal 1:**
```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && chmod +x start-backend.sh && ./start-backend.sh
```

**Terminal 2:**
```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && chmod +x start-expo.sh && ./start-expo.sh
```

---

## ⚠️ Troubleshooting

### Port Already in Use

**Backend port (3001):**
```bash
lsof -ti:3001 | xargs kill -9
```

**Expo port (8081):**
```bash
lsof -ti:8081 | xargs kill -9
```

### MongoDB Not Running

The backend script will try to start MongoDB automatically. If it fails:

```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
```

### Can't Connect from Phone

1. **Check WiFi**: Phone and computer must be on same network
2. **Check your IP address:**
   ```bash
   ipconfig getifaddr en0
   ```
3. **Try tunnel mode** (slower but works through firewalls):
   ```bash
   cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"
   IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
   EXPO_PUBLIC_API_URL="http://$IP:3001" npx expo start --tunnel --clear
   ```

### Dependencies Not Installed

If you get "module not found" errors:

```bash
# Install backend dependencies
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap/backend"
npm install

# Install frontend dependencies
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"
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
  "status": "healthy"
}
```

**Check Expo:**
- Look for QR code in Terminal 2
- Try scanning with Expo Go app

---

## 📝 Notes

- **Keep both terminals open** while testing
- **Backend must start before Expo** (or Expo will warn you)
- **Verification codes** print to backend terminal console in dev mode
- **Hot reload** works automatically - save files and see changes instantly

---

Happy testing! 🚀
