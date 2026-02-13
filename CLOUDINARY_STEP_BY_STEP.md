# Cloudinary Setup - Step by Step Guide

Follow these steps to set up Cloudinary for your OnlySwap app.

---

## Step 1: Create Cloudinary Account

1. **Open your browser** and go to: https://cloudinary.com/users/register/free

2. **Fill out the sign-up form:**
   - Enter your email address
   - Create a password
   - Enter your name
   - Click **"Create Account"** or **"Start Free"**

3. **Verify your email:**
   - Check your email inbox
   - Click the verification link from Cloudinary
   - You'll be redirected to the Cloudinary dashboard

---

## Step 2: Get Your Cloudinary Credentials

Once you're logged into Cloudinary:

1. **You'll see your Dashboard** - This shows your account information

2. **Look for the "Account Details" section** (usually on the right side or top)

3. **You need to copy these THREE values:**
   - **Cloud Name** (e.g., `dabc123` or `my-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

4. **To see your API Secret:**
   - Click on **"Settings"** (gear icon) or go to: https://console.cloudinary.com/settings
   - Scroll down to **"Product Environment Credentials"**
   - Click **"Reveal"** next to API Secret
   - Copy the API Secret (keep this secure!)

5. **Write down or copy these three values:**
   ```
   Cloud Name: [your-cloud-name]
   API Key: [your-api-key]
   API Secret: [your-api-secret]
   ```

---

## Step 3: Add Credentials to Railway

Now let's add these credentials to your Railway backend:

1. **Go to Railway Dashboard:**
   - Open: https://railway.app
   - Log in if needed

2. **Select your project:**
   - Click on your **OnlySwap** project

3. **Select your service:**
   - Click on your backend service (the one running your Node.js app)
   - It should be named something like "OnlySwap" or "onlyswap-backend"

4. **Go to Variables tab:**
   - Click on the **"Variables"** tab (or **"Settings"** → **"Variables"**)

5. **Add the first variable - Cloud Name:**
   - Click **"+ New Variable"** or **"Add Variable"**
   - **Key:** `CLOUDINARY_CLOUD_NAME`
   - **Value:** Paste your Cloud Name (the one you copied from Step 2)
   - Click **"Add"** or **"Save"**

6. **Add the second variable - API Key:**
   - Click **"+ New Variable"** again
   - **Key:** `CLOUDINARY_API_KEY`
   - **Value:** Paste your API Key
   - Click **"Add"** or **"Save"**

7. **Add the third variable - API Secret:**
   - Click **"+ New Variable"** again
   - **Key:** `CLOUDINARY_API_SECRET`
   - **Value:** Paste your API Secret
   - **Important:** Make sure this is marked as **"Sensitive"** or **"Secret"** (Railway usually does this automatically)
   - Click **"Add"** or **"Save"**

8. **Verify all three variables are added:**
   - You should see:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - All three should be present

---

## Step 4: Deploy the Changes

Railway will automatically detect the new environment variables and redeploy:

1. **Check the deployment:**
   - Go to the **"Deployments"** tab
   - You should see a new deployment starting
   - Wait for it to complete (usually 1-2 minutes)
   - Status should show **"Deployment successful"**

2. **If it doesn't auto-deploy:**
   - Go to **"Settings"** → **"Deploy"**
   - Click **"Redeploy"** or **"Deploy Now"**

---

## Step 5: Test the Integration

Now let's verify that Cloudinary is working:

1. **Open your mobile app** (the one you built earlier)

2. **Try to upload a product:**
   - Go to "Add Product" or "Sell" screen
   - Fill in product details
   - Select an image
   - Click "Submit" or "List Product"

3. **Check Railway logs:**
   - Go back to Railway dashboard
   - Click on your service
   - Go to **"Logs"** tab
   - Look for these messages:
     ```
     ☁️ Using Cloudinary for image storage
     📸 Processing X image(s) with Cloudinary
     🖼️ Uploading to Cloudinary: product-xxx.jpg
     ✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...
     ```

4. **If you see Cloudinary URLs:**
   - ✅ **Success!** Cloudinary is working
   - Images are now stored in the cloud
   - They will persist even if Railway restarts

5. **If you see "Using local storage":**
   - ❌ Cloudinary credentials might not be set correctly
   - Double-check all three variables in Railway
   - Make sure Railway has redeployed

---

## Step 6: Verify Images in Cloudinary

1. **Go back to Cloudinary Dashboard:**
   - Open: https://console.cloudinary.com

2. **Click on "Media Library"** (left sidebar)

3. **You should see:**
   - A folder called **"products"** (or "onlyswap")
   - Your uploaded product images inside

4. **Click on an image:**
   - You'll see the image details
   - The URL will be something like: `https://res.cloudinary.com/[your-cloud]/image/upload/v1234567890/products/image.jpg`

---

## Troubleshooting

### Problem: "Using local storage" in logs
**Solution:**
- Check that all three variables are set in Railway
- Verify the variable names are exactly:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Make sure Railway has redeployed after adding variables

### Problem: "Cloudinary credentials not configured" error
**Solution:**
- Double-check you copied the credentials correctly
- Make sure there are no extra spaces in the values
- Verify the API Secret is the full secret (not truncated)

### Problem: Images not appearing in Cloudinary
**Solution:**
- Check Railway logs for upload errors
- Verify your Cloudinary account is active
- Check if you've exceeded the free tier limits (unlikely for testing)

### Problem: Still getting connection errors
**Solution:**
- This is separate from Cloudinary
- Check the "Cannot connect to server" issue first
- Cloudinary only handles image storage, not API connectivity

---

## Success Checklist

- [ ] Cloudinary account created
- [ ] All three credentials copied (Cloud Name, API Key, API Secret)
- [ ] All three variables added to Railway
- [ ] Railway deployment successful
- [ ] Test upload completed
- [ ] Railway logs show "Using Cloudinary for image storage"
- [ ] Images visible in Cloudinary Media Library

---

## What's Next?

Once Cloudinary is set up:
- ✅ Images will persist permanently
- ✅ No Railway volume needed
- ✅ Images automatically optimized
- ✅ Fast CDN delivery worldwide

You can now focus on fixing the "Cannot connect to server" issue if it's still happening.

---

## Need Help?

If you get stuck at any step:
1. Check Railway logs for error messages
2. Verify all credentials are correct
3. Make sure Railway has redeployed
4. Try uploading again and check the logs

Good luck! 🚀

