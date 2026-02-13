# 📱 Run OnlySwap on Your Phone with Expo Go

## 🌍 For Anyone, Anywhere (Using Railway Backend)

### Step 1: Install Expo Go on Your Phone
- **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 2: Start Expo with Tunnel Mode

**Run this single command in your terminal:**

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && EXPO_PUBLIC_API_URL="https://onlyswap-production.up.railway.app" npx expo start --tunnel
```

**What this does:**
- ✅ Uses **tunnel mode** (`--tunnel`) - allows access from anywhere in the world
- ✅ Connects to **Railway backend** (`https://onlyswap-production.up.railway.app`)
- ✅ No need for same Wi-Fi network
- ✅ Works for anyone, anywhere

### Step 3: Scan QR Code

1. You'll see a **QR code** in the terminal
2. Open **Expo Go** app on your phone
3. Tap **"Scan QR code"**
4. Point your camera at the QR code
5. The app will load! 🎉

**That's it!** Anyone can scan the QR code and access the app from anywhere.

---

## 🔧 Alternative: LAN Mode (Same Wi-Fi Only)

If you want faster connection and everyone is on the same Wi-Fi:

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && EXPO_PUBLIC_API_URL="https://onlyswap-production.up.railway.app" npx expo start --clear
```

**Note:** LAN mode only works if all devices are on the same Wi-Fi network.

---

## 📝 Quick Reference

**For remote access (anyone, anywhere):**
```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && EXPO_PUBLIC_API_URL="https://onlyswap-production.up.railway.app" npx expo start --tunnel
```

**For local access (same Wi-Fi):**
```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap" && EXPO_PUBLIC_API_URL="https://onlyswap-production.up.railway.app" npx expo start --clear
```

---

## ❓ Troubleshooting

### ❌ "ngrok tunnel took too long to connect" Error

This is a common issue with Expo's tunnel mode. Here are working solutions:

**✅ Solution 1: Use LAN Mode + Share Your IP (RECOMMENDED)**

If tunnel mode isn't working, use LAN mode and share your IP:

```bash
EXPO_PUBLIC_API_URL="https://onlyswap-production.up.railway.app" npx expo start --clear
```

Then:
1. Find your public IP: Visit https://whatismyipaddress.com
2. Share the QR code + your public IP with others
3. They can manually enter: `exp://YOUR_PUBLIC_IP:8081` in Expo Go

**✅ Solution 2: Install ngrok Separately**

If Expo's built-in tunnel fails, install ngrok separately:

```bash
# Install ngrok (if not installed)
brew install ngrok/ngrok/ngrok

# Or download from: https://ngrok.com/download
```

Then run Expo in LAN mode and tunnel manually:
```bash
# Terminal 1: Start Expo
EXPO_PUBLIC_API_URL="https://onlyswap-production.up.railway.app" npx expo start --clear

# Terminal 2: Create tunnel (after Expo starts)
ngrok http 8081
```

**✅ Solution 3: Use Expo Development Build (Best for Production)**

For reliable remote access, build a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build development version
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

**✅ Solution 4: Try Different Network**

- Switch to mobile hotspot
- Try different Wi-Fi network
- Check if corporate firewall is blocking ngrok

**✅ Solution 5: Wait and Retry**

Sometimes ngrok servers are temporarily overloaded:
- Wait 5-10 minutes
- Try again later
- Tunnel mode can be unreliable during peak times

### ❌ Can't connect?
- Make sure you're using `--tunnel` flag for remote access
- Check that Railway backend is running: https://onlyswap-production.up.railway.app/health

### ❌ Network errors in app?
- Verify Railway backend URL is correct: `https://onlyswap-production.up.railway.app`
- Check Railway dashboard to ensure backend is deployed

### ❌ QR code not working?
- Make sure Expo Go app is installed
- Try refreshing: Press `r` in the Expo terminal
- Check your internet connection

---

## 🎯 Important Notes

- **Backend**: Running on Railway (no local server needed)
- **Database**: MongoDB on Railway/Atlas (cloud-hosted)
- **Images**: Stored on Cloudinary (cloud-hosted)
- **Access**: Works from anywhere with `--tunnel` mode

