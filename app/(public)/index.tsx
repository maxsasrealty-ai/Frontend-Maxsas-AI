import React from 'react';
import { Platform, View } from 'react-native';
import LandingScreen from '../../components/landing/LandingScreen';

export default function IndexFallback() {
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#04060f', justifyContent: 'center', alignItems: 'center' }}>
        <LandingScreen />
      </View>
    );
  }

  return <LandingScreen />;
}
