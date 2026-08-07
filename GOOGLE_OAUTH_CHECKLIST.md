# 🎯 Google OAuth Fix - Action Checklist

## The Problem (in 30 seconds)
Your `.env` has the same OAuth client ID for Expo Go and Web. Google's policy doesn't allow this.

## The Solution (in 3 steps)

### ☑️ Step 1: Create 3 OAuth Clients in Google Console
Go to: https://console.cloud.google.com/  
Create credentials:

1. **Expo Go** (Web application type)
   - Name: maxsas-oauth-expo
   - Redirect: `https://auth.expo.io/@YOUR_USERNAME/maxsas-ai-livekit/callback`
   - Copy client ID: `_______________`

2. **Web** (Web application type)
   - Name: maxsas-oauth-web
   - Redirects: 
     - `http://localhost:8081/callback`
     - `https://yourdomain.com/callback`
   - Copy client ID: `_______________`

3. **Android** (Android type)
   - Package: `com.maxsas.ai.livekit`
   - SHA-1: `_______________` (from command below)
   - Copy client ID: `_______________`

### ☑️ Step 2: Get Android SHA-1
Run this in terminal:
```bash
keytool -list -v -keystore /path/to/keystore.jks
# Paste your keystore password
# Find SHA1: line and copy the value
```

Add the SHA-1 to your Android OAuth client in Google Console.

### ☑️ Step 3: Update `.env`
Replace these three values with your different client IDs:

```bash
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=YOUR_EXPO_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_ID.apps.googleusercontent.com
```

## Verify It Works

```bash
# Test Expo Go
npx expo start
# Sign in with Google → should work ✓

# Test Web
npm run web
# Sign in with Google → should work ✓

# Test Android APK
npm run android:bundle
# Sign in with Google → should work ✓
```

## Code Changes Made (Already Applied)
- ✅ `lib/auth/google.ts` - Now uses platform-specific client IDs
- ✅ `hooks/useGoogleAuth.ts` - Better error messages
- ✅ `.env` - Added warning comments
- ✅ `docs/` - Added complete setup guides

## Need Help?
📖 Read: `docs/GOOGLE_OAUTH_SETUP.md`

---

**Time to fix:** 15-20 minutes  
**Difficulty:** Easy (just create 3 OAuth apps)  
**Result:** Google Sign-in works on all platforms! ✅
