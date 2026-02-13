# Firebase Setup Guide

## Configuration

To use Firebase Authentication and Firestore in your OnlySwap app, follow these steps:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select an existing project
3. Follow the setup wizard

### 2. Enable Firebase Services

#### Authentication:
1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** authentication
4. Click "Email/Password" → Toggle "Enable"
5. Save

#### Firestore Database:
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click "Enable"

### 3. Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

### 4. Add Configuration to Your App

Open `services/firebase.ts` and replace the placeholder config with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id",
};
```

### 5. Security Rules (Important for Production)

Once ready for production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more collections here as needed
  }
}
```

### 6. Test Your Setup

1. Start your Expo app: `npx expo start`
2. Try creating an account from the Create Account screen
3. Check Firebase Console → Authentication to see your user
4. Check Firestore Database → users collection to see user data

## Firestore Data Structure

### Users Collection
```
users/
  └── {userId}/
      ├── firstName: string
      ├── lastName: string
      ├── university: string
      ├── email: string
      └── createdAt: timestamp
```

## Troubleshooting

- **"App not authorized"**: Make sure your Firebase configuration is correct
- **Auth errors**: Verify Email/Password authentication is enabled
- **Firestore errors**: Check that Firestore is enabled and rules allow access
- **Network errors**: Ensure your device/emulator has internet connection

## Next Steps

- Add user profiles with avatars
- Create listings/posts collection
- Add messaging functionality
- Implement university-based filtering
- Add transaction history

