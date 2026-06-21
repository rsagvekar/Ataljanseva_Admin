import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, UIManager, PermissionsAndroid } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from "react-native-bootsplash";
import messaging from '@react-native-firebase/messaging';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/config/theme';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) return;
    }
    await messaging().requestPermission();
  } catch (err) {
    console.warn('Notification permission error:', err.message);
  }
}

export default function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      RNBootSplash.hide();
    }, 500);

    requestNotificationPermission();

    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.secondary}
          translucent={false}
        />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}