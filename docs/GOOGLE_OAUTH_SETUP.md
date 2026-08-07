# Google OAuth 2.0 Setup Guide

## Problem: "Error 400: invalid_request" + "This app doesn't comply with Google's OAuth 2.0 policy"

### Root Cause
The `.env` file currently has the **same OAuth client ID for both Expo Go and Web**, which violates Google OAuth 2.0 policy:

```
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=746795156003-g4gugahc8bp65eg91as09naprrhpq3ee.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=746795156003-g4gugahc8bp65eg91as09naprrhpq3ee.apps.googleusercontent.com   ← SAME!
```

**Google's policy requires:**
- Each OAuth client ID must be for ONE specific platform (Expo, Web, or Android)
- Different platforms must have different client IDs
- Each client ID must have its specific redirect URIs registered

---

## Solution: Create Three Separate OAuth Applications

### Step 1: Create Expo Go OAuth Client (for development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**
4. Choose **Application type: Web application**
5. Add Authorized redirect URIs:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/maxsas-ai-livekit/callback
   ```
   (Replace `YOUR_EXPO_USERNAME` with your actual Expo username)
6. Click **Create**
7. Copy the **Client ID** → paste into `.env` as `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

**Example Expo URI:**
- If your Expo username is `mybusiness`, the redirect URI is:
  ```
  https://auth.expo.io/@mybusiness/maxsas-ai-livekit/callback
  ```

---

### Step 2: Create Web OAuth Client (for browser)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**
3. Choose **Application type: Web application**
4. Add Authorized redirect URIs:
   ```
   http://localhost:8081/callback
   http://localhost:3000/callback
   https://yourdomain.com/callback
   https://yourdomain.com/auth/callback
   ```
   (Adjust domain and ports for your production/dev setup)
5. Click **Create**
6. Copy the **Client ID** → paste into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

**Example Web URIs:**
- Development (local): `http://localhost:8081/callback`
- Production: `https://maxsasrealtyai.in/callback`

---

### Step 3: Create Android OAuth Client (for native APK)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**
3. Choose **Application type: Android**
4. Fill in:
   - **Package name:** `com.maxsas.ai.livekit`
   - **SHA-1 certificate fingerprint:** [See below]
5. Click **Create**
6. Copy the **Client ID** → paste into `.env` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

---

## Getting Android SHA-1 Certificate Fingerprint

### For Release Key (Production APK)

1. Locate your release keystore:
   ```bash
   # Usually stored in android/app/ or your secure location
   # File name typically ends with .jks
   ls -la android/app/*.jks
   ```

2. Get the SHA-1 fingerprint:
   ```bash
   keytool -list -v -keystore /path/to/android/app/your-keystore.jks -storepass YOUR_STORE_PASSWORD -keypass YOUR_KEY_PASSWORD
   ```

3. Find the line: `SHA1: XX:XX:XX:XX:...`
4. Copy it (without spaces): `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### For Debug Key (Development APK)

If using debug keystore:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -storepass android -keypass android
```

Look for `SHA1:` line and copy the value.

---

## Updated .env Configuration

After creating all three OAuth clients, update your `.env` file:

```
# Expo Go OAuth client (for development)
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=746795156003-DIFFERENT_EXPO_ID.apps.googleusercontent.com

# Web OAuth client (for browser)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=746795156003-DIFFERENT_WEB_ID.apps.googleusercontent.com

# Android OAuth client (for native APK)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=746795156003-DIFFERENT_ANDROID_ID.apps.googleusercontent.com
```

---

## How the Code Now Works

### File: `lib/auth/google.ts`

**Platform Detection:**

1. **Web Browser** (platform === "web")
   - Uses: `GOOGLE_WEB_CLIENT_ID`
   - Redirect: Uses Expo proxy → `https://auth.expo.io/...`
   - Status: ✅ Correct for web OAuth policy

