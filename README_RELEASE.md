# 🚀 OnlySwap - Production Launch Guide

**Complete step-by-step checklist to launch OnlySwap on iOS App Store and Google Play Store**

---

## 📋 Executive Summary

**Current Status:** ⚠️ **NOT READY FOR PRODUCTION** - Critical blockers must be fixed first

**Estimated Time to Launch:** 2-5 days (depending on backend deployment speed)

**Critical Blockers:**
1. 🔴 Production API URL not configured (`services/apiConfig.ts:42`)
2. 🔴 Backend must be deployed to production server
3. 🟡 Incomplete features visible in UI (Account deletion, Archive chat)
4. 🟡 Missing Android package name in `app.json`
5. 🟡 Console logs in production code (342 instances found)

---

## 🔴 LAUNCH BLOCKERS

### 1. Production API URL Not Configured

**Location:** `services/apiConfig.ts:42`

**Current Code:**
```typescript
if (typeof __DEV__ === 'undefined' || !__DEV__) {
  return 'https://your-production-api.com'; // ❌ PLACEHOLDER
}
```

**Problem:** App will crash immediately in production builds because API calls will fail.

**Fix Required:**
- Deploy backend to production server (see Section A below)
- Update `services/apiConfig.ts` with actual production URL
- Or use environment variable: `EXPO_PUBLIC_API_URL`

**Action:** See Section A.1 for backend deployment steps.

---

### 2. Backend Must Be Deployed

**Current State:** Backend runs on `localhost:3001` (development only)

**Problem:** Production app cannot connect to localhost.

**What Must Be Hosted:**
- Node.js/Express API server (`backend/server.js`)
- MongoDB database (currently local)
- File storage for images (`backend/uploads/` directory)
- Socket.IO server for real-time chat

**Action:** See Section A for complete backend deployment guide.

---

### 3. Incomplete Features Visible in UI

**Location 1:** `app/settings.tsx:125-126`
- "Delete Account" button shows "Coming Soon" alert
- **Risk:** Apple/Google may reject if feature appears broken

**Location 2:** `app/(tabs)/chat.tsx:401-405`
- Swipe-to-archive gesture exists but does nothing
- **Risk:** Users will be confused when feature doesn't work

**Fix Options:**
- **Option A (Recommended):** Hide/remove these features until implemented
- **Option B:** Implement them before launch
- **Option C:** Add "Coming Soon" badge and disable buttons

**Action:** See Section D.1 for fixes.

---

### 4. Missing Android Package Name

**Location:** `app.json` - Android section missing `package` field

**Current State:**
```json
"android": {
  "adaptiveIcon": { ... },
  "edgeToEdgeEnabled": true
}
```

**Problem:** Android builds will fail without package name.

**Fix Required:** Add `"package": "com.onlyswap.app"` to Android config.

**Action:** See Section B.2 for fix.

---

### 5. Console Logs in Production

**Found:** 342 console.log/error/warn statements across 53 files

**Problem:** 
- Performance impact
- Potential information leakage
- Unprofessional in production

**Fix Required:** Wrap all console statements in `__DEV__` checks or remove them.

**Action:** See Section D.2 for automated fix.

---

## 📝 COMPLETE LAUNCH CHECKLIST

---

## A. Backend & Data Readiness

### A.1 Deploy Backend to Production Server

#### Step 1 — Make sure your backend can run locally (sanity check)

Before deploying, confirm it works on your laptop.

**Open terminal inside your project:**

```bash
# Navigate to backend folder (IMPORTANT: must be in backend directory!)
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap/backend"
```

**Verify you're in the right directory:**
```bash
# You should see "backend" in your prompt, or run:
pwd
# Should show: /Users/wasifkarim/Desktop/Lot Detector/OnlySwap/backend
```

**Install dependencies (if not already done):**

```bash
npm install
```

**⚠️ IMPORTANT: Start MongoDB first!**

Before starting the backend, make sure MongoDB is running. Open a **new terminal window** and run:

```bash
# From project root
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"
./start-mongodb.sh
```

**Or manually:**
```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
```

Wait until you see `✅ MongoDB started successfully!` before continuing.

**Now start the backend server:**

