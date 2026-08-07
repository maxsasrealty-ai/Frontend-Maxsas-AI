import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const GOOGLE_BLUE = "#4285F4";
const GOOGLE_RED = "#EA4335";
const GOOGLE_YELLOW = "#FBBC05";
const GOOGLE_GREEN = "#34A853";

function GoogleMark() {
  return (
    <View style={styles.markWrap}>
      <View
        style={[
          styles.markRing,
          {
            borderTopColor: GOOGLE_BLUE,
            borderRightColor: GOOGLE_RED,
            borderBottomColor: GOOGLE_YELLOW,
            borderLeftColor: GOOGLE_GREEN,
          },
        ]}
      />
      <View style={styles.markBar} />
      <View style={styles.markCut} />
    </View>
  );
}

type Props = {
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  label?: string;
};

export default function GoogleSignInButton({ loading = false, disabled = false, onPress, label = "Continue with Google" }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable accessibilityRole="button" disabled={isDisabled} onPress={onPress} style={({ pressed, hovered }) => [styles.button, pressed ? styles.pressed : null, hovered ? styles.hovered : null, isDisabled ? styles.disabled : null]}>
      <LinearGradient colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inner}>
        <View style={styles.leftCluster}>
          <View style={styles.iconShell}>
            <GoogleMark />
          </View>
          <Text style={styles.label}>{loading ? "Connecting..." : label}</Text>
        </View>
        {loading ? <ActivityIndicator size="small" color="#f7fbff" /> : <Ionicons name="chevron-forward" size={16} color="rgba(240,244,255,0.68)" />}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(6,12,22,0.86)",
    overflow: "hidden",
  },
  inner: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.92,
  },
  hovered: {
    borderColor: "rgba(255,255,255,0.18)",
  },
  disabled: {
    opacity: 0.68,
  },
  leftCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  iconShell: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  markWrap: {
    width: 16,
    height: 16,
    borderRadius: 999,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  markRing: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 3,
    borderStyle: "solid",
    transform: [{ rotate: "45deg" }],
    opacity: 0.96,
  },
  markBar: {
    position: "absolute",
    right: -1,
    top: 7,
    width: 7,
    height: 3,
    borderRadius: 999,
    backgroundColor: GOOGLE_BLUE,
  },
  markCut: {
    position: "absolute",
    right: 0,
    top: 8,
    width: 6,
    height: 5,
    backgroundColor: "rgba(6,12,22,0.95)",
  },
  label: {
    color: "#f7fbff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});