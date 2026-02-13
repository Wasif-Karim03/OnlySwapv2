# 🚀 Commands to Run OnlySwap on Expo Go

## Quick Start (3 Commands)

### Terminal 1: Start MongoDB
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
./start-mongodb.sh
```

**OR manually:**
```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
```

---

### Terminal 2: Start Backend Server
```bash
cd /Users/wasifkarim/Desktop/OnlySwap/backend
npm run dev
```

**Wait for:** `✅ Connected to MongoDB` and `🚀 Server is running on port 3001`

---

### Terminal 3: Start Expo
```bash
cd /Users/wasifkarim/Desktop/OnlySwap
EXPO_PUBLIC_API_URL=http://206.21.136.212:3001 npx expo start
```

**Then scan the QR code with Expo Go on your phone!**

---

## One-Command Option (All-in-One)

```bash
cd /Users/wasifkarim/Desktop/OnlySwap
./start-mobile.sh
```

This starts MongoDB, backend, and Expo all at once!

---

## Stop Everything

**Stop Expo:**
- Press `Ctrl + C` in the Expo terminal

**Stop Backend:**
- Press `Ctrl + C` in the backend terminal

**Stop MongoDB:**
```bash
./stop-mongodb.sh
```

**OR:**
```bash
pkill mongod
```

---

## Check Status

**Check if MongoDB is running:**
```bash
pgrep -x mongod
```

**Check if backend is running:**
```bash
lsof -ti:3001
```

**Check your IP address:**
```bash
ipconfig getifaddr en0
```

---

## Troubleshooting Commands

**If port 3001 is in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Clear Expo cache:**
```bash
npx expo start -c
```

**Check MongoDB logs:**
```bash
tail -f ~/data/db/mongod.log
```

---

## Summary

**To start everything:**
1. `./start-mongodb.sh` (Terminal 1)
2. `cd backend && npm run dev` (Terminal 2)
3. `EXPO_PUBLIC_API_URL=http://206.21.136.212:3001 npx expo start` (Terminal 3)

**Or use the all-in-one:**
- `./start-mobile.sh` (single command)