```bash
# Option 1: Development mode (with auto-reload)
npm run dev

# Option 2: Production mode
npm start
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server is running on port 3001
📡 API URL: http://localhost:3001
```

**If you see "MongoDB connection error" instead, see Troubleshooting below.**

**In a new terminal window, test the health endpoint:**

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": { "status": "connected" }
}
```

**If that returns something like "healthy", you're good!** Your backend is working locally and ready to deploy.

**Troubleshooting:**

**If you see "MongoDB connection error" or "MongoDB disconnected":**

MongoDB needs to be running before starting the backend. Here's how to start it:

**Option 1: Use the project script (Easiest):**
```bash
# From project root directory
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"
chmod +x start-mongodb.sh
./start-mongodb.sh
```

**Option 2: Start MongoDB manually:**
```bash
# Create data directory if it doesn't exist
mkdir -p ~/data/db

# Start MongoDB in the background
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log

# Wait 2 seconds, then verify it's running
sleep 2
pgrep mongod
```

**If MongoDB starts successfully, you should see:**
```
✅ MongoDB started successfully!
```

**Then go back to your backend terminal and restart:**
```bash
# In the backend directory
npm run dev
```

**Check if MongoDB is already running:**
```bash
pgrep mongod
# If it returns a number, MongoDB is running
# If nothing is returned, MongoDB is not running
```

**If MongoDB won't start, check the logs:**
```bash
tail -f ~/data/db/mongod.log
```

**Alternative: Use Homebrew (if MongoDB was installed via Homebrew):**
```bash
brew services start mongodb-community
```
- If port 3001 is in use:
  ```bash
  # Kill process on port 3001
  lsof -ti:3001 | xargs kill -9
  ```
- If you get "module not found" errors:
  ```bash
  # Reinstall dependencies
  rm -rf node_modules package-lock.json
  npm install
  ```

---

#### Step 2 — Deploy to Production Server

**Recommended Hosting Options (Fast & Low-Cost):**

#### Option 1: Railway (Recommended - Easiest)
- **Cost:** ~$5-20/month
- **Setup Time:** 15 minutes
- **Steps:**
  1. Sign up at https://railway.app
  2. Create new project → "Deploy from GitHub repo"
  3. Select your `backend` folder
  4. Add environment variables (see `.env.example`)
  5. Deploy automatically
  6. Get production URL: `https://your-app.railway.app`

#### Option 2: Render
- **Cost:** Free tier available, $7/month for production
- **Setup Time:** 20 minutes
- **Steps:**
  1. Sign up at https://render.com
  2. Create new "Web Service"
  3. Connect GitHub repo
  4. Root Directory: `backend`
  5. Build Command: `npm install`
  6. Start Command: `npm start`
  7. Add environment variables

#### Option 3: DigitalOcean App Platform
- **Cost:** $5-12/month
- **Setup Time:** 30 minutes
- More control, slightly more complex

#### Option 4: AWS EC2 / Heroku
- **Cost:** Varies
- **Setup Time:** 1-2 hours
- More complex but scalable

**Required Environment Variables for Production:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/onlyswap
JWT_SECRET=<generate-strong-secret-32-chars-min>
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-domain.com
COMPANY_EMAIL=your-email@domain.com
COMPANY_EMAIL_PASSWORD=your-app-password
LOG_LEVEL=info
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

---

### A.2 Set Up MongoDB Database

