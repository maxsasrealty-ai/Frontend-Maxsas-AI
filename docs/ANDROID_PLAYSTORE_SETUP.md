# Android Play Store Setup

This repository now includes Capacitor Android support on top of the existing Expo web app. The web app still runs the same way for local development and Vercel deployment; Capacitor consumes the static Expo export in `dist/`.

## Current Capacitor Settings

- App name: `Maxsas-AI-Livekit`
- App id / package name: `com.maxsas.ai.livekit`
- Web build output: `dist`

## Exact Commands

Build the web app and sync it into Android:

```bash
npm run web:build
npm run cap:sync
```

Open the Android project in Android Studio:

```bash
npm run cap:open:android
```

### Windows path warning

On Windows, Android native builds can fail if the repo path contains spaces or is too long. Use the repository helper command instead of running Gradle directly:

```bash
npm run android:bundle
```

If you only want to copy the latest web build without a full sync:

```bash
npm run cap:copy
```

## Signed AAB In Android Studio

1. Run `npm run web:build` and `npm run cap:sync` first.
2. Open the Android project with `npm run cap:open:android`.
3. In Android Studio, wait for Gradle sync to finish.
4. Go to `Build` > `Generate Signed Bundle / APK`.
5. Select `Android App Bundle`.
6. Choose an existing keystore or create a new one.
7. Select the release build variant.
8. Finish the wizard and let Android Studio generate the signed `.aab` file.
9. Upload the generated AAB from the Android Studio output path to Play Console.

## Manual Values To Replace Before Publishing

- App id / package name: update `com.maxsas.ai.livekit` everywhere before launch if you want a different final package id.
- App name: update `Maxsas-AI-Livekit` if you want a different label in Android and Play Console.
- Icons: replace the launcher and adaptive icon assets under `android/app/src/main/res/` with production artwork.
- Signing keystore: create and securely store your release keystore, then configure it for the release build.
- Release build env vars: set `MAXSAS_RELEASE_STORE_FILE`, `MAXSAS_RELEASE_STORE_PASSWORD`, `MAXSAS_RELEASE_KEY_ALIAS`, and `MAXSAS_RELEASE_KEY_PASSWORD` before generating the Play release.
- Production API URL: set `EXPO_PUBLIC_API_BASE_URL` to your HTTPS backend; release builds no longer fall back to localhost.
- versionCode / versionName: increment the values in `android/app/build.gradle` for every Play Store upload.
- Privacy Policy URL: publish a public privacy policy and paste the URL into Play Console and any in-app/legal references.
- Play Console listing assets: screenshots, feature graphic, short description, full description, app icon, and store listing metadata.

## Troubleshooting

### Wrong `webDir`

If Android opens to a missing file or stale content, verify that `capacitor.config.json` still points to `dist` and rerun:

```bash
npm run web:build
npm run cap:sync
```

### Blank WebView Screen

Usually this means the Android project does not contain the latest exported web files or the export failed.

- Confirm `dist/index.html` exists after `npm run web:build`.
- Rerun `npm run cap:sync`.
- Open Chrome remote debugging on the device/emulator and check the console for runtime errors.

### Asset Path Or Base URL Issues

If images, fonts, or routes break inside Android, check the Expo web export first.

- Make sure asset paths are relative and included in the Expo export.
- Rebuild the web export after any asset change.
- Resync Capacitor so the updated bundle is copied into Android.

### Outdated Android System WebView Or Chrome

If the app renders strangely or fails to load on-device, update both Android System WebView and Chrome from the Play Store on the test device or emulator image.

## Final Play Store Checklist

- `versionCode` incremented from the previous release.
- `versionName` updated if you use semantic release labels.
- Signed AAB generated from the release build.
- Package name confirmed and final.
- Privacy Policy URL live and accessible.
- Store screenshots and feature graphic uploaded.
- Release notes prepared.
- App tested on a real device and at least one emulator.
- `npm run web:build` and `npm run cap:sync` completed successfully before the final build.