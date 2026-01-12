import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <View className="mx-4 px-4 py-3 bg-emerald-500/90 rounded-xl flex-row items-center">
      <Text className="text-white text-base mr-2">✓</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold">{props.text1}</Text>
        {props.text2 && (
          <Text className="text-white/80 text-sm mt-0.5">{props.text2}</Text>
        )}
      </View>
    </View>
  ),
  error: (props) => (
    <View className="mx-4 px-4 py-3 bg-red-500/90 rounded-xl flex-row items-center">
      <Text className="text-white text-base mr-2">✕</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold">{props.text1}</Text>
        {props.text2 && (
          <Text className="text-white/80 text-sm mt-0.5">{props.text2}</Text>
        )}
      </View>
    </View>
  ),
  info: (props) => (
    <View className="mx-4 px-4 py-3 bg-zinc-800/90 rounded-xl flex-row items-center">
      <Text className="text-white text-base mr-2">ℹ</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold">{props.text1}</Text>
        {props.text2 && (
          <Text className="text-zinc-400 text-sm mt-0.5">{props.text2}</Text>
        )}
      </View>
    </View>
  ),
  warning: (props) => (
    <View className="mx-4 px-4 py-3 bg-amber-500/90 rounded-xl flex-row items-center">
      <Text className="text-white text-base mr-2">⚠</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold">{props.text1}</Text>
        {props.text2 && (
          <Text className="text-white/80 text-sm mt-0.5">{props.text2}</Text>
        )}
      </View>
    </View>
  ),
};