**Option 1: MongoDB Atlas (Recommended)**
- **Cost:** Free tier available (512MB)
- **Steps:**
  1. Sign up at https://www.mongodb.com/cloud/atlas
  2. Create free cluster
  3. Create database user
  4. Whitelist IP addresses (0.0.0.0/0 for all)
  5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/onlyswap`
  6. Update `MONGO_URI` in production environment

**Option 2: Railway MongoDB Plugin**
- **Cost:** Included with Railway plan
- **Steps:** Add MongoDB service in Railway dashboard

---

### A.3 Set Up File Storage

**Current:** Files stored in `backend/uploads/` directory (local filesystem)

**Problem:** Local storage doesn't work on cloud platforms (ephemeral filesystem)

**Solutions:**

#### Option 1: Cloud Storage (Recommended)
- **AWS S3** (most common)
- **Cloudinary** (easiest, free tier available)
- **DigitalOcean Spaces** (S3-compatible, cheaper)

**Implementation Required:**
- Update `backend/controllers/productController.js` upload logic
- Replace `multer` disk storage with cloud storage
- Update image URLs in responses

#### Option 2: Persistent Volume (Railway/Render)
- Some platforms support persistent volumes
- Simpler but less scalable

**Action:** For quick launch, use persistent volume. For scale, implement S3/Cloudinary.

---

### A.4 Update API Configuration

**File:** `services/apiConfig.ts`

**Current (Line 42):**
```typescript
if (typeof __DEV__ === 'undefined' || !__DEV__) {
  return 'https://your-production-api.com'; // ❌ PLACEHOLDER
}
```

**Fix:**
```typescript
if (typeof __DEV__ === 'undefined' || !__DEV__) {
  // Use environment variable or fallback to production URL
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.onlyswap.com';
}
```

**Then set in EAS build:**
```bash
eas build --platform all --profile production --env EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

**Or add to `eas.json`:**
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend.railway.app"
      }
    }
  }
}
```

---

### A.5 Test Production Backend

**Before building app:**
```bash
# Test health endpoint
curl https://your-backend.railway.app/health

# Test API endpoint
curl https://your-backend.railway.app/api/v1/products
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": { "status": "connected" }
}
```

---

## B. Expo → Production Build Setup

### B.1 Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

---

### B.2 Fix `app.json` Configuration

**File:** `app.json`

**Add Android package name:**
```json
{
  "expo": {
    "android": {
      "package": "com.onlyswap.app",
      "versionCode": 1,
      "adaptiveIcon": { ... },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

**Update version numbers:**
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1,
      "versionName": "1.0.0"
    }
  }
}
```

**Action:** See fixes in Section F.

---

### B.3 Configure `eas.json`

**File:** `eas.json`

**Current Issues:**
- Missing Android configuration
- Placeholder values in submit section
- Missing environment variables

**Required Configuration:**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend.railway.app"
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.onlyswap.app"
      },
      "android": {
        "applicationId": "com.onlyswap.app"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend.railway.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Action:** See fixes in Section F.

---

### B.4 iOS Setup

#### B.4.1 Apple Developer Account
- **Cost:** $99/year
- **Required:** Yes, for App Store submission
- **Sign up:** https://developer.apple.com/programs/

#### B.4.2 App Store Connect Setup
1. Go to https://appstoreconnect.apple.com
2. Create new app:
   - **Name:** OnlySwap
   - **Primary Language:** English
   - **Bundle ID:** `com.onlyswap.app`
   - **SKU:** `onlyswap-001`
3. Note your **App ID** and **Team ID** for `eas.json`

#### B.4.3 TestFlight Setup
- Automatic with EAS Build
- Build will be uploaded to TestFlight
- Add testers in App Store Connect

#### B.4.4 Required Capabilities
**Already configured in `app.json`:**
- ✅ Camera access
- ✅ Photo library access
- ✅ Photo library write access

**No additional capabilities needed** (no location, push notifications, etc.)

---

### B.5 Android Setup

#### B.5.1 Google Play Console Account
- **Cost:** $25 one-time fee
- **Required:** Yes, for Play Store submission
- **Sign up:** https://play.google.com/console

#### B.5.2 Create App in Play Console
1. Go to https://play.google.com/console
2. Create new app:
   - **App name:** OnlySwap
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free
3. Complete store listing (see Section C)

#### B.5.3 Signing Configuration
**EAS Build handles this automatically**, but you can configure:

**Option 1: EAS Managed (Recommended)**
- EAS generates and manages keys
- No action needed

**Option 2: Local Signing**
- Generate keystore locally
- Upload to EAS
- More control but more complex

**For quick launch:** Use EAS Managed.

---

### B.6 Build Commands

**Development Build (for testing):**
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

**Preview Build (internal testing):**
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

**Production Build:**
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

**Build Time:** 15-30 minutes per platform

---

## C. App Store & Play Store Submission Prep

### C.1 Required Assets

#### iOS App Store

**Screenshots Required:**
- iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796 px
- iPhone 6.5" (iPhone 11 Pro Max): 1242 x 2688 px
- iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 px
- iPad Pro 12.9": 2048 x 2732 px
- iPad Pro 11": 1668 x 2388 px

**Minimum:** 1 screenshot per device size
**Recommended:** 3-5 screenshots per size

**App Icon:**
- ✅ Already exists: `assets/images/icon.png`
- **Size:** 1024 x 1024 px (required)

**Other Assets:**
- App preview video (optional)
- Marketing URL (optional)
- Support URL (required)

---

#### Google Play Store

**Screenshots Required:**
- Phone: 16:9 or 9:16 aspect ratio, min 320px height
- Tablet: 16:9 or 9:16 aspect ratio, min 320px height
- **Minimum:** 2 screenshots
- **Recommended:** 4-8 screenshots

**Feature Graphic:**
- **Size:** 1024 x 500 px
- **Required:** Yes
- **Current:** ❌ Missing - must create

**App Icon:**
- ✅ Already exists: `assets/images/android-icon-foreground.png`
- **Size:** 512 x 512 px (Play Store will generate from adaptive icon)

---

### C.2 App Store Listing Text

#### Short Description (170 characters max)
```
OnlySwap - Buy and sell items with students at your university. Browse products, place bids, and chat with sellers in real-time.
```

#### Full Description (4000 characters max)
```
OnlySwap is the campus marketplace designed exclusively for university students. Connect with your campus community to buy and sell items safely and easily.