2. **Expo Go** (platform !== "web" AND appOwnership === "expo")
   - Uses: `GOOGLE_EXPO_CLIENT_ID`
   - Redirect: Uses Expo proxy → `https://auth.expo.io/...`
   - Status: ✅ Correct for Expo development

3. **Native Android APK** (platform !== "web" AND appOwnership !== "expo")
   - Uses: `GOOGLE_ANDROID_CLIENT_ID`
   - Redirect: Uses custom scheme → `maxsasailivekit://`
   - Status: ✅ Correct for Android native

---

## Testing the Setup

### Test 1: Expo Go (Development)
```bash
npx expo start
# Press 'i' for iOS or 'a' for Android in Expo Go
# Try Google Sign-in
```

### Test 2: Web Browser
```bash
npm run web
# Open http://localhost:8081
# Try Google Sign-in
```

### Test 3: Native Android APK (Release Build)
```bash
npm run android:bundle
cd android
./gradlew bundleRelease
# Upload to Play Console or test locally
```

---

## Google OAuth Console Consent Screen Setup

For the app to work properly, you also need to configure the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **OAuth consent screen**
3. Choose **User Type: External** (or Internal if internal only)
4. Fill in required fields:
   - App name: `Maxsas AI Livekit`
   - User support email: `your-email@domain.com`
   - Developer contact: `your-email@domain.com`
5. Add scopes: `openid`, `email`, `profile`
6. Click **Save and Continue**
7. Add test users (your email addresses)

---

## Common Issues & Fixes

### Issue 1: "invalid_request" Error
**Cause:** Client ID doesn't match registered platform or redirect URI mismatch
**Fix:** Verify the client ID in `.env` matches Google Console and redirect URI is registered

### Issue 2: "This app doesn't comply with Google's OAuth 2.0 policy"
**Cause:** Using same client ID for multiple platforms
**Fix:** Create separate OAuth clients for each platform (this guide)

### Issue 3: Android APK Shows "Unauthorized" or "Invalid SHA-1"
**Cause:** SHA-1 fingerprint doesn't match the APK signing key
**Fix:** Get correct SHA-1 and update in Google Console

### Issue 4: "Redirect URI mismatch" on Web
**Cause:** Web localhost not registered in Google Console
**Fix:** Add `http://localhost:8081/callback` to Web client authorized URIs

---

## Code Changes Made

### 1. `lib/auth/google.ts` ✅
- **Fixed:** Now uses platform-specific client IDs
- **Policy Compliant:** Each platform gets its own OAuth client
- **Improved:** Clear documentation on why each platform needs different IDs

### 2. `.env.example` ✅
- **Added:** Comprehensive setup instructions
- **Added:** SHA-1 fingerprint instructions
- **Added:** Warnings about client ID separation

### 3. `docs/GOOGLE_OAUTH_SETUP.md` ✅ (This file)
- **Complete:** Step-by-step setup guide
- **Clear:** Separate instructions for each platform
- **Actionable:** Copy-paste commands and instructions

---

## Verification Checklist

- [ ] Created 3 separate OAuth clients in Google Console
- [ ] Each client has correct type (Web, Web, Android)
- [ ] Expo client has Expo redirect URI: `https://auth.expo.io/@USERNAME/maxsas-ai-livekit/callback`
- [ ] Web client has web redirect URIs: `http://localhost:8081/callback`, `https://yourdomain.com/callback`
- [ ] Android client has SHA-1 fingerprint for release keystore
- [ ] All three client IDs are DIFFERENT
- [ ] Updated `.env` with the three different client IDs
- [ ] Ran `npm install` to pick up new environment variables
- [ ] Tested Google Sign-in on Expo Go
- [ ] Tested Google Sign-in on web (`npm run web`)
- [ ] Tested Google Sign-in on native Android APK

---

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Expo Embedded Credentials Manager](https://docs.expo.dev/guides/authentication/#embedded-credentials)
