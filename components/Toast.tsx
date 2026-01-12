import React, { useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, ToastType } from '@/hooks/useToast';

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: 'bg-emerald-500/90', text: 'text-white', icon: '✓' },
  error: { bg: 'bg-red-500/90', text: 'text-white', icon: '✕' },
  info: { bg: 'bg-blue-500/90', text: 'text-white', icon: 'ℹ' },
  warning: { bg: 'bg-amber-500/90', text: 'text-white', icon: '⚠' },
};

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  onHide: (id: string) => void;
}

function ToastItem({ id, type, message, onHide }: ToastItemProps) {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const colors = TOAST_COLORS[type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide(id));
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className="mb-2"
    >
      <TouchableOpacity
        onPress={handleHide}
        activeOpacity={0.9}
        className={`${colors.bg} px-4 py-3 rounded-xl flex-row items-center shadow-lg`}
      >
        <Text className={`${colors.text} text-lg mr-2`}>{colors.icon}</Text>
        <Text className={`${colors.text} text-sm flex-1`}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { toasts, hide } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute left-4 right-4 z-50"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onHide={hide}
        />
      ))}
    </View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1">
      {children}
      <ToastContainer />
    </View>
  );
}