KEY FEATURES:
• University-verified accounts - Only .edu email addresses
• Swipe through products - Tinder-style browsing experience
• Real-time bidding - Place bids and negotiate prices
• Instant messaging - Chat with sellers directly
• Campus feed - See what's happening on your campus
• Secure transactions - All communication happens in-app

HOW IT WORKS:
1. Sign up with your .edu email address
2. Browse products from students at your university
3. Swipe right to save, swipe left to pass
4. Place bids on items you like
5. Chat with sellers to arrange pickup
6. Meet up and complete the transaction

SAFE & SECURE:
• All users verified with university email
• Real-time chat for safe communication
• Report system for inappropriate content
• Privacy-focused design

PERFECT FOR:
• Textbooks and course materials
• Electronics and gadgets
• Furniture and dorm essentials
• Clothing and accessories
• Sports equipment
• And much more!

Download OnlySwap today and start buying and selling with your campus community!
```

#### Keywords (100 characters max)
```
university, campus, marketplace, buy, sell, students, textbooks, college, swap, trade
```

#### Support URL
```
https://onlyswap.com/support
```
**Note:** Must be publicly accessible. Host on your website or use GitHub Pages.

#### Marketing URL (optional)
```
https://onlyswap.com
```

#### Privacy Policy URL
```
https://onlyswap.com/privacy-policy
```
**Note:** Must be publicly accessible. See Section C.4.

---

### C.3 Google Play Store Listing Text

#### Short Description (80 characters max)
```
Buy and sell with students at your university. Campus marketplace for verified students.
```

#### Full Description (4000 characters max)
```
OnlySwap is the campus marketplace designed exclusively for university students. Connect with your campus community to buy and sell items safely and easily.

KEY FEATURES:
• University-verified accounts - Only .edu email addresses
• Swipe through products - Tinder-style browsing experience
• Real-time bidding - Place bids and negotiate prices
• Instant messaging - Chat with sellers directly
• Campus feed - See what's happening on your campus
• Secure transactions - All communication happens in-app

HOW IT WORKS:
1. Sign up with your .edu email address
2. Browse products from students at your university
3. Swipe right to save, swipe left to pass
4. Place bids on items you like
5. Chat with sellers to arrange pickup
6. Meet up and complete the transaction

SAFE & SECURE:
• All users verified with university email
• Real-time chat for safe communication
• Report system for inappropriate content
• Privacy-focused design

PERFECT FOR:
• Textbooks and course materials
• Electronics and gadgets
• Furniture and dorm essentials
• Clothing and accessories
• Sports equipment
• And much more!

Download OnlySwap today and start buying and selling with your campus community!
```

#### App Category
- **Primary:** Shopping
- **Secondary:** Education (optional)

---

### C.4 Host Privacy Policy & Terms

**Current State:** Privacy Policy and Terms exist in-app but need public URLs.

**Required URLs:**
- Privacy Policy: `https://onlyswap.com/privacy-policy`
- Terms of Service: `https://onlyswap.com/terms-of-service`
- Support: `https://onlyswap.com/support`

