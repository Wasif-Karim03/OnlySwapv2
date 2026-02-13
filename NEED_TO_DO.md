# 📋 Need to Do - OnlySwap Improvements

**Created:** January 2025  
**Status:** Pending - Will be addressed later

---

> **Note:** This document contains all the improvements, fixes, and enhancements identified during the pre-launch code review. We'll work through these systematically when ready.

---

## 🔴 CRITICAL ISSUES (Must Fix Before Launch)

### 1. **Security Vulnerabilities**

#### 1.1 CORS Configuration Too Permissive
**Location:** `backend/server.js:33`
```javascript
origin: '*', // ⚠️ DANGEROUS - Allows any origin
```
**Fix:** Restrict to specific origins in production

#### 1.2 Hardcoded IP Address in Production Code
**Location:** `services/apiConfig.ts:38, 50`
```typescript
return 'http://206.21.136.212:3001'; // ⚠️ Hardcoded IP
```
**Fix:** Remove hardcoded IPs, use environment variables only

#### 1.3 Missing Rate Limiting
**Issue:** No rate limiting middleware for API endpoints
**Risk:** Vulnerable to DDoS, brute force attacks, spam
**Fix:** Install and configure `express-rate-limit`

#### 1.4 Insufficient Password Requirements
**Location:** `backend/models/User.js:36`
```javascript
minlength: [6, 'Password must be at least 6 characters'], // ⚠️ Too weak
```
**Fix:** Enforce stronger passwords (min 8 chars, complexity requirements)

#### 1.5 JWT Secret Not Validated
**Issue:** No check if `JWT_SECRET` is set or is default value
**Risk:** Using default secret exposes all tokens
**Fix:** Add validation in `server.js`

#### 1.6 Missing Input Sanitization
**Issue:** User inputs not sanitized before database storage
**Risk:** XSS, NoSQL injection
**Fix:** Install `express-mongo-sanitize` and `helmet`

#### 1.7 File Upload Security
**Location:** `backend/routes/productRoutes.js`
**Issues:**
- No virus scanning
- File type validation relies only on MIME type (can be spoofed)
- No file content validation
**Fix:** Add file content validation

### 2. **Environment & Configuration**

#### 2.1 Missing Production API URL
**Location:** `services/apiConfig.ts:24`
```typescript
return 'https://your-production-api.com'; // ⚠️ Placeholder
```
**Fix:** Set actual production API URL before launch

#### 2.2 Missing `.env` File in `.gitignore`
**Location:** Root `.gitignore`
**Issue:** `.env` files not explicitly ignored
**Fix:** Add to `.gitignore`

#### 2.3 Missing Error Handling for Missing Env Vars
**Issue:** App may crash if required env vars are missing
**Fix:** Add validation in `server.js`

### 3. **Data Privacy & Legal**

#### 3.1 Missing Data Deletion Implementation
**Location:** `app/settings.tsx:124`
```typescript
// TODO: Implement account deletion
```
**Fix:** Implement user account deletion with data cleanup

#### 3.2 Missing Privacy Policy Updates
**Issue:** Privacy policy may not cover all data collection
**Review:** Ensure privacy policy mentions all data collection points

#### 3.3 Missing Data Retention Policy
**Issue:** No automatic cleanup of old data
**Fix:** Implement cleanup jobs

### 4. **Error Handling & Logging**

#### 4.1 Too Many console.log Statements
**Issue:** 200+ console.log statements in backend
**Risk:** Performance impact, potential information leakage
**Fix:** Use proper logging library (`winston` or `pino`)

#### 4.2 Missing Error Boundaries
**Location:** Frontend React components
**Issue:** No error boundaries to catch React errors
**Fix:** Add error boundary component

#### 4.3 Generic Error Messages Exposed
**Issue:** Some error messages may leak sensitive info
**Fix:** Sanitize error messages in production

---

## 🟡 HIGH PRIORITY (Should Fix Before Launch)

### 5. **Performance & Scalability**

#### 5.1 Missing Database Indexes
**Issue:** Some queries may be slow at scale
**Review:** Ensure indexes on frequently queried fields

#### 5.2 No Pagination
**Locations:** 
- `backend/controllers/productController.js` - `getProducts()`
- `backend/controllers/feedController.js` - `getFeedByUniversity()`
- `backend/controllers/adminUserController.js` - `getUsers()`
**Issue:** Will load all records into memory
**Fix:** Implement pagination

#### 5.3 Image Optimization
**Issue:** Images uploaded without optimization/resizing
**Fix:** Install `sharp` for image processing

#### 5.4 Missing Caching
**Issue:** No caching for frequently accessed data
**Fix:** Add Redis caching

### 6. **User Experience**

#### 6.1 Missing Loading States
**Issue:** Some operations don't show loading indicators
**Review:** Ensure all async operations show loading states

#### 6.2 Missing Offline Support
**Issue:** App doesn't work offline
**Fix:** Implement offline caching and sync

#### 6.3 Missing Push Notifications
**Issue:** No push notifications for important events
**Fix:** Implement Expo Push Notifications

#### 6.4 No Image Compression Before Upload
**Location:** `app/add-product.tsx`
**Issue:** Large images uploaded without compression
**Fix:** Compress images before upload

### 7. **Testing & Quality Assurance**

