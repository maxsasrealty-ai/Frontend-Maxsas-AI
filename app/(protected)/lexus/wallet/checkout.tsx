import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

type QueryValue = string | string[] | undefined;

function readValue(value: QueryValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function PayUCheckoutScreen() {
  const params = useLocalSearchParams();

  const payload = useMemo(() => ({
    payuUrl: readValue(params.payuUrl),
    payuKey: readValue(params.payuKey),
    merchantTransactionId: readValue(params.merchantTransactionId),
    amount: readValue(params.amount),
    hash: readValue(params.hash),
    email: readValue(params.email),
    phoneNumber: readValue(params.phoneNumber),
    successUrl: readValue(params.successUrl),
    failureUrl: readValue(params.failureUrl),
  }), [params.amount, params.email, params.failureUrl, params.hash, params.merchantTransactionId, params.payuKey, params.payuUrl, params.phoneNumber, params.successUrl]);

  const html = useMemo(() => {
    const amountValue = Number(payload.amount);
    const fields: Record<string, string> = {
      key: payload.payuKey,
      txnid: payload.merchantTransactionId,
      amount: (Number.isFinite(amountValue) ? amountValue / 100 : 0).toFixed(2),
      productinfo: "wallet_topup",
      firstname: payload.email.split("@")[0] || "user",
      email: payload.email,
      phone: payload.phoneNumber,
      hash: payload.hash,
      surl: payload.successUrl,
      furl: payload.failureUrl,
      service_provider: "payu_paisa",
    };

    const inputs = Object.entries(fields)
      .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
      .join("");

    if (__DEV__) {
      console.info("PayU checkout form prepared", {
        payuUrl: payload.payuUrl,
        successUrl: payload.successUrl,
        failureUrl: payload.failureUrl,
        merchantTransactionId: payload.merchantTransactionId,
        amount: payload.amount,
      });
      console.info("PayU checkout payload", fields);
    }

    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family:sans-serif;background:#040c18;color:#e8edf5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0} .card{max-width:480px;padding:24px;border-radius:18px;background:#0d1f38;border:1px solid rgba(255,255,255,.08);text-align:center}</style></head><body><div class="card"><h2>Redirecting to PayU</h2><p>Completing your wallet top-up securely.</p><form id="payu" method="post" action="${escapeHtml(payload.payuUrl)}">${inputs}<noscript><button type="submit">Continue</button></noscript></form></div><script>document.getElementById('payu').submit();</script></body></html>`;
  }, [payload.amount, payload.email, payload.failureUrl, payload.hash, payload.merchantTransactionId, payload.payuKey, payload.payuUrl, payload.phoneNumber, payload.successUrl]);

  if (!payload.payuUrl || !payload.payuKey || !payload.merchantTransactionId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Checkout unavailable</Text>
          <Text style={styles.subtitle}>Missing PayU checkout data.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(protected)/lexus/wallet") }>
            <Text style={styles.buttonText}>Back to wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <WebView
        originWhitelist={["https://*", "http://localhost*", "http://127.0.0.1*", "about:blank", "data:*"]}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="never"
        source={{ html, baseUrl: payload.payuUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator color="#4F8CFF" />
            <Text style={styles.subtitle}>Opening PayU checkout…</Text>
          </View>
        )}
        onError={({ nativeEvent }) => {
          Alert.alert(
            "PayU Checkout Error",
            `Unable to load payment page. ${nativeEvent.description}`,
            [{ text: "Back", onPress: () => router.replace("/(protected)/lexus/wallet?payment=failure" as any) }]
          );
        }}
        onHttpError={({ nativeEvent }) => {
          console.warn("PayU WebView HTTP error", nativeEvent);
        }}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;

          if (
            url.startsWith("upi:") ||
            url.startsWith("intent:") ||
            url.startsWith("phonepe:") ||
            url.startsWith("paytmmp:") ||
            url.startsWith("tez:")
          ) {
            void Linking.openURL(url).catch(() => {
              Alert.alert("Payment app unavailable", "Please open this payment in a UPI app or use a different payment method.");
            });
            return false;
          }

          const isPayUReturnUrl =
            url.includes("/payment/payu") ||
            url.includes("/api/payments/payu/return/success") ||
            url.includes("/api/payments/payu/return/failure");
          if (isPayUReturnUrl) {
            void Linking.openURL(url).catch(() => {
              Alert.alert("Unable to open payment return", "We could not open the payment callback screen.");
            });
            return false;
          }

          if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("about:") && !url.startsWith("data:")) {
            void Linking.openURL(url).catch(() => {
              Alert.alert("Unable to open payment link", url);
            });
            return false;
          }

          return true;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#040c18" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#040c18" },
  title: { color: "#e8edf5", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: "rgba(232,237,245,0.7)", fontSize: 14, textAlign: "center", marginBottom: 16 },
  button: { minHeight: 46, paddingHorizontal: 18, borderRadius: 14, backgroundColor: "#4F8CFF", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});