# Cloudinary Client-Side Upload Setup - Step by Step

## Why Client-Side Upload?

Since FormData uploads through our server aren't working on mobile networks, we'll upload images **directly from your phone to Cloudinary**, then send only the URLs to our server.

## Step 1: Create Unsigned Upload Preset in Cloudinary

1. **Go to Cloudinary Dashboard:**
   - Open: https://console.cloudinary.com
   - Log in

2. **Go to Settings:**
   - Click **"Settings"** (gear icon) in the top menu
   - Or go to: https://console.cloudinary.com/settings

3. **Go to Upload Tab:**
   - Click **"Upload"** tab in Settings

4. **Create Upload Preset:**
   - Scroll down to **"Upload presets"** section
   - Click **"Add upload preset"** button
   - Fill in:
     - **Preset name:** `onlyswap-unsigned` (or any name you like)
     - **Signing mode:** Select **"Unsigned"** (important!)
     - **Folder:** `onlyswap/products` (optional, but recommended)
     - **Use filename:** Check this if you want to keep original filenames
   - Click **"Save"**

5. **Copy the Preset Name:**
   - Remember the preset name you created (e.g., `onlyswap-unsigned`)

## Step 2: Add Preset to Railway Environment Variables

1. **Go to Railway:**
   - Open: https://railway.app
   - Select your OnlySwap project
   - Click on your backend service

2. **Go to Variables:**
   - Click **"Variables"** tab

3. **Add New Variable:**
   - Click **"+ New Variable"**
   - **Key:** `CLOUDINARY_UPLOAD_PRESET`
   - **Value:** Your preset name (e.g., `onlyswap-unsigned`)
   - Click **"Add"**

4. **Verify You Have:**
   - ✅ `CLOUDINARY_CLOUD_NAME` = `dvvy7afel`
   - ✅ `CLOUDINARY_API_KEY` = `841918145766567`
   - ✅ `CLOUDINARY_API_SECRET` = `aPdidO_oKxmNW7WgM59WHNRA-uY`
   - ✅ `CLOUDINARY_UPLOAD_PRESET` = `onlyswap-unsigned` (or your preset name)

## Step 3: Update App Configuration

The code I'm adding will:
1. Upload images directly to Cloudinary from your phone
2. Get Cloudinary URLs back
3. Send only the URLs (not files) to your server
4. Server stores the URLs in database

## Step 4: Test

After the code is updated and you rebuild:
1. Try uploading a product image
2. Images will upload directly to Cloudinary
3. Much faster and more reliable on mobile networks!

## Benefits

✅ **Bypasses server** - No FormData upload issues
✅ **Faster** - Direct upload to Cloudinary CDN
✅ **More reliable** - Works better on mobile networks
✅ **Scalable** - Cloudinary handles all the heavy lifting

## Next Steps

I'll now update the code to use client-side Cloudinary uploads. After that, you'll need to:
1. Create the upload preset in Cloudinary (Step 1)
2. Add it to Railway (Step 2)
3. Rebuild the app
4. Test!

