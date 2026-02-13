# Quick Fix: Verify Sender Email in SendGrid (5 minutes)

Since Resend requires domain verification, let's fix SendGrid instead - it's faster and simpler!

## Step 1: Verify Sender Email in SendGrid

1. **Go to SendGrid Dashboard**
   - Visit: https://app.sendgrid.com/
   - Sign in with your SendGrid account

2. **Navigate to Sender Authentication**
   - Click "Settings" in the left sidebar
   - Click "Sender Authentication"

3. **Verify Single Sender Email**
   - Click "Verify a Single Sender"
   - Fill in the form:
     - **From Name**: `OnlySwap Support`
     - **From Email**: `onlyswapwck@gmail.com`
     - **Reply To**: `onlyswapwck@gmail.com`
     - **Company Address**: Your address (required)
     - **Website URL**: Any URL (can be your app URL)
   - Click "Create"

4. **Check Your Email**
   - SendGrid will send a verification email to `onlyswapwck@gmail.com`
   - **Check your Gmail inbox** (and spam folder)
   - Click the verification link in the email
   - Wait for verification to complete (usually instant, max 5 minutes)

5. **Verify Status**
   - Go back to SendGrid → Settings → Sender Authentication
   - You should see `onlyswapwck@gmail.com` with status "Verified" ✅

## Step 2: Test Email Sending

1. **Wait 2-3 minutes** after verification
2. **Try requesting a password reset** in the app
3. **Check Railway logs** - you should see:
   ```
   ✅ Email sent via SendGrid to: mwkarim@owu.edu
   ```
4. **Check your email** - it should arrive within seconds!

## Why This Works

- ✅ SendGrid is already configured in Railway
- ✅ You already have the API key
- ✅ Only need to verify the sender email (5 minutes)
- ✅ No domain verification needed
- ✅ Works immediately after verification

## Troubleshooting

**"Forbidden" error still appears**
- Wait 5-10 minutes after verification for changes to propagate
- Make sure the sender email shows as "Verified" in SendGrid
- Try again after waiting

**Verification email not received**
- Check spam folder in Gmail
- Make sure you're checking `onlyswapwck@gmail.com`
- Try requesting verification again

Once verified, SendGrid will work perfectly and emails won't go to spam!