**Quick Hosting Options:**

#### Option 1: GitHub Pages (Free)
1. Create `docs/` folder in repo
2. Copy content from `app/privacy-policy.tsx` to HTML
3. Enable GitHub Pages
4. URL: `https://yourusername.github.io/OnlySwap/privacy-policy.html`

#### Option 2: Netlify/Vercel (Free)
1. Create simple HTML pages
2. Deploy to Netlify/Vercel
3. Get free subdomain: `onlyswap.netlify.app`

#### Option 3: Your Own Domain
- Buy domain: `onlyswap.com`
- Host static HTML pages
- Point DNS to hosting provider

**Action:** Extract content from React components and create static HTML pages.

---

### C.5 Data Collection Disclosures

**Based on code analysis, you collect:**

**Required Disclosures for App Store:**
- ✅ User account information (name, email, university)
- ✅ Profile pictures (optional)
- ✅ Product listings and images
- ✅ Chat messages
- ✅ Usage analytics (swipes, views)
- ✅ Device information (for app functionality)

**Privacy Policy Coverage:**
- ✅ Already covers all data collection (see `app/privacy-policy.tsx`)
- ⚠️ Must be hosted publicly for App Store Connect

**App Store Privacy Questions:**
1. **Does your app collect data?** Yes
2. **What data?** See privacy policy
3. **How is it used?** See privacy policy
4. **Is data shared?** No (currently)
5. **Is data used for tracking?** No (currently)

---

### C.6 Age Rating

**iOS:**
- **Recommended:** 17+ (due to user-generated content, unmoderated chat)
- **Alternative:** 12+ if you add content moderation

**Android:**
- **Content Rating:** Teen (user-generated content)
- **Complete questionnaire in Play Console**

---

## D. Production Hardening

### D.1 Fix Incomplete Features

#### Fix 1: Hide Account Deletion

**File:** `app/settings.tsx`

**Option A: Remove Button (Recommended)**
```typescript
// Comment out or remove the "Delete Account" section
// Until feature is implemented
```

**Option B: Disable with Badge**
```typescript
{
  title: 'Delete Account',
  onPress: () => {
    Alert.alert(
      'Coming Soon',
      'Account deletion will be available in a future update.',
      [{ text: 'OK' }]
    );
  },
  disabled: true,
  // Add visual indicator it's disabled
}
```

**Action:** See Section F for code fix.

---

#### Fix 2: Remove Archive Chat Gesture

**File:** `app/(tabs)/chat.tsx`

**Option A: Remove Swipe Gesture (Recommended)**
```typescript
// Remove or comment out the swipe gesture code
// Lines ~380-405
```

**Option B: Implement Basic Archive**
```typescript
const handleArchive = async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  translateX.value = withSpring(0);
  // TODO: Call API to archive chat
  // For now, just close the swipe
};
```

**Action:** See Section F for code fix.

---

### D.2 Remove Console Logs

**Found:** 342 console statements across 53 files

**Automated Fix Script:**

Create `scripts/remove-console-logs.js`:
```javascript
// Script to wrap console.log in __DEV__ checks
// Run: node scripts/remove-console-logs.js
```

**Manual Fix Pattern:**
```typescript
// Before:
console.log('Debug message');
console.error('Error message');

// After:
if (__DEV__) {
  console.log('Debug message');
}
if (__DEV__) {
  console.error('Error message');
}
```

**Critical Files to Fix:**
- `services/api.ts` (already has some `__DEV__` checks)
- `app/(tabs)/profile.tsx`
- `app/(tabs)/chat.tsx`
- `app/(tabs)/feed.tsx`
- All other app files with console statements

**Action:** See Section F for automated fix.

---

### D.3 Add Error Boundaries

**File:** `components/ErrorBoundary.tsx` (create new)

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Button title="Reload App" onPress={() => this.setState({ hasError: false })} />
        </View>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Wrap App:**
```typescript
// app/_layout.tsx
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      {/* existing code */}
    </ErrorBoundary>
  );
}
```

---

### D.4 Crash Reporting (Minimum Viable)

