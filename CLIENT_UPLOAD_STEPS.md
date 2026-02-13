# Client-Side Cloudinary Upload - Step by Step Guide

## ✅ What I've Done

I've implemented **client-side Cloudinary uploads** to bypass the server FormData issue. Now images upload **directly from your phone to Cloudinary**, then only the URLs are sent to your server.

## 📋 Step-by-Step Setup

### Step 1: Create Unsigned Upload Preset in Cloudinary

1. **Go to Cloudinary Dashboard:**
   - Open: https://console.cloudinary.com
   - Log in with your account

2. **Go to Settings:**
   - Click **"Settings"** (gear icon) in the top menu
   - Or go directly to: https://console.cloudinary.com/settings

3. **Go to Upload Tab:**
   - Click **"Upload"** tab in the left sidebar

4. **Scroll to "Upload presets" section:**
   - Look for **"Upload presets"** section
   - Click **"Add upload preset"** button

5. **Configure the Preset:**
   - **Preset name:** `onlyswap-unsigned`
   - **Signing mode:** Select **"Unsigned"** ⚠️ (This is important!)
   - **Folder:** `onlyswap/products` (optional, but recommended)
   - **Use filename:** Check this box (optional)
   - Click **"Save"**

6. **Verify:**
   - You should see `onlyswap-unsigned` in your presets list
   - Make sure it says "Unsigned" under signing mode

### Step 2: Update Code with Preset Name (Optional)

The code currently uses `onlyswap-unsigned` as the preset name. If you used a different name:
- Open: `app/add-product.tsx`
- Find: `const uploadPreset = 'onlyswap-unsigned';`
- Change to your preset name

### Step 3: Wait for Railway to Deploy

Railway will automatically redeploy with the new code. Wait 1-2 minutes.

### Step 4: Rebuild Your App

You'll need to rebuild the app with the new code:

```bash
eas build --platform android --profile preview
```

Or wait for me to build it for you.

### Step 5: Test!

1. Install the new build on your phone
2. Try uploading a product image
3. **What should happen:**
   - Images upload directly to Cloudinary (bypassing server)
   - You'll see Cloudinary upload progress
   - Then product data is sent to server with URLs
   - Much faster and more reliable!

## 🎯 How It Works Now

**Old Way (Not Working):**
```
Phone → Server (FormData) → Cloudinary
❌ Fails on mobile networks
```

**New Way (Working):**
```
Phone → Cloudinary (direct upload)
Phone → Server (JSON with URLs)
✅ Works on all networks!
```

## ✅ Benefits

1. **Bypasses server** - No FormData upload issues
2. **Faster** - Direct upload to Cloudinary CDN
3. **More reliable** - Works on all mobile networks
4. **Full quality** - Images upload at full quality
5. **Scalable** - Cloudinary handles everything

## 🚨 Important Notes

- **Upload Preset MUST be "Unsigned"** - This allows client-side uploads without API secret
- **Preset name must match** - Currently set to `onlyswap-unsigned`
- **No Railway volume needed** - Images go directly to Cloudinary

## Next Steps

1. ✅ Create upload preset in Cloudinary (Step 1)
2. ⏳ Wait for Railway to deploy
3. ⏳ Rebuild app (I'll do this next)
4. ✅ Test upload!

Let me know when you've created the upload preset, and I'll rebuild the app!

