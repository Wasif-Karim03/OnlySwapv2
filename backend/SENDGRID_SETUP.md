# SendGrid Setup Guide 📧

## Fixing "Forbidden" Error

If you're seeing `❌ Error sending password reset email: Forbidden`, it means SendGrid is blocking your email. Here's how to fix it:

## Step 1: Verify Sender Email in SendGrid

The "Forbidden" error usually means the sender email (`onlyswapwck@gmail.com`) is not verified in SendGrid.

### How to Verify Sender Email:

1. **Go to SendGrid Dashboard**
   - Visit: https://app.sendgrid.com/
   - Sign in with your SendGrid account

2. **Navigate to Settings → Sender Authentication**
   - Click on "Settings" in the left sidebar
   - Click on "Sender Authentication"

3. **Verify Single Sender Email**
   - Click "Verify a Single Sender"
   - Enter: `onlyswapwck@gmail.com`
   - Fill in all required information:
     - From Name: `OnlySwap Support`
     - From Email: `onlyswapwck@gmail.com`
     - Reply To: `onlyswapwck@gmail.com`
     - Company Address (required)
     - Website URL
   - Click "Create"

4. **Check Your Email**
   - SendGrid will send a verification email to `onlyswapwck@gmail.com`
   - Click the verification link in the email
   - Wait for verification to complete (may take a few minutes)

5. **Verify Status**
   - Go back to SendGrid Dashboard → Settings → Sender Authentication
   - You should see `onlyswapwck@gmail.com` with status "Verified" ✅

## Step 2: Check API Key Permissions

1. **Go to Settings → API Keys**
   - Click on "Settings" in the left sidebar
   - Click on "API Keys"

2. **Check Your API Key**
   - Find the API key you're using (the one in Railway `SENDGRID_API_KEY`)
   - Click on it to view details

3. **Verify Permissions**
   - Make sure "Mail Send" permission is enabled
   - If not, create a new API key with "Full Access" or "Restricted Access" with "Mail Send" enabled

4. **Update Railway Environment Variable**
   - Go to Railway Dashboard → Your Project → Variables
   - Update `SENDGRID_API_KEY` with the new API key if needed
   - Redeploy your service

## Step 3: Alternative - Use Domain Authentication (Recommended for Production)

For better deliverability, verify your domain instead of a single sender:

1. **Go to Settings → Sender Authentication**
2. **Click "Authenticate Your Domain"**
3. **Follow the DNS setup instructions**
4. **Add the DNS records to your domain provider**
5. **Wait for verification (can take up to 48 hours)**

Once verified, you can send from any email on that domain.

## Step 4: Test Email Sending

After setup, test by requesting a password reset. Check Railway logs for:

- ✅ `Password reset email sent to: user@university.edu` (success)
- ❌ `Error sending password reset email: Forbidden` (still not fixed)

## Troubleshooting

### Still Getting "Forbidden" Error?

1. **Check Sender Verification Status**
   - Go to SendGrid → Settings → Sender Authentication
   - Make sure `onlyswapwck@gmail.com` shows as "Verified" ✅

2. **Check API Key**
   - Make sure `SENDGRID_API_KEY` in Railway matches your SendGrid API key
   - Verify the API key has "Mail Send" permissions

3. **Check SendGrid Account Status**
   - Make sure your SendGrid account is active (not suspended)
   - Check if you've hit any rate limits

4. **Check Email Address Format**
   - Make sure you're using the exact email: `onlyswapwck@gmail.com`
   - No typos or extra spaces

5. **Wait for Propagation**
   - After verifying sender, wait 5-10 minutes for changes to propagate
   - Try again after waiting

### Getting Other Errors?

- **"Unauthorized"**: API key is invalid or missing
- **"Bad Request"**: Email format is invalid
- **"Rate Limit"**: Too many requests - wait and try again

## Quick Fix Checklist

- [ ] Sender email (`onlyswapwck@gmail.com`) is verified in SendGrid
- [ ] API key has "Mail Send" permissions
- [ ] `SENDGRID_API_KEY` is set correctly in Railway
- [ ] Railway service has been redeployed after changes
- [ ] Waited 5-10 minutes after verification for propagation

## Need Help?

If you're still having issues:
1. Check Railway logs for detailed error messages
2. Check SendGrid Activity Feed for delivery status
3. Verify all steps above are completed

