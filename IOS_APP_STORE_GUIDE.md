# iOS App Store Publishing Guide for OnlySwap

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - You'll need this to submit apps to the App Store

2. **Mac Computer** (required for building iOS apps)
   - You need a Mac with Xcode installed to build iOS apps
   - Alternatively, use EAS Build (Expo's cloud build service) - no Mac required!

3. **Expo Account** (free)
   - Sign up at: https://expo.dev
   - Required for EAS Build service

## Step 1: Update app.json Configuration

Your `app.json` needs iOS-specific configuration. Here's what to add:

```json
{
  "expo": {
    "name": "OnlySwap",
    "slug": "OnlySwap",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "onlyswap",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.onlyswap",  // ⚠️ CHANGE THIS
      "buildNumber": "1",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "We need access to your photos to upload product images.",
        "NSCameraUsageDescription": "We need access to your camera to take photos of products."
      }
    },
    "android": {
      // ... existing config
    }
  }
}
```

**Important:** Change `bundleIdentifier` to something unique like `com.yourname.onlyswap` or `com.yourcompany.onlyswap`

## Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 3: Login to Expo

```bash
eas login
```

## Step 4: Configure EAS Build

```bash
eas build:configure
```

This creates an `eas.json` file in your project root.

## Step 5: Update eas.json

Make sure your `eas.json` looks like this:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.yourcompany.onlyswap"  // Match app.json
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 6: Build for iOS

### Option A: Using EAS Build (Recommended - No Mac Required)

```bash
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud
- Take about 15-30 minutes
- Generate an `.ipa` file ready for App Store submission

### Option B: Local Build (Requires Mac with Xcode)

```bash
npx expo prebuild
npx expo run:ios --configuration Release
```

## Step 7: Submit to App Store

### Using EAS Submit (Easiest)

```bash
eas submit --platform ios
```

This will:
- Guide you through App Store Connect setup
- Upload your app automatically
- Handle certificates and provisioning profiles

### Manual Submission

1. **App Store Connect Setup:**
   - Go to https://appstoreconnect.apple.com
   - Create a new app
   - Fill in app information (name, description, screenshots, etc.)

2. **Upload via Transporter:**
   - Download Transporter app from Mac App Store
   - Upload the `.ipa` file generated from EAS Build

3. **Submit for Review:**
   - In App Store Connect, submit your app for review
   - Wait for Apple's review (usually 1-3 days)

## Step 8: Required App Store Assets

You'll need to prepare:

1. **App Screenshots:**
   - iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796 pixels
   - iPhone 6.5" (iPhone 11 Pro Max): 1242 x 2688 pixels
   - iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 pixels
   - iPad Pro 12.9": 2048 x 2732 pixels

2. **App Icon:**
   - 1024 x 1024 pixels (no transparency)
   - Already configured in your `app.json`

3. **App Description:**
   - Short description (up to 170 characters)
   - Full description (up to 4000 characters)
   - Keywords (up to 100 characters)

4. **Privacy Policy URL:**
   - Required for App Store submission
   - Must be a publicly accessible URL

5. **Support URL:**
   - Your website or support page

## Step 9: App Store Connect Information

Fill out in App Store Connect:

- **App Name:** OnlySwap
- **Subtitle:** (optional, up to 30 characters)
- **Category:** Shopping or Social Networking
- **Age Rating:** Complete the questionnaire
- **Pricing:** Free or Paid
- **App Privacy:** Describe what data you collect

## Important Notes

1. **Bundle Identifier:** Must be unique and match your Apple Developer account
2. **Version Number:** Increment for each new release
3. **Build Number:** Must increment for each build (even same version)
4. **TestFlight:** Use for beta testing before App Store release
5. **Review Guidelines:** Make sure your app complies with Apple's guidelines

## Quick Commands Reference

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## Troubleshooting

- **Certificate Issues:** EAS handles this automatically
- **Provisioning Profile:** EAS handles this automatically
- **Build Errors:** Check logs with `eas build:view [BUILD_ID]`
- **Submission Errors:** Check App Store Connect for details

## Cost Breakdown

- **Apple Developer Program:** $99/year (required)
- **Expo EAS Build:** Free tier available, paid plans for more builds
- **App Store Review:** Free (but can take 1-3 days)

## Next Steps After Submission

1. Wait for Apple's review (1-3 days typically)
2. Address any review feedback if needed
3. Once approved, your app goes live!
4. Monitor reviews and ratings
5. Update regularly with new features

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

---

**Need Help?** Check Expo's documentation or their Discord community for support.




