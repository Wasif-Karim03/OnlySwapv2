# 🚨 Launch Blockers - OnlySwap

**Quick reference of critical issues that must be fixed before App Store submission**

---

## 🔴 CRITICAL (App Will Not Work)

### 1. Production API URL Not Configured
**File:** `services/apiConfig.ts:42`
**Status:** ⚠️ Placeholder URL will cause app crashes
**Fix:** 
- Deploy backend to production (Railway, Render, etc.)
- Update `EXPO_PUBLIC_API_URL` in `eas.json` production profile
- Or set via build command: `eas build --env EXPO_PUBLIC_API_URL=https://your-backend.railway.app`

**Action Required:** Deploy backend first, then update this URL.

---

### 2. Backend Not Deployed
**Current:** Running on `localhost:3001` (development only)
**Required:** Production server with:
- Node.js/Express API
- MongoDB database (Atlas recommended)
- File storage (S3, Cloudinary, or persistent volume)
- Socket.IO server

**Action Required:** See `README_RELEASE.md` Section A for deployment guide.

---

## 🟡 HIGH PRIORITY (App Store May Reject)

### 3. Incomplete Features Visible
**Status:** ✅ FIXED - Features hidden in code

**Files Fixed:**
- `app/settings.tsx` - Delete Account button commented out
- `app/(tabs)/chat.tsx` - Archive swipe gesture disabled

**Action Required:** None - already fixed.

---

### 4. Missing Android Package Name
**File:** `app.json`
**Status:** ✅ FIXED - Added `"package": "com.onlyswap.app"`

**Action Required:** None - already fixed.

---

### 5. Console Logs in Production
**Found:** 342 console statements across 53 files
**Status:** ⚠️ Should be wrapped in `__DEV__` checks

**Action Required:** 
- Wrap all console.log/error/warn in `if (__DEV__) { ... }`
- Or use automated script (see `README_RELEASE.md` Section D.2)

**Priority:** Medium - won't break app but unprofessional.

---

## 🟢 MEDIUM PRIORITY (Should Fix)

### 6. Missing Store Assets
**Required:**
- iOS screenshots (multiple device sizes)
- Android screenshots
- Android feature graphic (1024x500px)
- App descriptions
- Privacy Policy URL (must be publicly accessible)

**Action Required:** See `README_RELEASE.md` Section C.

---

### 7. EAS Submit Configuration
**File:** `eas.json`
**Status:** ⚠️ Placeholder values in submit section

**Required:**
- Apple ID
- App Store Connect App ID
- Apple Team ID
- Google Play service account (for Android)

**Action Required:** Fill in after creating App Store Connect / Play Console accounts.

---

### 8. Firebase Configuration
**File:** `services/firebase.ts`
**Status:** ⚠️ Placeholder values

**Action Required:** 
- Check if Firebase is actually used (grep for firebase imports)
- If not used: Remove file
- If used: Configure with actual credentials

**Note:** App appears to work without Firebase, so likely can be removed.

---

## ✅ ALREADY FIXED

- ✅ Android package name added to `app.json`
- ✅ `eas.json` updated with Android configuration
- ✅ `apiConfig.ts` updated to use environment variable
- ✅ Account deletion button hidden
- ✅ Archive chat gesture disabled

---

## 📋 Quick Action Checklist

**Before Building:**
- [ ] Deploy backend to production
- [ ] Update `EXPO_PUBLIC_API_URL` in `eas.json`
- [ ] Test production backend health endpoint
- [ ] Wrap console logs in `__DEV__` checks (optional but recommended)

**Before Submission:**
- [ ] Create App Store Connect account
- [ ] Create Google Play Console account
- [ ] Prepare screenshots
- [ ] Host Privacy Policy publicly
- [ ] Fill in `eas.json` submit section
- [ ] Test production builds

**See `README_RELEASE.md` for complete step-by-step guide.**