**Option 1: Sentry (Recommended)**
- **Cost:** Free tier (5,000 events/month)
- **Setup:** 10 minutes
- **Steps:**
  1. Sign up at https://sentry.io
  2. Create React Native project
  3. Install: `npx expo install @sentry/react-native`
  4. Configure in `app/_layout.tsx`

**Option 2: Expo Error Reporting**
- Built into Expo
- Automatic crash reports
- View in Expo dashboard

**For Quick Launch:** Use Expo's built-in error reporting.

---

### D.5 Performance Optimizations

**Current Issues:**
- No pagination in product listings (loads all products)
- No image optimization/caching
- Large bundle size (check with `expo export`)

**Quick Wins:**
1. Add pagination to product API (see backend)
2. Enable image caching (expo-image already handles this)
3. Remove unused dependencies

**Can be done post-launch** if app works well.

---

## E. Final Go-Live Plan

### E.1 Pre-Launch Checklist

**Backend:**
- [ ] Backend deployed to production
- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] Health endpoint returns 200
- [ ] Test API endpoints work
- [ ] File storage configured (S3 or persistent volume)

**App Configuration:**
- [ ] `app.json` updated with Android package
- [ ] `eas.json` configured with production profile
- [ ] `apiConfig.ts` updated with production URL
- [ ] Incomplete features hidden/removed
- [ ] Console logs wrapped in `__DEV__` checks

**Builds:**
- [ ] iOS production build successful
- [ ] Android production build successful
- [ ] TestFlight build tested
- [ ] Internal testing track tested (Android)

**Store Listings:**
- [ ] Screenshots created for all required sizes
- [ ] App descriptions written
- [ ] Privacy Policy hosted publicly
- [ ] Terms of Service hosted publicly
- [ ] Support URL configured

---

### E.2 Staged Rollout Strategy

**Phase 1: Internal Testing (Week 1)**
- TestFlight (iOS) - 10-20 testers
- Internal testing track (Android) - 10-20 testers
- Fix critical bugs
- Gather feedback

**Phase 2: Limited Release (Week 2)**
- iOS: Release to 10% of users
- Android: Release to 10% of users
- Monitor crash reports
- Monitor backend performance

**Phase 3: Full Release (Week 3)**
- iOS: 100% rollout
- Android: 100% rollout
- Monitor closely for 48 hours

---

### E.3 Post-Launch Monitoring

**Metrics to Track:**
- Crash-free rate (target: >99%)
- API response times
- Error rates
- User signups
- Active users
- App Store ratings

**Tools:**
- Expo Analytics (built-in)
- Sentry (if configured)
- Backend logs (Winston)
- App Store Connect Analytics
- Google Play Console Analytics

---

### E.4 Rollback Plan

**If Critical Bug Found:**

**iOS:**
1. Stop new downloads in App Store Connect
2. Submit emergency update
3. Fast-track review (if critical security issue)

**Android:**
1. Pause rollout in Play Console
2. Submit emergency update
3. Rollback to previous version if needed

**Backend:**
1. Revert to previous deployment
2. Or deploy hotfix immediately
3. Monitor error rates

---

## F. Code Fixes Required

See separate files:
- `FIXES_app.json` - App configuration updates
- `FIXES_eas.json` - EAS build configuration
- `FIXES_apiConfig.ts` - Production API URL fix
- `FIXES_incomplete_features.tsx` - Hide incomplete features
- `FIXES_console_logs.md` - Console log removal guide

---

## 📊 Summary

**Time Estimate:**
- Backend deployment: 2-4 hours
- Code fixes: 2-3 hours
- Store listing prep: 3-4 hours
- Build & test: 2-3 hours
- **Total: 1-2 days of focused work**

**Cost Estimate:**
- Apple Developer: $99/year
- Google Play: $25 one-time
- Backend hosting: $5-20/month
- MongoDB Atlas: Free tier available
- **Total first year: ~$150-200**

**Next Steps:**
1. Deploy backend (Section A)
2. Fix code issues (Section D, F)
3. Configure builds (Section B)
4. Prepare store listings (Section C)
5. Build and submit (Section B.6)

---

**Ready to launch? Start with Section A.1 (Backend Deployment)!**
