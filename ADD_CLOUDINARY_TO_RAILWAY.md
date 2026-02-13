# Add Cloudinary Credentials to Railway

## Your Cloudinary Credentials:
- **Cloud Name:** `dvvy7afel`
- **API Key:** `841918145766567`
- **API Secret:** `aPdidO_oKxmNW7WgM59WHNRA-uY`

## Steps to Add to Railway:

1. **Go to Railway Dashboard:**
   - Open: https://railway.app
   - Log in to your account

2. **Select Your Project:**
   - Click on your **OnlySwap** project

3. **Select Your Backend Service:**
   - Click on your backend service (the one running Node.js)
   - Usually named "OnlySwap" or similar

4. **Go to Variables Tab:**
   - Click on **"Variables"** tab (or **"Settings"** → **"Variables"**)

5. **Add First Variable - Cloud Name:**
   - Click **"+ New Variable"** or **"Add Variable"**
   - **Key:** `CLOUDINARY_CLOUD_NAME`
   - **Value:** `dvvy7afel`
   - Click **"Add"** or **"Save"**

6. **Add Second Variable - API Key:**
   - Click **"+ New Variable"** again
   - **Key:** `CLOUDINARY_API_KEY`
   - **Value:** `841918145766567`
   - Click **"Add"** or **"Save"**

7. **Add Third Variable - API Secret:**
   - Click **"+ New Variable"** again
   - **Key:** `CLOUDINARY_API_SECRET`
   - **Value:** `aPdidO_oKxmNW7WgM59WHNRA-uY`
   - **Important:** Make sure this is marked as **"Sensitive"** (Railway usually does this automatically)
   - Click **"Add"** or **"Save"**

8. **Verify All Three Are Added:**
   - You should see all three variables:
     - ✅ `CLOUDINARY_CLOUD_NAME` = `dvvy7afel`
     - ✅ `CLOUDINARY_API_KEY` = `841918145766567`
     - ✅ `CLOUDINARY_API_SECRET` = `aPdidO_oKxmNW7WgM59WHNRA-uY` (hidden/masked)

9. **Wait for Auto-Deploy:**
   - Railway will automatically detect the new variables
   - A new deployment will start automatically
   - Wait 1-2 minutes for it to complete
   - Check the "Deployments" tab to see the status

10. **Test It:**
    - Once deployment is complete, try uploading an image from your app
    - Check Railway logs - you should see:
      ```
      ☁️ Using Cloudinary for image storage
      ✅ Image uploaded to Cloudinary: https://res.cloudinary.com/dvvy7afel/...
      ```

## That's It! 🎉

Once Railway finishes deploying, Cloudinary will be active and all images will be stored in the cloud permanently.

