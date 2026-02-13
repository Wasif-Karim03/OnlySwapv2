# Cloudinary Setup Guide

## ✅ What is Cloudinary?

Cloudinary is a cloud-based image and video management service that:
- **Stores images in the cloud** (not on Railway's filesystem)
- **Automatically optimizes images** (resize, compress, format conversion)
- **Serves images via CDN** (fast delivery worldwide)
- **Free tier:** 25GB storage + 25GB bandwidth/month

## 🚀 Setup Steps

### Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account
3. Verify your email

### Step 2: Get Your Credentials

1. After logging in, you'll see your **Dashboard**
2. Copy these three values:
   - **Cloud Name** (e.g., `dabc123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Add Credentials to Railway

1. Go to your Railway project: https://railway.app
2. Click on your **OnlySwap** service
3. Go to **Variables** tab
4. Click **+ New Variable** and add these three:

   ```
   CLOUDINARY_CLOUD_NAME = your-cloud-name
   CLOUDINARY_API_KEY = your-api-key
   CLOUDINARY_API_SECRET = your-api-secret
   ```

5. Click **Deploy** (Railway will automatically redeploy)

### Step 4: Test It!

1. Try uploading a product image from your app
2. Check Railway logs - you should see:
   ```
   ☁️ Using Cloudinary for image storage
   📸 Processing X image(s) with Cloudinary
   ✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...
   ```

3. The image URL in your database will be a Cloudinary URL (not `/uploads/...`)

## 📝 How It Works

### With Cloudinary (Recommended):
- Image uploads → Cloudinary cloud storage
- Images are optimized automatically
- Served via fast CDN
- **No Railway volume needed!**

### Without Cloudinary (Fallback):
- Images stored in `backend/uploads/` directory
- **Requires Railway volume** to persist files
- Files lost on container restart

## 🔄 Migration

The code automatically:
- **Uses Cloudinary** if credentials are configured
- **Falls back to local storage** if Cloudinary is not configured
- **No code changes needed** - just add the environment variables!

## ✅ Benefits

1. **Persistent storage** - Images never lost
2. **Automatic optimization** - Smaller file sizes, faster loading
3. **CDN delivery** - Fast image loading worldwide
4. **No Railway volume needed** - Simpler setup
5. **Free tier** - 25GB storage + 25GB bandwidth/month

## 🆘 Troubleshooting

### Images not uploading?
- Check Railway logs for Cloudinary errors
- Verify all three environment variables are set correctly
- Make sure Railway has redeployed after adding variables

### Still using local storage?
- Check if `CLOUDINARY_CLOUD_NAME` is set in Railway
- Look for "Using local storage" in logs (means Cloudinary not configured)

### Need help?
- Check Railway logs for detailed error messages
- Verify Cloudinary credentials in your Cloudinary dashboard

