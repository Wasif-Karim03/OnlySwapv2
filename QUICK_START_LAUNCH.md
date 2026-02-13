# ⚡ Quick Start - Launch Checklist

**Fast-track guide to get OnlySwap on the App Stores**

---

## 🎯 Critical Path (Do These First)

### Step 1: Deploy Backend (2-4 hours)

**Easiest Option: Railway**
1. Sign up: https://railway.app
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add environment variables:
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/onlyswap
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   NODE_ENV=production
   PORT=3001
   ```
5. Get URL: `https://your-app.railway.app`

**MongoDB Atlas (Free):**
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGO_URI` in Railway

---

### Step 2: Update API URL (5 minutes)

**File:** `eas.json`

Update production profile:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.railway.app"
      }
    }
  }
}
```

---

### Step 3: Build Production App (30 minutes)

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for both platforms
eas build --platform all --profile production
```

**Wait 15-30 minutes for builds to complete.**

---

### Step 4: Create Store Accounts (30 minutes)

**iOS:**
1. Apple Developer: https://developer.apple.com ($99/year)
2. App Store Connect: https://appstoreconnect.apple.com
3. Create app: Bundle ID `com.onlyswap.app`

**Android:**
1. Google Play Console: https://play.google.com/console ($25 one-time)
2. Create app: Package `com.onlyswap.app`

---

### Step 5: Submit to Stores (1 hour)

**iOS:**
```bash
eas submit --platform ios
```

**Android:**
```bash
eas submit --platform android
```

**Then complete store listings in web consoles.**

---

## ✅ What's Already Fixed

- ✅ Android package name configured
- ✅ `eas.json` production profile ready
- ✅ `apiConfig.ts` uses environment variable
- ✅ Incomplete features hidden
- ✅ App configuration complete

---

## 📋 Pre-Submission Checklist

**Backend:**
- [ ] Backend deployed and accessible
- [ ] Health endpoint returns 200
- [ ] Test API calls work

**App:**
- [ ] Production build successful
- [ ] TestFlight/Internal testing works
- [ ] No crashes in production build

**Store Listings:**
- [ ] Screenshots prepared
- [ ] Descriptions written
- [ ] Privacy Policy hosted publicly
- [ ] Support URL configured

---

## 🚀 Estimated Timeline

- **Day 1:** Deploy backend, build app
- **Day 2:** Create store accounts, prepare assets
- **Day 3:** Submit to stores
- **Day 4-7:** Wait for review
- **Day 8:** Launch! 🎉

**Total: ~1 week from start to launch**

---

## 📚 Full Details

See `README_RELEASE.md` for complete guide with all options and troubleshooting.
