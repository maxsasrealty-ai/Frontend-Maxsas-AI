import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { gsap } from "gsap";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useResponsive } from "../../hooks/useResponsive";
import {
    loginWithEmailPassword,
    requestPasswordResetOtp,
    resetPasswordWithOtp,
    sendSignupOtp,
    verifySignupOtp,
} from "../../lib/api/auth";
import GoogleSignInButton from "./GoogleSignInButton";

type AuthMode = "login" | "signup";
type AuthView = AuthMode | "forgot";
type SignupStep = "details" | "verify";
type ForgotStep = "request" | "reset";

type Props = {
  mode: AuthMode;
};

const C = {
  bg: "#04060f",
  card: "#091423",
  cyan: "#00d4ff",
  violet: "#7c3aed",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#f0f4ff",
  muted: "rgba(240,244,255,0.68)",
  faint: "rgba(240,244,255,0.42)",
  border: "rgba(255,255,255,0.08)",
};

const WEB = Platform.OS === "web";

const TIMELINES = [
  ["Connecting to lead..."],
  ["Connecting to lead...", "Yes, I am looking for a 3BHK."],
  ["Budget around INR 80L?", "Yes, and Whitefield preferred."],
];

function formatTimer(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  if (!domain) {
    return email;
  }

  return `${localPart.slice(0, 2)}${localPart.length > 2 ? "***" : "*"}@${domain}`;
}

