# 🔧 Fix Email Connection Timeout Issue

## 🎯 Problem

Your app is showing "Connection timeout" errors when trying to send verification emails. This is because the email service can't connect to Gmail SMTP.

---

## ✅ Quick Fix (Two Options)

### **Option 1: Fix Email Configuration (Recommended)**

Make sure email credentials are set in Railway:

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Click on your OnlySwap service
   - Go to "Variables" tab

2. **Check these variables exist:**
   - `COMPANY_EMAIL` = `onlyswapwck@gmail.com`
   - `COMPANY_EMAIL_PASSWORD` = Your Gmail App Password

3. **If missing, add them:**
   - Click "New Variable"
   - Add `COMPANY_EMAIL` with value `onlyswapwck@gmail.com`
   - Add `COMPANY_EMAIL_PASSWORD` with your Gmail App Password

4. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in with `onlyswapwck@gmail.com`
   - Select "Mail" and "Other (Custom name)"
   - Name it "OnlySwap Railway"
   - Copy the 16-character password (remove spaces)
   - Add it to Railway as `COMPANY_EMAIL_PASSWORD`

5. **Redeploy:**
   - Railway will auto-redeploy when you add variables
   - Or manually trigger redeploy from "Deployments" tab

---

### **Option 2: Temporary Workaround (App Works Without Email)**

I've updated the code so that **signup will work even if email fails**. The verification code will be logged in Railway logs instead of sent via email.

**What I changed:**
- ✅ Added timeout configuration (10 seconds)
- ✅ Made email optional - signup continues even if email fails
- ✅ Verification codes are logged in Railway logs as fallback

**To see verification codes:**
1. Go to Railway → Your Service → "Deployments" → "View Logs"
2. Look for the verification code when someone signs up
3. Share the code with the user manually

---

## 🔍 Verify Email Configuration

### **Check Railway Variables:**

1. Go to Railway → Your Service → "Variables"
2. Verify these exist:
   ```
   COMPANY_EMAIL=onlyswapwck@gmail.com
   COMPANY_EMAIL_PASSWORD=your_16_char_app_password
   ```

### **Test Email Connection:**

After adding variables, check Railway logs. You should see:
- ✅ `Email server is ready to send messages` (on startup)
- ✅ `Verification email sent to: user@university.edu` (when working)

If you see:
- ❌ `Connection timeout` → Email credentials wrong or missing
- ❌ `Invalid login` → App password is incorrect
- ❌ `Missing credentials` → Variables not set

---

## 📝 Step-by-Step: Set Up Gmail App Password

### **Step 1: Enable 2-Factor Authentication**

1. Go to: https://myaccount.google.com/security
2. Under "Signing in to Google", click **"2-Step Verification"**
3. Follow prompts to enable 2FA (you'll need your phone)

### **Step 2: Create App Password**

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. Select:
   - **App:** Mail
   - **Device:** Other (Custom name)
   - **Name:** `OnlySwap Railway`
4. Click **"Generate"**
5. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)
6. **Remove all spaces** when pasting

### **Step 3: Add to Railway**

1. Go to Railway → Your Service → "Variables"
2. Click **"New Variable"**
3. Add:
   - **Name:** `COMPANY_EMAIL`
   - **Value:** `onlyswapwck@gmail.com`
4. Click **"New Variable"** again
5. Add:
   - **Name:** `COMPANY_EMAIL_PASSWORD`
   - **Value:** `your_16_char_password_without_spaces`
6. Railway will auto-redeploy

---

## 🚨 Important Notes

### **Why App Password?**
- Gmail requires App Passwords for third-party apps
- You **cannot** use your regular Gmail password
- App Passwords work even with 2FA enabled

### **Security:**
- App Passwords are specific to each app
- You can revoke them anytime
- They're different from your main password

### **Current Status:**
- ✅ **App will work** even without email (codes logged in Railway)
- ✅ **Signup won't fail** if email times out
- ⚠️ **Users need codes manually** until email is fixed

---

## ✅ After Fixing

Once email is configured:

1. **Test signup** - Create a test account
2. **Check email** - Verification code should arrive
3. **Check Railway logs** - Should see "✅ Verification email sent"
4. **No more timeout errors**

---

## 🆘 Still Having Issues?

### **Check Railway Logs:**
1. Go to Railway → Deployments → View Logs
2. Look for email-related errors
3. Share the error message for help

### **Common Issues:**

**"Connection timeout"**
- Email variables not set in Railway
- Gmail blocking Railway's IP
- Network issue

**"Invalid login"**
- App password is incorrect
- Password has spaces (remove them)
- Wrong email address

**"Missing credentials"**
- Variables not added to Railway
- Variable names are wrong (case-sensitive)
- Need to redeploy after adding variables

---

## 📊 What Changed in Code

1. **Added timeout configuration** (10 seconds)
2. **Made email optional** - signup works even if email fails
3. **Fallback logging** - codes logged in Railway if email fails
4. **Better error handling** - doesn't crash on email errors

---

**Your app should now work! Users can sign up even if email isn't configured yet.** 🎉

Once you add the email credentials to Railway, emails will start working automatically.