#### 7.1 No Automated Tests
**Issue:** No unit tests, integration tests, or E2E tests
**Fix:** Add testing framework

#### 7.2 Missing Test Coverage
**Issue:** Unknown code coverage
**Fix:** Add test coverage reporting

#### 7.3 No API Documentation
**Issue:** No Swagger/OpenAPI documentation
**Fix:** Add `swagger-jsdoc` and `swagger-ui-express`

### 8. **App Store Requirements**

#### 8.1 Missing App Store Assets
**Checklist:**
- [ ] App icon (all sizes) ✅
- [ ] Splash screen ✅
- [ ] Screenshots (various device sizes)
- [ ] App description
- [ ] Privacy policy URL ✅
- [ ] Terms of service URL ✅
- [ ] Support URL
- [ ] Age rating information

#### 8.2 Missing App Metadata
**Location:** `app.json`
**Review:** App name, version, build number, bundle identifier

#### 8.3 Missing Deep Linking Configuration
**Issue:** No deep linking for product details, chat rooms, feed posts
**Fix:** Configure Expo linking

#### 8.4 Missing Analytics
**Issue:** No analytics tracking
**Fix:** Add analytics (Firebase Analytics, Mixpanel, etc.)

---

## 🟢 MEDIUM PRIORITY (Nice to Have)

### 9. **Code Quality**

#### 9.1 Inconsistent Error Handling
**Issue:** Some functions use try-catch, others don't
**Fix:** Standardize error handling pattern

#### 9.2 Missing TypeScript Types
**Issue:** Some `any` types used
**Fix:** Add proper TypeScript types

#### 9.3 Code Duplication
**Issue:** Some code repeated across files
**Fix:** Extract common utilities

### 10. **Features**

#### 10.1 Missing Search Functionality
**Issue:** No search for products/users
**Fix:** Implement MongoDB text search

#### 10.2 Missing Filters
**Issue:** Limited filtering options
**Fix:** Add more filter options (price range, date, etc.)

#### 10.3 Missing Report/Flag System
**Issue:** Users can't report inappropriate content
**Fix:** Add report functionality for feed posts

#### 10.4 Missing Block User Feature
**Issue:** Users can't block other users
**Fix:** Implement user blocking system

### 11. **Monitoring & Observability**

#### 11.1 No Application Monitoring
**Issue:** No error tracking (Sentry, Bugsnag)
**Fix:** Add error monitoring

#### 11.2 No Performance Monitoring
**Issue:** No APM (Application Performance Monitoring)
**Fix:** Add APM tool

#### 11.3 No Health Checks
**Issue:** Basic health check exists, but no detailed monitoring
**Fix:** Add comprehensive health check endpoint

---

## 📋 PRE-LAUNCH CHECKLIST

### Security
- [ ] Fix CORS configuration
- [ ] Remove hardcoded IPs
- [ ] Add rate limiting
- [ ] Strengthen password requirements
- [ ] Validate JWT_SECRET
- [ ] Add input sanitization
- [ ] Improve file upload security
- [ ] Add HTTPS/SSL (production)

### Configuration
- [ ] Set production API URL
- [ ] Update `.gitignore`
- [ ] Add env var validation
- [ ] Remove debug console.logs
- [ ] Set `NODE_ENV=production`

### Legal & Privacy
- [ ] Implement account deletion
- [ ] Review privacy policy
- [ ] Add data retention policy
- [ ] GDPR compliance check

### Performance
- [ ] Add pagination
- [ ] Optimize images
- [ ] Add caching
- [ ] Review database indexes

### Testing
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Test on physical devices
- [ ] Test with slow network
- [ ] Test error scenarios

### App Store
- [ ] Prepare screenshots
- [ ] Write app description
- [ ] Set up App Store Connect
- [ ] Configure deep linking
- [ ] Test on TestFlight/Internal Testing

### Monitoring
- [ ] Set up error tracking
- [ ] Set up analytics
- [ ] Set up logging service
- [ ] Set up monitoring alerts

---

## 🛠️ QUICK WINS (Can Fix Immediately)

1. **Add `.env` to `.gitignore`**
2. **Remove hardcoded IPs from `apiConfig.ts`**
3. **Add rate limiting middleware**
4. **Remove/disable console.logs in production**
5. **Add error boundaries to React components**
6. **Add pagination to list endpoints**
7. **Compress images before upload**
8. **Add loading states to all async operations**
9. **Validate required environment variables**
10. **Add proper error messages**

---

## 📚 RECOMMENDED LIBRARIES TO ADD

### Security
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `express-mongo-sanitize` - Input sanitization
- `express-validator` - Input validation

### Performance
- `sharp` - Image processing
- `redis` - Caching
- `compression` - Response compression

### Monitoring
- `winston` or `pino` - Logging
- `@sentry/react-native` - Error tracking
- `@react-native-firebase/analytics` - Analytics

### Testing
- `jest` - Testing framework
- `supertest` - API testing
- `@testing-library/react-native` - React Native testing

---

## 🎯 PRIORITY ORDER

1. **Week 1:** Critical security fixes
2. **Week 2:** Configuration & environment setup
3. **Week 3:** Performance optimizations
4. **Week 4:** Testing & QA
5. **Week 5:** App Store preparation
6. **Week 6:** Monitoring & analytics setup

---

**Last Updated:** January 2025  
**Status:** Pending - Focus on frontend designs first