function BrandGlyph() {
  return (
    <LinearGradient
      colors={["rgba(0,212,255,0.24)", "rgba(124,58,237,0.22)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.brandGlyph}
    >
      <View style={styles.brandGlyphInner}>
        <Text style={styles.brandGlyphText}>M</Text>
      </View>
    </LinearGradient>
  );
}

function LinkedInMark() {
  return (
    <View style={styles.linkedinMark}>
      <Text style={styles.linkedinText}>in</Text>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  textContentType,
  autoComplete,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  textContentType?: "name" | "emailAddress" | "password" | "oneTimeCode" | "newPassword";
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldShell,
          focused && styles.fieldShellFocused,
          WEB && focused ? styles.fieldShellWebFocus : null,
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={focused ? C.cyan : C.faint}
          style={styles.fieldIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete as any}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
        />
      </View>
    </View>
  );
}

function SocialButton({
  label,
  accent,
  icon,
}: {
  label: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <Pressable style={({ pressed, hovered }) => [styles.socialButton, pressed ? styles.pressed : null, hovered ? styles.socialHover : null]}>
      <View style={[styles.socialIconWrap, { borderColor: `${accent}33` }]}>{icon}</View>
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );
}

function LiveWidget() {
  const [seconds, setSeconds] = useState(134);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const widgetRef = useRef<View | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    const transcript = setInterval(() => setTimelineIndex((value) => (value + 1) % TIMELINES.length), 2200);

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      clearInterval(timer);
      clearInterval(transcript);
    };
  }, [floatAnim, pulseAnim]);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.52] });

  useEffect(() => {
    if (!WEB) {
      return;
    }

    if (!widgetRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        widgetRef.current,
        { y: 20, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.75, ease: "power3.out" }
      );
      gsap.to(widgetRef.current, { y: -4, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }, widgetRef);

    return () => ctx.revert();
  }, []);

  return (
    <Animated.View style={[styles.widgetGlow, { opacity, transform: [{ scale }, { translateY }] }]}>
      <Animated.View ref={widgetRef} style={[styles.widgetCard, { transform: [{ translateY }] }]}>
        <View style={styles.widgetHeader}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AI AGENT CALLING</Text>
          </View>
          <View style={styles.timerRow}>
            <View style={styles.waveform}>
              {[8, 15, 11, 20, 12].map((height, index) => (
                <View key={index} style={[styles.waveBar, { height, opacity: 0.7 + index * 0.06 }]} />
              ))}
            </View>
            <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoCell label="LEAD" value="Rahul Sharma" />
          <InfoCell label="BUDGET" value="INR 80L" />
          <InfoCell label="LOCATION" value="Whitefield" />
          <InfoCell label="TYPE" value="3BHK" />
        </View>

        <View style={styles.transcriptBox}>
          <Text style={styles.sectionLabel}>LIVE TRANSCRIPT</Text>
          {TIMELINES[timelineIndex].map((line, index) => (
            <View key={`${index}-${line}`} style={styles.transcriptRow}>
              <View style={[styles.transcriptBadge, index === 0 ? styles.transcriptBadgeAi : styles.transcriptBadgeUser]}>
                <Text style={[styles.transcriptBadgeText, index === 0 ? styles.transcriptBadgeTextAi : styles.transcriptBadgeTextUser]}>
                  {index === 0 ? "AI" : "USER"}
                </Text>
              </View>
              <Text style={index === 0 ? styles.transcriptAi : styles.transcriptUser}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>AI QUALIFICATION SUMMARY</Text>
          <Text style={styles.summaryLine}>• Buyer interested in 3BHK</Text>
          <Text style={styles.summaryLine}>• Budget confirmed: INR 80L</Text>
          <Text style={styles.summaryLine}>• Site visit suggested</Text>
        </View>

        <View style={styles.widgetFooter}>
          <View style={styles.hotPill}>
            <Text style={styles.hotEmoji}>🔥</Text>
            <Text style={styles.hotText}>Hot lead</Text>
          </View>
          <Text style={styles.followupText}>Follow up in 24 hrs</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AuthScreen({ mode }: Props) {
  const { isDesktop } = useResponsive();
  const googleAuth = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authView, setAuthView] = useState<AuthView>(mode);
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState<number | null>(null);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [hoveredPrimary, setHoveredPrimary] = useState(false);
  const shimmer = useRef(new Animated.Value(0)).current;
  const shellRef = useRef<any>(null);
  const heroRef = useRef<any>(null);
  const cardRef = useRef<any>(null);

  useEffect(() => {
    setAuthView(mode);
    setSignupStep("details");
    setForgotStep("request");
    setOtp("");
    setMaskedEmail("");
    setOtpExpiresAt(null);
    setResendCooldownSeconds(null);
    setOtpExpirySeconds(null);
    setErrorMessage(null);
    setInfoMessage(null);
  }, [mode]);

  useEffect(() => {
    if (otpExpirySeconds === null || otpExpirySeconds <= 0 || isSubmitting) {
      return;
    }

    const timer = setInterval(() => {
      setOtpExpirySeconds((value) => {
        if (value === null) {
          return value;
        }

        return value <= 1 ? 0 : value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpirySeconds, isSubmitting]);

  const isLoginView = authView === "login";
const isSignupView = authView === "signup";
const isForgotView = authView === "forgot";
const isSignupVerification = isSignupView && signupStep === "verify";
const isForgotVerification = isForgotView && forgotStep === "reset";
const activeTab: AuthMode = isSignupView ? "signup" : "login";

useEffect(() => {
  if (!WEB) {
    return;
  }

  const heroTarget = heroRef.current as any;
  const cardTarget = cardRef.current as any;
  const shellTarget = shellRef.current as any;

  if (!heroTarget || !cardTarget || !shellTarget) {
    return;
  }

  const staggerTargets =
    typeof shellTarget.querySelectorAll === "function"
      ? shellTarget.querySelectorAll(".auth-stagger")
      : [];

  if (!staggerTargets || !staggerTargets.length) {
    return;
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(
      heroTarget,
      { x: -18, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
    );

    gsap.fromTo(
      cardTarget,
      { y: 24, opacity: 0, scale: 0.985 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.08 }
    );

    gsap.fromTo(
      staggerTargets,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.52, stagger: 0.06, ease: "power2.out", delay: 0.16 }
    );
  }, shellRef);

  return () => ctx.revert();
}, []);

const resetTransientState = (nextView: AuthView) => {
  setAuthView(nextView);
  setSignupStep("details");
  setForgotStep("request");
  setOtp("");
  setMaskedEmail("");
  setOtpExpiresAt(null);
  setResendCooldownSeconds(null);
  setOtpExpirySeconds(null);
  setErrorMessage(null);
  setInfoMessage(null);
};

  useEffect(() => {
    if (resendCooldownSeconds === null || resendCooldownSeconds <= 0 || isSubmitting) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldownSeconds((value) => {
        if (value === null) {
          return value;
        }

        return value <= 1 ? 0 : value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldownSeconds, isSubmitting]);

  const handleSwitchMode = () => {
    const nextView: AuthMode = authView === "login" ? "signup" : "login";
    resetTransientState(nextView);
    router.push(nextView === "login" ? "/(public)/login" : "/(public)/signup");
  };

  const handleForgotPassword = () => {
    resetTransientState("forgot");
  };

  const handleBackToLogin = () => {
    resetTransientState("login");
  };

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      setErrorMessage("Email is required.");
      return;
    }

    if (isLoginView && !normalizedPassword) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if ((isSignupVerification || isForgotVerification) && !normalizedOtp) {
      setErrorMessage("OTP is required.");
      return;
    }

    if (isSignupVerification && !normalizedPassword) {
      setErrorMessage("Password is required.");
      return;
    }

    if (isForgotVerification && !normalizedPassword) {
      setErrorMessage("New password is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (isLoginView) {
        const response = await loginWithEmailPassword({ email: normalizedEmail, password: normalizedPassword });

        if (!response.success) {
          setErrorMessage(
            __DEV__ && response.error.code === "INVALID_CREDENTIALS"
              ? "Invalid credentials. Try admin@maxsas.com / Admin@123456."
              : response.error.message || "Authentication failed."
          );
          return;
        }

        router.replace("/(protected)/lexus");
        return;
      }

      if (isSignupView && signupStep === "details") {
        const response = await sendSignupOtp({ email: normalizedEmail });

        if (!response.success) {
          setErrorMessage(response.error.message || "Unable to send verification code.");
          return;
        }

        setMaskedEmail(
          typeof response.data?.maskedEmail === "string" && response.data.maskedEmail.trim().length > 0
            ? response.data.maskedEmail
            : maskEmail(normalizedEmail)
        );
        setOtpExpiresAt(typeof response.data?.otpExpiresAt === "string" ? response.data.otpExpiresAt : null);
        setResendCooldownSeconds(
          typeof response.data?.cooldownSeconds === "number"
            ? response.data.cooldownSeconds
            : 60
        );
        setOtpExpirySeconds(
          typeof response.data?.otpExpiresAt === "string"
            ? Math.max(0, Math.ceil((new Date(response.data.otpExpiresAt).getTime() - Date.now()) / 1000))
            : typeof response.data?.otpExpiresInSeconds === "number"
              ? response.data.otpExpiresInSeconds
              : typeof response.data?.expiresInSeconds === "number"
                ? response.data.expiresInSeconds
                : 300
        );
        setSignupStep("verify");
        setInfoMessage("Verification code sent. Enter the OTP to finish creating your account.");
        return;
      }

      if (isSignupView && signupStep === "verify") {
        const response = await verifySignupOtp({
          email: normalizedEmail,
          otp: normalizedOtp,
          password: normalizedPassword,
        });

        if (!response.success) {
          setErrorMessage(response.error.message || "Unable to verify signup code.");
          return;
        }

        router.replace("/(protected)/lexus");
        return;
      }

      if (isForgotView && forgotStep === "request") {
        const response = await requestPasswordResetOtp({ email: normalizedEmail });

        if (!response.success) {
          setErrorMessage(response.error.message || "Unable to send reset code.");
          return;
        }

        setMaskedEmail(
          typeof response.data?.maskedEmail === "string" && response.data.maskedEmail.trim().length > 0
            ? response.data.maskedEmail
            : maskEmail(normalizedEmail)
        );
        setOtpExpiresAt(typeof response.data?.otpExpiresAt === "string" ? response.data.otpExpiresAt : null);
        setResendCooldownSeconds(
          typeof response.data?.cooldownSeconds === "number"
            ? response.data.cooldownSeconds
            : 60
        );
        setOtpExpirySeconds(
          typeof response.data?.otpExpiresAt === "string"
            ? Math.max(0, Math.ceil((new Date(response.data.otpExpiresAt).getTime() - Date.now()) / 1000))
            : typeof response.data?.otpExpiresInSeconds === "number"
              ? response.data.otpExpiresInSeconds
              : typeof response.data?.expiresInSeconds === "number"
                ? response.data.expiresInSeconds
                : 300
        );
        setForgotStep("reset");
        setInfoMessage("Reset code sent. Enter the OTP and your new password.");
        return;
      }

      if (isForgotView && forgotStep === "reset") {
        const response = await resetPasswordWithOtp({
          email: normalizedEmail,
          otp: normalizedOtp,
          newPassword: normalizedPassword,
        });

        if (!response.success) {
          setErrorMessage(response.error.message || "Unable to reset password.");
          return;
        }

        router.replace("/(protected)/lexus");
        return;
      }

      throw new Error("Unsupported auth state.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    const result = await googleAuth.signInWithGoogle();
    if (result.success) {
      router.replace("/(protected)/lexus");
      return;
    }

    if (!result.canceled) {
      setErrorMessage(result.message);
    }
  };

  const fillDevCredentials = () => {
    setEmail("admin@maxsas.com");
    setPassword("Admin@123456");
    setErrorMessage(null);
  };

  const submitLabel = isSubmitting
    ? isLoginView
      ? "Signing in..."
      : isSignupView
        ? signupStep === "details"
          ? "Sending OTP..."
          : "Creating account..."
        : forgotStep === "request"
          ? "Sending reset code..."
          : "Resetting password..."
    : isLoginView
      ? "Log in to workspace"
      : isSignupView
        ? signupStep === "details"
          ? "Send verification code"
          : "Create account"
        : forgotStep === "request"
          ? "Send reset code"
          : "Reset password";
  const isAnyAuthSubmitting = isSubmitting || googleAuth.isSubmitting;

  const authHeroTitle = isLoginView ? "Welcome back. Resume the lead pipeline." : "Create your workspace and start qualifying leads.";
  const authHeroBody = isLoginView
    ? "Manage calls, routes, and campaign outcomes from one premium workspace."
    : "Launch your first AI voice flow in minutes with a polished setup that feels native on desktop and mobile.";
  const authCardTitle = isLoginView
    ? "Log in to continue"
    : isSignupView
      ? signupStep === "details"
        ? "Create your account"
        : "Verify your account"
      : forgotStep === "request"
        ? "Reset your password"
        : "Enter the OTP and set a new password";
  const authCardSubtitle = isLoginView
    ? "Pick up where you left off and keep the calling workflow moving."
    : isSignupView
      ? signupStep === "details"
        ? "Join the workspace and unlock live lead qualification right away."
        : "Enter the code sent to your email to finish signup."
      : forgotStep === "request"
        ? "We’ll send a reset code to your email address."
        : "Enter the reset code and choose a new password.";

  const renderFormFields = () => (
    <View style={styles.formStack}>
      <View className="auth-stagger">
        <Field label="Email address" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="rahul@example.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      </View>
      {isLoginView ? (
        <View className="auth-stagger">
          <Field label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry autoComplete="password" textContentType="password" />
        </View>
      ) : null}
      {isSignupVerification || isForgotVerification ? (
        <View className="auth-stagger">
          <Field label="OTP" icon="key-outline" value={otp} onChangeText={setOtp} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
        </View>
      ) : null}
      {isSignupVerification ? (
        <View className="auth-stagger">
          <Field label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry autoComplete="new-password" textContentType="newPassword" />
        </View>
      ) : null}
      {isForgotVerification ? (
        <View className="auth-stagger">
          <Field label="New password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Create a new password" secureTextEntry autoComplete="new-password" textContentType="newPassword" />
        </View>
      ) : null}
    </View>
  );

  const renderInlineLinks = () => (
    <View style={styles.inlineRow}>
      {isLoginView ? (
        <Pressable accessibilityRole="button" onPress={handleForgotPassword}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
      ) : isForgotView ? (
        <Pressable accessibilityRole="button" onPress={handleBackToLogin}>
          <Text style={styles.linkText}>Back to login</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" onPress={handleSwitchMode}>
          <Text style={styles.linkText}>Need a different email?</Text>
        </Pressable>
      )}
      {!isForgotView ? (
        <Pressable accessibilityRole="button" onPress={handleSwitchMode}>
          <Text style={styles.linkAccent}>{isSignupView ? "I already have one" : "Create an account"}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const renderStatusMessage = () => {
    if (!isSignupVerification && !isForgotVerification) {
      return null;
    }

    const timerLabel = otpExpirySeconds !== null ? `Expires in ${formatTimer(otpExpirySeconds)}` : null;
    const expiryLabel = otpExpiresAt ? `Valid until ${new Date(otpExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : null;
    const cooldownLabel = resendCooldownSeconds !== null ? `Resend available in ${formatTimer(resendCooldownSeconds)}` : null;
    const targetLabel = maskedEmail || email.trim().toLowerCase();

    return (
      <View style={styles.verificationBanner}>
        <Text style={styles.verificationTitle}>{isSignupView ? "Verification code sent" : "Reset code sent"}</Text>
        <Text style={styles.verificationText}>{targetLabel}</Text>
        {timerLabel ? <Text style={styles.verificationTimer}>{timerLabel}</Text> : null}
        {expiryLabel ? <Text style={styles.verificationTimer}>{expiryLabel}</Text> : null}
        {cooldownLabel ? <Text style={styles.verificationTimer}>{cooldownLabel}</Text> : null}
      </View>
    );
  };

  const PrimaryButton = (
    <Pressable
      accessibilityRole="button"
      onPress={handleSubmit}
      disabled={isAnyAuthSubmitting}
      onHoverIn={() => {
        if (!WEB) return;
        setHoveredPrimary(true);
        shimmer.setValue(0);
        Animated.timing(shimmer, { toValue: 1, duration: 720, useNativeDriver: true }).start(() => shimmer.setValue(0));
      }}
      onHoverOut={() => setHoveredPrimary(false)}
      style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null, isAnyAuthSubmitting ? styles.primaryDisabled : null]}
    >
      <LinearGradient colors={["#00d4ff", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              opacity: hoveredPrimary ? 1 : 0,
              transform: [
                {
                  translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-180, 180] }),
                },
                { rotate: "18deg" },
              ],
            },
          ]}
        />
        <Text style={styles.primaryText}>{submitLabel}</Text>
      </LinearGradient>
    </Pressable>
  );

  const modeTabs = (
    <View style={styles.segmentedWrap}>
      <Pressable accessibilityRole="button" onPress={activeTab === "login" ? undefined : handleSwitchMode} style={({ pressed }) => [styles.segment, activeTab === "login" ? styles.segmentActive : null, pressed ? styles.pressed : null]}>
        <Text style={[styles.segmentText, activeTab === "login" ? styles.segmentTextActive : null]}>Log in</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={activeTab === "signup" ? undefined : handleSwitchMode} style={({ pressed }) => [styles.segment, activeTab === "signup" ? styles.segmentActive : null, pressed ? styles.pressed : null]}>
        <Text style={[styles.segmentText, activeTab === "signup" ? styles.segmentTextActive : null]}>Sign up</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View ref={shellRef} style={styles.shell}>
        <View pointerEvents="none" style={styles.backdrop}>
          <View style={styles.grid} />
          <View style={styles.auroraTop} />
          <View style={styles.auroraBottom} />
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, !isDesktop ? styles.scrollMobile : null]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {isDesktop ? (
            <View style={styles.desktopLayout}>
              <View ref={heroRef} style={styles.heroPanel}>
                <View style={styles.heroBrandRow}>
                  <BrandGlyph />
                  <View>
                    <Text style={styles.heroEyebrow}>MAXSAS REALTY AI</Text>
                    <Text style={styles.heroSubEyebrow}>Aurora auth experience for web and Android</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>{authHeroTitle}</Text>
                <Text style={styles.heroBody}>{authHeroBody}</Text>
                <View style={styles.statsRow}>
                  {[["< 600ms", "Voice latency"], ["142", "Qualified leads today"], ["08", "Active campaigns"]].map(([value, label]) => (
                    <View key={label} style={styles.statCard}>
                      <Text style={styles.statValue}>{value}</Text>
                      <Text style={styles.statLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
                <LiveWidget />
              </View>

              <View ref={cardRef} style={styles.cardWrap}>
                <View style={styles.authCard}>
                  <View style={styles.brandRow}>
                    <BrandGlyph />
                    <View>
                      <Text style={styles.brandTitle}>Maxsas Realty AI</Text>
                      <Text style={styles.brandMeta}>Secure access for teams and operators</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{authCardTitle}</Text>
                  <Text style={styles.cardSubtitle}>{authCardSubtitle}</Text>

                  {modeTabs}

                  {renderStatusMessage()}

                  {renderFormFields()}

                  {renderInlineLinks()}

                  {PrimaryButton}

                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}
                  <Text style={styles.securityText}>Secure access for campaigns, leads, and calling data.</Text>

                  <View style={styles.complianceLinksRow}>
                    <Pressable accessibilityRole="link" onPress={() => router.push("/(public)/privacy-policy")}>
                      <Text style={styles.complianceLink}>Privacy</Text>
                    </Pressable>
                    <Text style={styles.complianceDivider}>·</Text>
                    <Pressable accessibilityRole="link" onPress={() => router.push("/(public)/terms")}>
                      <Text style={styles.complianceLink}>Terms</Text>
                    </Pressable>
                    <Text style={styles.complianceDivider}>·</Text>
                    <Pressable accessibilityRole="link" onPress={() => router.push("/(public)/account-deletion")}>
                      <Text style={styles.complianceLink}>Delete account</Text>
                    </Pressable>
                  </View>

                  {__DEV__ ? (
                    <View style={styles.devStack}>
                      <Pressable accessibilityRole="button" onPress={fillDevCredentials} style={({ pressed }) => [styles.devButton, pressed ? styles.pressed : null]}>
                        <Text style={styles.devButtonText}>Use dev credentials</Text>
                      </Pressable>
                      <View style={styles.devQuickRow}>
                        <Pressable accessibilityRole="button" onPress={() => router.replace("/(protected)/admin")} style={({ pressed }) => [styles.devQuickButton, pressed ? styles.pressed : null]}><Text style={styles.devQuickRose}>Admin</Text></Pressable>
                        <Pressable accessibilityRole="button" onPress={() => router.replace("/(protected)/enterprise")} style={({ pressed }) => [styles.devQuickButton, pressed ? styles.pressed : null]}><Text style={styles.devQuickEmerald}>Enterprise</Text></Pressable>
                        <Pressable accessibilityRole="button" onPress={() => router.replace("/(protected)/lexus")} style={({ pressed }) => [styles.devQuickButton, pressed ? styles.pressed : null]}><Text style={styles.devQuickViolet}>Workspace</Text></Pressable>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialRow}>
                    <GoogleSignInButton loading={googleAuth.isSubmitting} disabled={!googleAuth.isReady || isAnyAuthSubmitting} onPress={handleGoogleSubmit} />
                    <SocialButton label="LinkedIn" accent="#0A66C2" icon={<LinkedInMark />} />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.mobileStack}>
              <View style={styles.mobileHeader}>
                <BrandGlyph />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mobileEyebrow}>MAXSAS REALTY AI</Text>
                  <Text style={styles.mobileTitle}>{authHeroTitle}</Text>
                  <Text style={styles.mobileSubtitle}>Premium auth built for WebView and Android with the same visual language.</Text>
                </View>
              </View>

              <View ref={cardRef} style={styles.mobileCardWrap}>
                <View style={styles.authCard}>
                  {modeTabs}

                  <Text style={styles.cardTitle}>{authCardTitle}</Text>
                  <Text style={styles.cardSubtitle}>{authCardSubtitle}</Text>

                  {renderStatusMessage()}

                  {renderFormFields()}

                  {renderInlineLinks()}

                  {PrimaryButton}

                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

                  {__DEV__ ? (
                    <View style={styles.devStack}>
                      <Pressable accessibilityRole="button" onPress={fillDevCredentials} style={({ pressed }) => [styles.devButton, pressed ? styles.pressed : null]}>
                        <Text style={styles.devButtonText}>Use dev credentials</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialStack}>
                    <GoogleSignInButton loading={googleAuth.isSubmitting} disabled={!googleAuth.isReady || isAnyAuthSubmitting} onPress={handleGoogleSubmit} />
                    <SocialButton label="LinkedIn" accent="#0A66C2" icon={<LinkedInMark />} />
                  </View>

                  <Pressable accessibilityRole="button" onPress={handleSwitchMode}>
                    <Text style={styles.footerPrompt}>{isLoginView ? "No account yet? Sign up free" : isSignupView ? "Already have an account? Log in" : "Remembered your password? Log in"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  shell: { flex: 1, backgroundColor: C.bg },
  backdrop: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
    backgroundColor: C.bg,
    ...(WEB
      ? {
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 100%)",
        }
      : null),
  },
  auroraTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(0,212,255,0.18)",
    ...(WEB ? ({ filter: "blur(90px)" } as any) : null),
  },
  auroraBottom: {
    position: "absolute",
    right: -80,
    bottom: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(124,58,237,0.18)",
    ...(WEB ? ({ filter: "blur(100px)" } as any) : null),
  },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
  scrollMobile: { paddingVertical: 16 },
  desktopLayout: { flex: 1, flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 1320, gap: 28 },
  heroPanel: { flex: 1.08, justifyContent: "center", paddingVertical: 24, paddingRight: 12 },
  heroBrandRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  brandGlyph: { width: 54, height: 54, borderRadius: 16, padding: 1, alignItems: "center", justifyContent: "center" },
  brandGlyphInner: { width: "100%", height: "100%", borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(7,17,31,0.92)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  brandGlyphText: { color: C.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 20, letterSpacing: -0.5 },
  heroEyebrow: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 2.1 },
  heroSubEyebrow: { marginTop: 4, color: C.faint, fontFamily: "Inter_500Medium", fontSize: 13 },
  heroTitle: { color: C.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 54, lineHeight: 60, letterSpacing: -1.6, maxWidth: 650, marginBottom: 16 },
  heroBody: { color: C.muted, fontFamily: "Inter_500Medium", fontSize: 17, lineHeight: 28, maxWidth: 620, marginBottom: 30 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 28 },
  statCard: { minWidth: 150, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statValue: { color: C.cyan, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, marginBottom: 4 },
  statLabel: { color: C.faint, fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.1 },
  widgetGlow: { alignSelf: "flex-start" },
  widgetCard: { width: 420, maxWidth: "100%", borderRadius: 26, backgroundColor: C.card, borderWidth: 1, borderColor: "rgba(0,212,255,0.24)", padding: 22, shadowColor: "#00d4ff", shadowOpacity: 0.18, shadowRadius: 34, shadowOffset: { width: 0, height: 16 }, elevation: 14, overflow: "hidden" },
  widgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: C.cyan },
  liveText: { color: C.cyan, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.4 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  waveform: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  waveBar: { width: 4, borderRadius: 3, backgroundColor: C.cyan },
  timerText: { color: C.faint, fontFamily: "Inter_600SemiBold", fontSize: 12 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 14 },
  infoCell: { width: "48%" },
  infoLabel: { color: C.faint, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  infoValue: { color: C.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 14 },
  sectionLabel: { color: C.faint, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 10 },
  transcriptBox: { borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", marginBottom: 14, minHeight: 116 },
  transcriptRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  transcriptBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  transcriptBadgeAi: { backgroundColor: "rgba(0,212,255,0.12)", borderColor: "rgba(0,212,255,0.2)" },
  transcriptBadgeUser: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" },
  transcriptBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" },
  transcriptBadgeTextAi: { color: C.cyan },
  transcriptBadgeTextUser: { color: C.muted },
  transcriptAi: { flex: 1, color: C.cyan, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19 },
  transcriptUser: { flex: 1, color: C.text, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19 },
  summaryBox: { borderRadius: 18, padding: 14, backgroundColor: "rgba(16,185,129,0.06)", borderWidth: 1, borderColor: "rgba(16,185,129,0.18)" },
  summaryLabel: { color: C.emerald, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  summaryLine: { color: C.text, fontFamily: "Inter_500Medium", fontSize: 12.5, marginBottom: 4 },
  widgetFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  hotPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", backgroundColor: "rgba(245,158,11,0.12)" },
  hotEmoji: { fontSize: 12 },
  hotText: { color: C.amber, fontFamily: "Inter_700Bold", fontSize: 11 },
  followupText: { color: C.faint, fontFamily: "Inter_500Medium", fontSize: 11 },
  cardWrap: { width: 460, maxWidth: "100%", alignSelf: "center" },
  authCard: { backgroundColor: "rgba(9,20,35,0.88)", borderWidth: 1, borderColor: C.border, borderRadius: 28, padding: 24, shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 34, shadowOffset: { width: 0, height: 20 }, elevation: 20, ...(WEB ? ({ backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" } as any) : null) },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  brandTitle: { color: C.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, letterSpacing: -0.4 },
  brandMeta: { color: C.faint, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  cardTitle: { color: C.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 28, lineHeight: 34, letterSpacing: -0.8, marginBottom: 10 },
  cardSubtitle: { color: C.muted, fontFamily: "Inter_500Medium", fontSize: 14.5, lineHeight: 23, marginBottom: 18 },
  segmentedWrap: { flexDirection: "row", gap: 6, padding: 5, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", marginBottom: 18 },
  segment: { flex: 1, borderRadius: 14, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  segmentActive: { overflow: "hidden" },
  segmentText: { color: C.muted, fontFamily: "Inter_700Bold", fontSize: 13 },
  segmentTextActive: { color: C.text },
  formStack: { marginBottom: 4 },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: { color: C.faint, fontFamily: "Inter_700Bold", fontSize: 10.5, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 8 },
  fieldShell: { flexDirection: "row", alignItems: "center", minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.035)", paddingHorizontal: 14 },
  fieldShellFocused: { borderColor: "rgba(0,212,255,0.55)", backgroundColor: "rgba(0,212,255,0.06)" },
  fieldShellWebFocus: { shadowColor: C.cyan, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, ...(WEB ? ({ boxShadow: "0 0 0 3px rgba(0,212,255,0.12)" } as any) : null) },
  fieldIcon: { marginRight: 8 },
  fieldInput: { flex: 1, color: C.text, fontFamily: "Inter_500Medium", fontSize: 15, paddingVertical: 0 },
  inlineRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 2, marginBottom: 16 },
  linkText: { color: C.faint, fontFamily: "Inter_600SemiBold", fontSize: 12 },
  linkAccent: { color: C.cyan, fontFamily: "Inter_700Bold", fontSize: 12 },
  primaryButton: { borderRadius: 18, overflow: "hidden", shadowColor: C.cyan, shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10, marginBottom: 14 },
  primaryDisabled: { opacity: 0.75 },
  primaryGradient: { minHeight: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, overflow: "hidden" },
  primaryText: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 15 },
  shimmer: { position: "absolute", top: -18, bottom: -18, left: -60, width: 80, backgroundColor: "rgba(255,255,255,0.18)", opacity: 0.55 },
  errorText: { color: C.rose, fontFamily: "Inter_600SemiBold", fontSize: 12, textAlign: "center", marginBottom: 10 },
  securityText: { color: C.faint, fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "center", marginBottom: 16 },
  infoText: { color: C.cyan, fontFamily: "Inter_600SemiBold", fontSize: 12, textAlign: "center", marginBottom: 10 },
  verificationBanner: { marginTop: 12, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0,212,255,0.18)", backgroundColor: "rgba(0,212,255,0.08)", paddingVertical: 12, paddingHorizontal: 14, gap: 4 },
  verificationTitle: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 12 },
  verificationText: { color: C.muted, fontFamily: "Inter_500Medium", fontSize: 12 },
  verificationTimer: { color: C.cyan, fontFamily: "Inter_700Bold", fontSize: 11 },
  complianceLinksRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 14 },
  complianceLink: { color: C.cyan, fontFamily: "Inter_700Bold", fontSize: 12 },
  complianceDivider: { color: C.faint, fontFamily: "Inter_600SemiBold", fontSize: 12 },
  devStack: { gap: 10, marginBottom: 14 },
  devButton: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(0,212,255,0.28)", backgroundColor: "rgba(0,212,255,0.06)" },
  devButtonText: { color: C.cyan, fontFamily: "Inter_700Bold", fontSize: 12 },
  devQuickRow: { flexDirection: "row", gap: 8 },
  devQuickButton: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.03)" },
  devQuickRose: { color: C.rose, fontFamily: "Inter_700Bold", fontSize: 11 },
  devQuickEmerald: { color: C.emerald, fontFamily: "Inter_700Bold", fontSize: 11 },
  devQuickViolet: { color: C.violet, fontFamily: "Inter_700Bold", fontSize: 11 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { color: C.faint, fontFamily: "Inter_500Medium", fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialStack: { gap: 12 },
  socialButton: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  socialHover: { backgroundColor: "rgba(255,255,255,0.05)" },
  socialIconWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  socialLabel: { color: C.muted, fontFamily: "Inter_600SemiBold", fontSize: 13 },
  linkedinMark: { width: 18, height: 18, borderRadius: 5, backgroundColor: "#0A66C2", alignItems: "center", justifyContent: "center" },
  linkedinText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 10, marginTop: -1 },
  pressed: { transform: [{ scale: 0.98 }] },
  footerPrompt: { color: C.muted, fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "center", marginTop: 8 },
  mobileStack: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", gap: 16 },
  mobileHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 2, paddingTop: 8 },
  mobileEyebrow: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.8, marginBottom: 6 },
  mobileTitle: { color: C.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 29, lineHeight: 34, letterSpacing: -0.7, marginBottom: 8 },
  mobileSubtitle: { color: C.muted, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 22 },
  mobileCardWrap: { width: "100%" },
});
