import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { resolveApiBaseUrl } from '../../lib/api/base-url';

type WebinarRegisterParams = {
  fullName?: string | string[];
  phone?: string | string[];
  email?: string | string[];
  company?: string | string[];
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
}

export default function WebinarRegisterScreen() {
  const params = useLocalSearchParams<WebinarRegisterParams>();
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const [formData, setFormData] = useState({
    fullName: firstValue(params.fullName),
    phone: firstValue(params.phone),
    email: firstValue(params.email),
    company: firstValue(params.company),
  });
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if (existingScript) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProceedToPay = async () => {
    if (!formData.fullName || !formData.phone || !formData.email) {
      Alert.alert('Required Fields', 'Please fill in Name, Phone, and Email.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Payment unavailable', 'Web checkout is currently supported for this webinar flow.');
      return;
    }

    if (!razorpayReady || typeof window === 'undefined' || !(window as any).Razorpay) {
      Alert.alert('Razorpay Error', 'Razorpay checkout is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    try {
      // 1. Call Backend to create Razorpay Order
      const response = await fetch(`${apiBaseUrl}/webinar/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // 2. Trigger Razorpay Checkout (Web/Native)
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: 'Maxsas AI',
          description: 'AI Voice Agent Workshop Registration',
          order_id: data.orderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: { color: '#3B6FFF' },
          handler: async function (paymentRes: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) {
            // 3. Verify Payment Signature
            const verifyRes = await fetch(`${apiBaseUrl}/webinar/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: paymentRes.razorpay_order_id,
                razorpayPaymentId: paymentRes.razorpay_payment_id,
                razorpaySignature: paymentRes.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              // Redirect to Thank You Page
              router.replace('/webinar-thank-you');
            } else {
              Alert.alert('Payment Verification Failed', 'Please contact support if money was deducted.');
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        Alert.alert('Razorpay Error', 'Razorpay SDK not loaded. Please refresh the page.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color="#8FB8FF" />
        <Text style={styles.backBtnText}>Back to Webinar Page</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>Reserve Your Seat</Text>
        <Text style={styles.subtitle}>Fill in your details to proceed to secure ₹199 payment.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Anubhav Chaudhary"
            placeholderTextColor="#8D96B3"
            value={formData.fullName}
            onChangeText={(text) => handleInputChange('fullName', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (WhatsApp) *</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor="#8D96B3"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="anubhav@example.com"
            placeholderTextColor="#8D96B3"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company / Brokerage Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Maxsas Realty"
            placeholderTextColor="#8D96B3"
            value={formData.company}
            onChangeText={(text) => handleInputChange('company', text)}
          />
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={handleProceedToPay} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>Proceed to Pay ₹199</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080F' },
  content: { padding: 24, maxWidth: 500, alignSelf: 'center', width: '100%', paddingTop: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backBtnText: { color: '#8FB8FF', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#0E1220', borderRadius: 20, borderWidth: 1, borderColor: '#232A44', padding: 24, gap: 16 },
  title: { color: '#F4F6FB', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#8D96B3', fontSize: 14, marginBottom: 8 },
  inputGroup: { gap: 6 },
  label: { color: '#8FB8FF', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#161B2E', borderWidth: 1, borderColor: '#232A44', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#F4F6FB', fontSize: 14 },
  payBtn: { backgroundColor: '#3B6FFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  payBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});