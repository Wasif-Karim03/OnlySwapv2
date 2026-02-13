# Email Setup Guide 📧

## Using Gmail SMTP (Recommended - Free & Simple)

The app now uses Gmail SMTP directly to send verification codes and password reset emails. This is **free** and **simple** - no need for SendGrid!

### Step-by-Step Instructions:

1. **Enable 2-Factor Authentication (2FA)**
   - Go to: https://myaccount.google.com/security
   - Under "Signing in to Google", click "2-Step Verification"
   - Follow the prompts to enable 2FA (you'll need your phone)

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in if prompted
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Type: "OnlySwap Backend" or any name you want
   - Click "Generate"

3. **Copy the App Password**
   - Google will show you a 16-character password (like: `abcd efgh ijkl mnop`)
   - **Copy this entire password** (you won't see it again!)
   - Make sure there are NO spaces when you paste it

4. **Add to Railway Environment Variables**
   - Go to Railway Dashboard → Your Project → Variables
   - Add these two variables:
     - `GMAIL_USER=onlyswapwck@gmail.com`
     - `GMAIL_APP_PASSWORD=abcdefghijklmnop` (your actual app password, no spaces)
   - Save and redeploy your service

5. **Test Email Sending**
   - Try creating an account or requesting a password reset
   - Check Railway logs for: `✅ Verification email sent to: user@university.edu`

### Important Notes:

- ✅ The App Password is **different** from your regular Gmail password
- ✅ You **cannot** use your regular Gmail password
- ✅ App Passwords work even with 2FA enabled
- ✅ Each app gets its own unique password
- ✅ You can revoke App Passwords anytime in Google settings
- ✅ **Free** - No SendGrid account needed!

### Troubleshooting:

**"Missing credentials" or "Invalid login"**
- App Password not added to Railway correctly
- Make sure there are NO spaces in the password
- Redeploy Railway service after adding variables

**"Less secure app access"**
- You need 2FA + App Password (not less secure apps)
- Follow the setup steps above

**Emails not sending**
- Check Railway logs for error messages
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
- Make sure the app password was copied without spaces

---

## Alternative: SendGrid (Fallback)

If you prefer to use SendGrid instead of Gmail:

1. **Get SendGrid API Key**
   - Sign up at: https://sendgrid.com/
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions

2. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Verify `onlyswapwck@gmail.com` as a single sender

3. **Add to Railway**
   - Add variable: `SENDGRID_API_KEY=your_api_key_here`
   - Redeploy service

**Note:** Gmail is preferred because it's free and doesn't require sender verification. SendGrid is only used as a fallback if Gmail is not configured.
