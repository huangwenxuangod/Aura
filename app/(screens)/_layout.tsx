import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="prediction/[id]" />
      <Stack.Screen name="recharge" />
      <Stack.Screen name="history" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/help" />
      <Stack.Screen name="settings/terms" />
    </Stack>
  );
}

