# 🚂 Railway Deployment Guide - OnlySwap

**Complete step-by-step guide to deploy your OnlySwap backend to Railway**

---

## Step 1: Connect GitHub to Railway

1. **Go to Railway:** https://railway.app
2. **Click "Login"** (top right)
3. **Select "Login with GitHub"**
4. **Authorize Railway** to access your GitHub account
5. You'll be redirected to Railway dashboard

---

## Step 2: Create New Project

1. **Click "New Project"** (top right, green button)
2. **Select "Deploy from GitHub repo"**
3. **You'll see a list of your repositories**
4. **Find and click "OnlySwap"** (your private repo)
5. Railway will start importing your repository

---

## Step 3: Configure Service Settings

After Railway imports your repo, you'll see a service. Click on it to configure:

1. **Click on the service** (it might be named "OnlySwap" or "web")
2. **Go to "Settings" tab**
3. **Configure these settings:**

   **Root Directory:**
   ```
   backend
   ```
   (This tells Railway to look in the `backend` folder)

   **Build Command:**
   ```
   npm install
   ```

   **Start Command:**
   ```
   npm start
   ```

4. **Click "Save"** or the changes auto-save

---

## Step 4: Set Up MongoDB Database

You have two options:

### Option A: MongoDB Atlas (Recommended - Free)

**Why:** Free tier available, more control, separate from Railway

1. **Go to:** https://www.mongodb.com/cloud/atlas
2. **Sign up** (free account)
3. **Create a new cluster:**
   - Click "Build a Database"
   - Choose **FREE** tier (M0)
   - Select a cloud provider (AWS recommended)
   - Choose a region close to you
   - Click "Create"
4. **Create Database User:**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Authentication: Password
   - Username: `onlyswap-admin` (or your choice)
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"
5. **Whitelist IP Address:**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
6. **Get Connection String:**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Replace `<password>` with your database user password
   - Add database name at the end: `/onlyswap`
   - Final string: `mongodb+srv://onlyswap-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/onlyswap?retryWrites=true&w=majority`

### Option B: Railway MongoDB Plugin

1. In Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"Add MongoDB"**
3. Railway will create a MongoDB instance
4. Click on the MongoDB service
5. Go to **"Variables"** tab
6. Copy the **`MONGO_URL`** value (this is your connection string)

---

## Step 5: Add Environment Variables

1. **In Railway, click on your OnlySwap service**
2. **Go to "Variables" tab**
3. **Click "New Variable"** for each:

   **Variable 1:**
   ```
   Name: MONGO_URI
   Value: [Your MongoDB connection string from Step 4]
   ```
   (Paste the full connection string here)

   **Variable 2:**
   ```
   Name: JWT_SECRET
   Value: 2WIQr65eprV6hRCZGlVe78JboJA/Lm3tO5A5SxcTXPU=
   ```
   (Use the same secret you generated earlier)

   **Variable 3:**
   ```
   Name: NODE_ENV
   Value: production
   ```

   **Variable 4:**
   ```
   Name: PORT
   Value: 3001
   ```
   (Railway will override this, but set it anyway)

   **Variable 5:**
   ```
   Name: LOG_LEVEL
   Value: info
   ```

   **Variable 6 (Optional - for email):**
   ```
   Name: COMPANY_EMAIL
   Value: your-email@gmail.com
   ```

   **Variable 7 (Optional - for email):**
   ```
   Name: COMPANY_EMAIL_PASSWORD
   Value: your-app-password
   ```
   (Gmail app password if you want email features)

   **Variable 8 (Optional):**
   ```
   Name: ALLOWED_ORIGINS
   Value: *
   ```
   (For CORS - allow all origins for now)

4. **Variables auto-save** - no need to click save

---

## Step 6: Deploy and Get URL

1. **Railway will automatically start deploying** when you add variables
2. **Go to "Deployments" tab** to see build progress
3. **Wait for deployment to complete** (2-5 minutes)
4. **Once deployed, go to "Settings" tab**
5. **Scroll down to "Networking" section**
6. **Click "Generate Domain"** (if not auto-generated)
7. **Copy the domain** (looks like: `onlyswap-production.up.railway.app`)

**This is your production API URL!** 🎉

---

## Step 7: Test Production Backend

**In your terminal, test the health endpoint:**

```bash
curl https://YOUR_RAILWAY_DOMAIN/health
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": { "status": "connected" }
}
```

**If you see this, your backend is live!** ✅

---

## Step 8: Update Expo App Configuration

**Now update your app to use the production URL:**

1. **Open:** `eas.json`
2. **Find the production profile:**
   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://your-backend-url.railway.app"
     }
   }
   ```
3. **Replace with your Railway domain:**
   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://YOUR_RAILWAY_DOMAIN"
     }
   }
   ```
4. **Save the file**

**Or set it when building:**
```bash
eas build --platform all --profile production --env EXPO_PUBLIC_API_URL=https://YOUR_RAILWAY_DOMAIN
```

---

## Step 9: View Logs (Optional)

**To see backend logs in Railway:**

1. Click on your service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"**
5. You'll see real-time logs from your backend

---

## 🔧 Troubleshooting

### Deployment Fails

**Check logs:**
1. Go to "Deployments" tab
2. Click on failed deployment
3. Check error messages

**Common issues:**
- **"Module not found"** → Make sure Root Directory is set to `backend`
- **"Port already in use"** → Railway handles ports automatically, remove PORT variable if causing issues
- **"MongoDB connection failed"** → Check MONGO_URI is correct, check MongoDB Atlas IP whitelist

### Health Endpoint Returns Error

**Check:**
1. MongoDB connection string is correct
2. MongoDB IP whitelist includes Railway's IPs (or 0.0.0.0/0)
3. Database user password is correct
4. Check Railway logs for specific errors

### Can't See Variables Tab

**Make sure:**
- You're on the service (not the project)
- You have the correct permissions
- Service is fully loaded

---

## ✅ Success Checklist

- [ ] Railway project created
- [ ] GitHub repo connected
- [ ] Root directory set to `backend`
- [ ] Build/Start commands configured
- [ ] MongoDB set up (Atlas or Railway)
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Domain generated
- [ ] Health endpoint returns 200
- [ ] `eas.json` updated with production URL

---

## 🎯 Next Steps

Once your backend is live:

1. ✅ **Test all API endpoints** from production
2. ✅ **Update `eas.json`** with production URL
3. ✅ **Build production app:** `eas build --platform all --profile production`
4. ✅ **Test app with production backend**
5. ✅ **Submit to App Stores**

---

**Your backend is now live on Railway!** 🚀
