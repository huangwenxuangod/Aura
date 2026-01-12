import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useProtectedRoute } from '@/hooks/useAuth';
import { useRegionStore } from '@/stores/useRegionStore';
import { toastConfig } from '@/lib/toast';
import '../global.css';

export default function RootLayout() {
  const { isLoading: authLoading } = useProtectedRoute();
  const { initialize, isDetecting, isInitialized, config } = useRegionStore();

  useEffect(() => {
    // Initialize region detection
    initialize();
  }, [initialize]);

  // Loading state with Aurora design
  if (authLoading || isDetecting || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        
        {/* Aurora Background */}
        <View style={styles.auroraContainer}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.2)', 'transparent']}
            style={[styles.auroraOrb, styles.auroraOrb1]}
          />
          <LinearGradient
            colors={['rgba(6, 182, 212, 0.15)', 'transparent']}
            style={[styles.auroraOrb, styles.auroraOrb2]}
          />
          <LinearGradient
            colors={['rgba(236, 72, 153, 0.12)', 'transparent']}
            style={[styles.auroraOrb, styles.auroraOrb3]}
          />
        </View>

        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#c084fc', '#a855f7', '#9333ea']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>🎯</Text>
          </LinearGradient>
          
          {/* Glow Effect */}
          <View style={styles.logoGlow} />
        </View>

        {/* Brand Name */}
        <Text style={styles.brandName}>{config.brandName}</Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#c084fc" />
          {isDetecting && (
            <Text style={styles.loadingText}>Detecting region...</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#030712' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(screens)" />
        <Stack.Screen name="referee" />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auroraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  auroraOrb: {
    position: 'absolute',
    borderRadius: 200,
  },
  auroraOrb1: {
    width: 400,
    height: 400,
    top: -200,
    left: -100,
  },
  auroraOrb2: {
    width: 350,
    height: 350,
    top: '30%',
    right: -150,
  },
  auroraOrb3: {
    width: 300,
    height: 300,
    bottom: -100,
    left: '20%',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 42,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    zIndex: -1,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
  },
});
