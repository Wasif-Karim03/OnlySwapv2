# Incomplete Features List - OnlySwap

## 🔴 Critical Incomplete Features (Visible to Users)

### 1. **Account Deletion** 
**Location:** `app/settings.tsx:125-126`

**Status:** ❌ Not Implemented

**Current Behavior:**
- User can click "Delete Account" button
- Goes through confirmation dialogs
- Shows "Coming Soon" alert at the end

**Code:**
```typescript
// TODO: Implement account deletion
Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
```

**Impact:** 
- High - Users expect this feature to work
- Apple may reject if feature is visible but non-functional

**Fix Options:**
- **Option A:** Remove the button entirely
- **Option B:** Implement the feature (requires backend endpoint)
- **Option C:** Add "Coming Soon" badge and disable button

---

### 2. **Archive Chat Action**
**Location:** `app/(tabs)/chat.tsx:401-405`

**Status:** ❌ Not Implemented

**Current Behavior:**
- Swipe gesture on chat cards works
- Archive button appears when swiping
- Clicking archive does nothing (just closes the swipe)

**Code:**
```typescript
const handleArchive = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  translateX.value = withSpring(0);
  // TODO: Implement archive action
};
```

**Impact:**
- Medium - Feature is discoverable but non-functional
- Users may be confused when it doesn't work

**Fix Options:**
- **Option A:** Remove swipe-to-archive gesture entirely
- **Option B:** Implement archive functionality (requires backend support)
- **Option C:** Replace with delete/remove chat functionality

---

## 🟡 Configuration Issues (Not User-Facing)

### 3. **Firebase Configuration**
**Location:** `services/firebase.ts:6-14`

**Status:** ⚠️ Placeholder Values

**Current State:**
```typescript
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

**Impact:**
- Low - Only affects if Firebase features are used
- Need to check if Firebase is actually being used in the app

**Fix Required:**
- Replace with actual Firebase credentials if Firebase is needed
- Or remove Firebase if not being used

---

### 4. **Production API URL**
**Location:** `services/apiConfig.ts:42`

**Status:** ⚠️ Placeholder

**Current State:**
```typescript
// Production URL
if (typeof __DEV__ === 'undefined' || !__DEV__) {
  return 'https://your-production-api.com'; // Replace with production URL
}
```

**Impact:**
- **CRITICAL** - App will crash in production builds
- Must be fixed before App Store submission

**Fix Required:**
- Replace with actual production backend URL
- Or use environment variable: `process.env.EXPO_PUBLIC_API_URL`

---

## 🟢 Future Enhancements (Documented but Not Implemented)

### 5. **Chat Features (From Documentation)**
**Location:** `CHAT_SYSTEM_SUMMARY.md:230-239`

**Status:** 📋 Planned Features

**Listed but Not Implemented:**
- Typing Indicators ("Seller is typing...")
- Read Receipts (Double checkmarks for read messages)
- Message Reactions (Emoji reactions to messages)
- File Sharing (Share images/files in chat)
- Voice Messages (Record and send audio)
- Video Chat (Built-in video calling)
- Message Search (Find past messages)
- Chat Groups (Multiple participants)
- Message Pinning (Pin important messages)
- Chat Backup (Export chat history)

**Impact:**
- Low - These are future enhancements, not core features
- Not blocking for App Store submission

---

### 6. **Backend Production Features (From Documentation)**
**Location:** `backend/BACKEND_SUMMARY.md:187-195`

**Status:** 📋 Planned Features

**Listed but Not Implemented:**
- S3/Cloudinary for image storage (currently using local uploads)
- Rate limiting
- Pagination for large datasets
- Product search functionality
- WebSocket rooms per chat
- File upload validation enhancements
- Caching for frequently accessed data

**Impact:**
- Medium - Some are important for production (rate limiting, pagination)
- Should be implemented before scaling

---

## 📊 Summary

### By Priority

**🔴 Must Fix Before App Store:**
1. Account Deletion (hide or implement)
2. Archive Chat (remove or implement)
3. Production API URL (CRITICAL)

**🟡 Should Fix:**
4. Firebase Configuration (if using Firebase)

**🟢 Nice to Have:**
5. Chat enhancements
6. Backend production features

---

## 🎯 Recommended Actions

### Before App Store Submission:

1. **Hide Account Deletion Button**
   - Remove from UI or add "Coming Soon" badge
   - File: `app/settings.tsx`

2. **Remove Archive Gesture**
   - Remove swipe-to-archive functionality
   - File: `app/(tabs)/chat.tsx`

3. **Fix Production API URL**
   - Replace placeholder with actual URL
   - File: `services/apiConfig.ts`

4. **Check Firebase Usage**
   - Verify if Firebase is actually used
   - If not used, remove the file
   - If used, configure properly
   - File: `services/firebase.ts`

### After Launch (Future Updates):

- Implement account deletion with proper backend support
- Add archive/delete chat functionality
- Implement typing indicators
- Add read receipts
- Implement message search
- Add rate limiting to backend
- Implement pagination
- Add product search

---

## 📝 Notes

- All core features (authentication, marketplace, bidding, chat, notifications) are **fully implemented**
- The incomplete features are either:
  - Non-essential (archive chat)
  - Planned for future (chat enhancements)
  - Configuration issues (API URL, Firebase)
- Only 2 user-facing incomplete features need attention before App Store submission

---

**Last Updated:** Based on codebase review as of current date




