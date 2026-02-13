# Resend Email Setup Guide 📧

## Why Resend?

✅ **Free** - 3,000 emails/month free tier  
✅ **Reliable** - Excellent deliverability, won't go to spam  
✅ **Perfect for .edu emails** - Great reputation with educational institutions  
✅ **Simple** - No sender verification needed  
✅ **Modern** - Clean API, fast setup  

## Quick Setup (5 minutes)

### Step 1: Sign Up for Resend

1. Go to: https://resend.com/signup
2. Sign up with your email (or use GitHub/Google)
3. Verify your email address

### Step 2: Get Your API Key

1. After signing in, go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "OnlySwap Production" (or any name)
4. Select "Sending access" permissions
5. Click "Create"
6. **Copy the API key immediately** (starts with `re_`)
   - Example: `re_1234567890abcdefghijklmnopqrstuvwxyz`
   - You won't see it again!

### Step 3: Add to Railway

1. Go to Railway Dashboard → Your Project → Variables
2. Click "New Variable"
3. Add:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_actual_api_key_here` (paste the key you copied)
4. Click "Add" or "Update Variables"
5. Railway will auto-redeploy

### Step 4: Verify It Works

1. Wait for Railway to redeploy (1-2 minutes)
2. Check Railway logs - you should see:
   ```
   ✅ Resend API configured (preferred - best deliverability)
   ```
3. Try requesting a password reset in the app
4. Check your email - it should arrive within seconds!

## Email Sender Address

By default, Resend uses `onboarding@resend.dev` as the sender. This works immediately and won't go to spam.

### Optional: Use Your Own Domain (Better Branding)

If you want to use `noreply@yourdomain.com` or `support@yourdomain.com`:

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Add your domain (e.g., `onlyswap.com`)
4. Add the DNS records Resend provides to your domain
5. Wait for verification (usually a few minutes)
6. Update the `fromEmail` in `backend/utils/emailService.js` to use your domain

**Note:** The default `onboarding@resend.dev` works perfectly fine and is recommended for getting started quickly.

## Free Tier Limits

- **3,000 emails/month** - More than enough for most apps
- **100 emails/day** - Daily sending limit
- **No credit card required**
- **Upgrade anytime** if you need more

## Troubleshooting

### "RESEND_API_KEY not set"
- Make sure you added `RESEND_API_KEY` to Railway variables
- Check the variable name is exactly `RESEND_API_KEY` (case-sensitive)
- Redeploy after adding the variable

### "Resend API error"
- Check that your API key is correct (starts with `re_`)
- Make sure the API key has "Sending access" permissions
- Check Railway logs for detailed error messages

### Emails not arriving
- Check spam folder (though Resend has great deliverability)
- Verify the recipient email address is correct
- Check Railway logs for any error messages
- Try sending to a different email address to test

## Why Resend Over Gmail/SendGrid?

| Feature | Resend | Gmail | SendGrid |
|---------|--------|-------|----------|
| Free Tier | 3,000/month | Unlimited* | 100/day |
| Setup Time | 5 minutes | 15+ minutes | 20+ minutes |
| Deliverability | Excellent | Good | Good |
| Spam Risk | Very Low | Medium | Medium |
| Sender Verification | Not needed | Required | Required |
| .edu Email Support | Excellent | Good | Good |

*Gmail has connection issues from cloud providers like Railway

## Need Help?

- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com
- Check Railway logs for detailed error messages

