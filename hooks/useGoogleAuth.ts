import * as Google from "expo-auth-session/providers/google";
import { useState } from "react";

import { loginWithGoogle } from "../lib/api/auth";
import {
  extractGoogleIdToken,
  getGoogleRequestConfig,
  hasGoogleClientConfig,
  shouldUseGoogleProxy,
} from "../lib/auth/google";

type GoogleAuthOutcome =
  | { success: true }
  | { success: false; canceled: true }
  | { success: false; canceled?: false; message: string };

export function useGoogleAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(getGoogleRequestConfig());

  const signInWithGoogle = async (): Promise<GoogleAuthOutcome> => {
    if (!hasGoogleClientConfig()) {
      return {
        success: false,
        message:
          "Google sign-in is not configured. Ensure EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (Expo), EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (web), or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android) are set in .env",
      };
    }

    if (!request) {
      return { success: false, message: "Google sign-in is still loading. Please try again." };
    }

    setIsSubmitting(true);

    try {
      console.log("GOOGLE CONFIG", getGoogleRequestConfig());
      console.log("USE PROXY", shouldUseGoogleProxy());
      console.log("GOOGLE REQUEST READY", Boolean(request));
      console.log("GOOGLE REQUEST", request);

      const authResult = await promptAsync();

      console.log("AUTH RESULT TYPE", authResult?.type);
      console.log("AUTH RESULT", authResult);

      if (authResult.type === "cancel" || authResult.type === "dismiss") {
        return { success: false, canceled: true };
      }

      if (authResult.type !== "success") {
        if (authResult.type === "error" && "error" in authResult && authResult.error) {
          const errorCode = (authResult.error as any).code;
          const errorMsg =
            (authResult.error as any).message || (authResult.error as any).toString();

          console.log("GOOGLE ERROR CODE", errorCode);
          console.log("GOOGLE ERROR MSG", errorMsg);

          if (errorMsg.includes("invalid_request") || errorMsg.includes("OAuth 2.0 policy")) {
            return {
              success: false,
              message: `Google OAuth Configuration Error: ${errorMsg}. Please ensure the correct OAuth client IDs are configured for this platform.`,
            };
          }
        }

        return { success: false, message: "Google sign-in was not completed." };
      }

      const idToken = extractGoogleIdToken(authResult);
      console.log("GOOGLE ID TOKEN EXISTS", Boolean(idToken));
      console.log("GOOGLE ID TOKEN PREVIEW", idToken ? `${idToken.slice(0, 20)}...` : null);

      if (!idToken) {
        return { success: false, message: "Google did not return an ID token. Please try again." };
      }

      const response = await loginWithGoogle({ idToken });
      console.log("BACKEND GOOGLE LOGIN RESPONSE", response);

      if (!response.success) {
        return {
          success: false,
          message: response.error?.message || "Unable to sign in with Google.",
        };
      }

      return { success: true };
    } catch (error) {
      console.log("GOOGLE SIGN IN CATCH", error);

      const message = error instanceof Error ? error.message : "Unable to sign in with Google.";

      if (message.includes("ERR_WEB_BROWSER_BLOCKED")) {
        return {
          success: false,
          message: "The browser popup was blocked. Please allow popups and try again.",
        };
      }

      if (message.includes("ERR_WEB_BROWSER_CRYPTO")) {
        return {
          success: false,
          message: "Google sign-in requires a secure https or localhost web session.",
        };
      }

      if (message.includes("invalid_request") || message.includes("OAuth 2.0 policy")) {
        return {
          success: false,
          message: `Google OAuth Configuration Error: ${message}. Verify that you have created separate OAuth clients for each platform (Expo, Web, Android).`,
        };
      }

      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isReady: Boolean(request),
    isSubmitting,
    signInWithGoogle,
  };
}