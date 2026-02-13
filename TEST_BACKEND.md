# 🧪 Backend Testing Guide

## Quick Start

### Step 1: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on port 3001
📡 API URL: http://localhost:3001
🌐 Network URL: http://206.21.136.212:3001
✅ Connected to MongoDB
```

### Step 2: Test Endpoints

**Option A: Use the test script**
```bash
cd backend
./test-endpoints.sh
```

**Option B: Manual testing with curl**

#### Test 1: Health Check
```bash
curl http://206.21.136.212:3001/health
```
Expected: `{"success":true,"message":"Server is healthy",...}`

#### Test 2: Auth Routes Test
```bash
curl http://206.21.136.212:3001/api/auth/test
```
Expected: `{"success":true,"message":"Auth routes are working!"}`

#### Test 3: CORS Preflight (OPTIONS)
```bash
curl -X OPTIONS http://206.21.136.212:3001/api/auth/profile \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```
Expected: HTTP 204 or 200 with CORS headers

#### Test 4: PUT Profile (without auth - should fail)
```bash
curl -X PUT http://206.21.136.212:3001/api/auth/profile \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test"}'
```
Expected: HTTP 401 (Unauthorized) - this confirms the route exists

#### Test 5: PUT Profile (with auth token)
```bash
# First, login to get a token
curl -X POST http://206.21.136.212:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.edu","password":"yourpassword"}'

# Copy the token from response, then:
curl -X PUT http://206.21.136.212:3001/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"firstName":"Test","lastName":"User"}'
```
Expected: `{"success":true,"message":"Profile updated successfully",...}`

### Step 3: Check Backend Logs

When you try to update profile from the app, watch the backend console. You should see:

```
📨 PUT /api/auth/profile
🔍 PUT /profile - Content-Type: multipart/form-data; boundary=...
📦 Detected FormData, processing with multer
✅ Multer processed successfully
📝 Profile update request: { userId: '...', hasFile: true, body: {...} }
✅ Profile updated for user: your@email.edu
```

## Troubleshooting

### ❌ "Cannot connect to server"

**Problem**: Server isn't running or not accessible

**Solution**:
1. Make sure the server is running: `cd backend && npm run dev`
2. Check the IP address is correct in `services/apiConfig.ts`
3. For Android emulator: Use `http://10.0.2.2:3001`
4. For physical device: Use your computer's IP address

### ❌ "Route not found" or 404

**Problem**: Route not registered

**Solution**:
1. Verify `server.js` has: `app.use('/api/auth', authRoutes);`
2. Verify `routes/authRoutes.js` has: `router.put('/profile', ...)`
3. Restart the server

### ❌ "CORS error" or "Network error"

**Problem**: CORS not configured correctly

**Solution**:
1. Check `server.js` has the CORS middleware
2. Verify it allows PUT method
3. Check `allowedHeaders` includes 'Content-Type' and 'Authorization'

### ❌ "401 Unauthorized"

**Problem**: Missing or invalid JWT token

**Solution**:
1. Make sure you're logged in
2. Check token is being sent in Authorization header
3. Verify token hasn't expired

### ❌ "500 Internal Server Error"

**Problem**: Server-side error

**Solution**:
1. Check backend console logs for error details
2. Verify MongoDB is running and connected
3. Check file upload directory exists: `backend/uploads/`

## ✅ Success Indicators

When everything is working:

1. ✅ Health endpoint returns 200
2. ✅ Auth test endpoint returns 200
3. ✅ CORS preflight returns 204/200
4. ✅ PUT without auth returns 401 (route exists)
5. ✅ PUT with auth updates profile successfully
6. ✅ Backend logs show request processing
7. ✅ App shows "Profile updated successfully"

## Network Configuration

**For Android Emulator:**
```typescript
// In apiConfig.ts
return 'http://10.0.2.2:3001';
```

**For Physical Device:**
```typescript
// In apiConfig.ts
return 'http://206.21.136.212:3001'; // Your computer's IP
```

**Find your IP:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or
ipconfig getifaddr en0
```

