# Image Loading Testing Guide

## Quick Test Steps

### 1. **Test on Same Device (Uploader)**
   - Open the app as the user who uploaded "Assassin"
   - Go to Marketplace in **Buyer Mode**
   - You should see the product card with the image loaded
   - Check console logs: Look for `🖼️ ProductCard images for Assassin : [...]`
   - The image URL should be transformed to use your current API base URL

### 2. **Test on Different Device/User (Most Important)**
   - Log in as a **different user** (or use a different device)
   - Make sure they're from the same university (Ohio Wesleyan University)
   - Go to Marketplace in **Buyer Mode**
   - You should see all products including "Assassin"
   - **Key Test**: The image should load properly now (using their device's API URL)

### 3. **Check Console Logs**
   Look for these logs in your React Native console:
   ```
   🔧 API Base URL: http://[their-device-api-url]:3001
   📦 Raw API products: [...]
   🔄 Transformed products: [...]
   🖼️ ProductCard images for Assassin : ['http://[their-url]/uploads/product-xxx.jpg']
   ```

### 4. **Test Error Handling**
   - If image fails to load, you should see:
     - Placeholder icon with "Image unavailable" text
     - Console error: `❌ Failed to load image: [url]`
   - This means the error handling is working

## What to Verify

### ✅ Success Indicators:
1. **Images load** on buyer's device (even if uploaded from different device)
2. **URL transformation** - Check console logs show URLs using current device's API base URL
3. **Error handling works** - If image fails, placeholder shows instead of blank space
4. **No blank spaces** - Images either load OR show placeholder

### ❌ If Images Still Don't Load:
1. Check console logs for the transformed URL
2. Verify backend server is running and accessible
3. Test image URL directly in browser: `http://[api-url]/uploads/product-1762134778698-677568895.jpg`
4. Check network connectivity between device and server

## Testing Checklist

- [ ] Same device, same user - Image loads ✓
- [ ] Different device/user - Image loads ✓
- [ ] Console shows transformed URLs ✓
- [ ] Error handling shows placeholder when image fails ✓
- [ ] All product info (title, price, description) still visible ✓

## Debugging Commands

If issues persist, check:
```bash
# Check if backend is running
curl http://localhost:3001/health

# Test image URL directly
curl -I http://[your-api-url]/uploads/product-1762134778698-677568895.jpg

# Check product data structure
cd backend && node scripts/listProducts.js
```

