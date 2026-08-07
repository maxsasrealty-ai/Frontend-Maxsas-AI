import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import LegalPageShell, { LegalBullet, LegalH2, LegalP } from "../../components/LegalPageShell";
import { clearCurrentAuthUser, getCurrentAuthUser } from "../../lib/auth/session";

function buildDeletionMailto(email: string | null | undefined): string {
  const subject = encodeURIComponent("Account deletion request");
  const body = encodeURIComponent(
    [
      "Please delete my Maxsas AI account and associated data.",
      email ? `Registered email: ${email}` : "Registered email: not available",
      "Please confirm once the request has been processed.",
    ].join("\n")
  );

  return `mailto:support@maxsas.ai?subject=${subject}&body=${body}`;
}

export default function AccountDeletionScreen() {
  const handleDeleteRequest = async () => {
    const currentUser = await getCurrentAuthUser();

    Alert.alert(
      "Delete account",
      "This clears the local session immediately and opens a deletion request to support. Server-side deletion is handled by our privacy team.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: async () => {
            await clearCurrentAuthUser();

            const mailto = buildDeletionMailto(currentUser?.email);
            const supported = await Linking.canOpenURL(mailto).catch(() => false);
            if (supported) {
              await Linking.openURL(mailto);
            } else {
              Alert.alert("Email support", "Open your mail app and send a deletion request to support@maxsas.ai.");
            }

            router.replace("/(public)/login");
          },
        },
      ]
    );
  };

  return (
    <LegalPageShell title="Account Deletion">
      <LegalP>
        You can request deletion of your account and associated personal data from inside the app. We clear your local session immediately and route the request to our support team for server-side processing.
      </LegalP>

      <LegalH2>What gets removed</LegalH2>
      <LegalBullet>Sign-in session data stored on this device is cleared right away.</LegalBullet>
      <LegalBullet>Your deletion request is sent to support so the backend can be processed by the privacy team.</LegalBullet>
      <LegalBullet>Data subject to legal, billing, or audit retention may be preserved only where required.</LegalBullet>

      <LegalH2>Before you proceed</LegalH2>
      <LegalBullet>Call and billing records may be retained to meet legal obligations.</LegalBullet>
      <LegalBullet>After submission, you will receive a confirmation email from our support team.</LegalBullet>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleDeleteRequest}>
          <Text style={styles.primaryText}>Request deletion</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.push("/(public)/privacy-policy")}>
          <Text style={styles.secondaryText}>Review privacy policy</Text>
        </Pressable>
      </View>
    </LegalPageShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff5a5f",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  secondaryText: {
    color: "#e8edf5",
    fontSize: 15,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
});